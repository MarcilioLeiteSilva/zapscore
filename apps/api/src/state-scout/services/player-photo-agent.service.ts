import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as cheerio from 'cheerio';
import { PrismaService } from '../../prisma/prisma.service';

export type PhotoSyncFrequency = '30m' | '1h' | '2x_day' | '1x_day';

export interface PlayerPhotoAgentConfig {
  frequency: PhotoSyncFrequency;
  lastRunTimestamp: string | null;
  nextRunEstimated: string | null;
  isRunning: boolean;
}

export interface PlayerPhotoSyncResult {
  updatedScorers: number;
  updatedLineups: number;
  updatedEvents: number;
  details: string[];
}

@Injectable()
export class PlayerPhotoAgentService {
  private readonly logger = new Logger(PlayerPhotoAgentService.name);
  private isRunning = false;
  private frequency: PhotoSyncFrequency = '1x_day';
  private lastRunAt: Date | null = null;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ticker de alta precisão a cada 15 minutos que avalia a frequência configurada:
   * - 30m: executa se decorridos >= 30 minutos
   * - 1h: executa se decorridos >= 60 minutos
   * - 2x_day: executa se decorridos >= 12 horas (720 min)
   * - 1x_day: executa se decorridos >= 24 horas (1440 min)
   */
  @Cron('*/15 * * * *')
  async cronFrequencyTicker() {
    if (this.isRunning) return;

    const now = Date.now();
    const lastRunTime = this.lastRunAt ? this.lastRunAt.getTime() : 0;
    const elapsedMinutes = (now - lastRunTime) / (60 * 1000);

    let requiredMinutes = 24 * 60; // 1x_day padrão
    if (this.frequency === '30m') requiredMinutes = 30;
    else if (this.frequency === '1h') requiredMinutes = 60;
    else if (this.frequency === '2x_day') requiredMinutes = 12 * 60;
    else if (this.frequency === '1x_day') requiredMinutes = 24 * 60;

    if (elapsedMinutes >= requiredMinutes) {
      this.logger.log(
        `[PLAYER-PHOTO-AGENT] Disparando busca de fotos por frequência (${this.frequency}, decorridos ${Math.round(elapsedMinutes)}m)...`,
      );
      await this.syncMissingPlayerPhotos();
    }
  }

  /**
   * Cron Autônomo Diário de Segurança (03:00 da madrugada)
   * Garante a execução na madrugada quando em modo 1 vez ao dia
   */
  @Cron('0 3 * * *')
  async cronDailyPlayerPhotoSync() {
    if (this.frequency === '1x_day') {
      this.logger.log('[PLAYER-PHOTO-AGENT] Disparando rotina diária de fotos de atletas (03:00)...');
      await this.syncMissingPlayerPhotos();
    }
  }

  /**
   * Retorna a configuração atual de frequência e telemetria do agente de fotos
   */
  getConfig(): PlayerPhotoAgentConfig {
    let intervalMs = 24 * 60 * 60 * 1000;
    if (this.frequency === '30m') intervalMs = 30 * 60 * 1000;
    else if (this.frequency === '1h') intervalMs = 60 * 60 * 1000;
    else if (this.frequency === '2x_day') intervalMs = 12 * 60 * 60 * 1000;
    else if (this.frequency === '1x_day') intervalMs = 24 * 60 * 60 * 1000;

    const nextEstimated = this.lastRunAt
      ? new Date(this.lastRunAt.getTime() + intervalMs).toISOString()
      : new Date().toISOString();

    return {
      frequency: this.frequency,
      lastRunTimestamp: this.lastRunAt ? this.lastRunAt.toISOString() : null,
      nextRunEstimated: nextEstimated,
      isRunning: this.isRunning,
    };
  }

  /**
   * Atualiza a frequência de execução do agente de fotos:
   * '30m' | '1h' | '2x_day' | '1x_day'
   */
  setFrequency(newFreq: PhotoSyncFrequency): PlayerPhotoAgentConfig {
    if (['30m', '1h', '2x_day', '1x_day'].includes(newFreq)) {
      this.frequency = newFreq;
      this.logger.log(`[PLAYER-PHOTO-AGENT] Frequência alterada para: ${newFreq}`);
    }
    return this.getConfig();
  }

  /**
   * Sanitiza caracteres com corrupção de encoding UTF-8 (mojibake)
   * Ex: "Adriano BrandÃ£o" -> "Adriano Brandão"
   */
  private fixMojibake(str: string): string {
    if (!str) return '';
    let result = str;
    try {
      if (/[\u00C0-\u00C3\u00C8-\u00CB\u00CC-\u00CF\u00D2-\u00D5\u00D9-\u00DC][\u0080-\u00BF]/.test(str) || /Ã[¡©£³º§ªµ]/.test(str)) {
        const converted = Buffer.from(str, 'latin1').toString('utf8');
        if (!converted.includes('\uFFFD')) {
          result = converted;
        }
      }
    } catch {}

    return result
      .replace(/Ã£/g, 'ã')
      .replace(/Ã¡/g, 'á')
      .replace(/Ã©/g, 'é')
      .replace(/Ã­/g, 'í')
      .replace(/Ã³/g, 'ó')
      .replace(/Ãº/g, 'ú')
      .replace(/Ã§/g, 'ç')
      .replace(/Ã¢/g, 'â')
      .replace(/Ãª/g, 'ê')
      .replace(/Ã´/g, 'ô')
      .replace(/Ã/g, 'à')
      .replace(/Â/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Gera variações de busca inteligentes para contornar limitações do motor do OGol:
   * 1. Nome civil completo sanitizado
   * 2. Primeiro nome + Segundo nome (ex: "Adriano Brandão")
   * 3. Primeiro nome + Último sobrenome (ex: "Adriano Lima")
   */
  private generateSearchQueries(fullName: string): string[] {
    const clean = this.fixMojibake(fullName).trim();
    if (!clean) return [];

    const queries = new Set<string>();
    queries.add(clean);

    const parts = clean
      .split(/\s+/)
      .filter((p) => !['de', 'da', 'do', 'dos', 'das', 'e'].includes(p.toLowerCase()));

    if (parts.length >= 3) {
      queries.add(`${parts[0]} ${parts[1]}`);
      queries.add(`${parts[0]} ${parts[parts.length - 1]}`);
    }

    return Array.from(queries);
  }

  /**
   * Executa a busca e sincronização de fotos pendentes (com cache permanente)
   */
  async syncMissingPlayerPhotos(): Promise<PlayerPhotoSyncResult> {
    if (this.isRunning) {
      this.logger.warn('[PLAYER-PHOTO-AGENT] Sincronização já em execução. Ignorando chamada concorrente.');
      return { updatedScorers: 0, updatedLineups: 0, updatedEvents: 0, details: ['Execução já em andamento'] };
    }

    this.isRunning = true;
    this.lastRunAt = new Date();
    let updatedScorers = 0;
    let updatedLineups = 0;
    let updatedEvents = 0;
    const details: string[] = [];

    try {
      // 1. Identifica atletas na Artilharia sem foto (priorizando os mais recentemente atualizados para evitar starvation)
      const scorersMissing = await this.prisma.scorer.findMany({
        where: { playerPhoto: null },
        orderBy: { updatedAt: 'desc' },
        take: 60,
      });

      // 2. Identifica atletas nas Escalações sem foto (priorizando os mais recentes)
      const lineupsMissing = await this.prisma.fixtureLineup.findMany({
        where: { playerPhoto: null },
        distinct: ['player', 'teamId'],
        orderBy: { createdAt: 'desc' },
        take: 60,
      });

      // Mapeia atletas únicos a consultar (chave: nome limpo normalizado)
      const targetPlayers = new Map<
        string,
        { rawName: string; cleanName: string; teamName?: string }
      >();

      for (const s of scorersMissing) {
        const raw = s.playerName.trim();
        const clean = this.fixMojibake(raw);
        if (clean && clean !== 'Desconhecido') {
          targetPlayers.set(clean.toLowerCase(), {
            rawName: raw,
            cleanName: clean,
            teamName: s.teamName,
          });
        }
      }

      for (const l of lineupsMissing) {
        const raw = l.player.trim();
        const clean = this.fixMojibake(raw);
        if (clean && clean !== 'Desconhecido' && !targetPlayers.has(clean.toLowerCase())) {
          targetPlayers.set(clean.toLowerCase(), {
            rawName: raw,
            cleanName: clean,
          });
        }
      }

      this.logger.log(
        `[PLAYER-PHOTO-AGENT] Identificados ${targetPlayers.size} atletas sem foto para enriquecimento prioritário...`,
      );

      for (const target of targetPlayers.values()) {
        try {
          const photoUrl = await this.scrapePlayerPhotoFromOgol(target.cleanName, target.teamName);

          if (photoUrl) {
            const nameConditions = [target.rawName, target.cleanName];

            // Atualiza Scorer (suportando tanto o nome original com mojibake quanto o nome limpo)
            const sUpdate = await this.prisma.scorer.updateMany({
              where: {
                playerName: { in: nameConditions },
                playerPhoto: null,
              },
              data: {
                playerPhoto: photoUrl,
                ...(target.rawName !== target.cleanName && { playerName: target.cleanName }),
              },
            });
            updatedScorers += sUpdate.count;

            // Atualiza FixtureLineup
            const lUpdate = await this.prisma.fixtureLineup.updateMany({
              where: {
                player: { in: nameConditions },
                playerPhoto: null,
              },
              data: {
                playerPhoto: photoUrl,
                ...(target.rawName !== target.cleanName && { player: target.cleanName }),
              },
            });
            updatedLineups += lUpdate.count;

            // Atualiza FixtureEvent
            const eUpdate = await this.prisma.fixtureEvent.updateMany({
              where: {
                player: { in: nameConditions },
                playerPhoto: null,
              },
              data: {
                playerPhoto: photoUrl,
                ...(target.rawName !== target.cleanName && { player: target.cleanName }),
              },
            });
            updatedEvents += eUpdate.count;

            const logMsg = `Foto vinculada para ${target.cleanName} (${target.teamName || 'Geral'}): ${photoUrl}`;
            this.logger.log(`[PLAYER-PHOTO-AGENT ✅] ${logMsg}`);
            details.push(logMsg);
          }
        } catch (playerErr: any) {
          this.logger.warn(
            `[PLAYER-PHOTO-AGENT] Falha ao processar atleta ${target.cleanName}: ${playerErr.message}`,
          );
        }
      }
    } catch (err: any) {
      this.logger.error(`[PLAYER-PHOTO-AGENT] Erro geral na sincronização: ${err.message}`, err.stack);
    } finally {
      this.isRunning = false;
    }

    return { updatedScorers, updatedLineups, updatedEvents, details };
  }

  /**
   * Realiza a raspagem cirúrgica da foto oficial do jogador no OGol com suporte
   * a mojibake sanitization, cascata de queries e correspondência fuzzy de apelidos.
   */
  async scrapePlayerPhotoFromOgol(playerName: string, teamName?: string): Promise<string | null> {
    const cleanPlayer = this.fixMojibake(playerName).trim();
    if (!cleanPlayer) return null;

    const queries = this.generateSearchQueries(cleanPlayer);
    const normPlayer = this.normalize(cleanPlayer);
    const normTeam = teamName ? this.normalize(teamName) : '';

    for (const q of queries) {
      try {
        const url = `https://www.ogol.com.br/pesquisa?search_txt=${encodeURIComponent(q)}`;

        const res = await fetch(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'pt-BR,pt;q=0.9',
          },
        });

        if (!res.ok) continue;
        const html = await res.text();
        const $ = cheerio.load(html);

        let resolvedPhoto: string | null = null;

        $('.zz-search-item.player').each((_, el) => {
          if (resolvedPhoto) return;

          const title = $(el).find('.content a.title').text().trim();
          const subtitle = $(el).find('.content .subtitle').text().trim();
          const teamText = $(el).find('.content .details').text().trim();
          const imgSrc = $(el).find('.img img').attr('src') || '';

          if (!imgSrc || imgSrc.includes('default') || imgSrc.includes('avatar') || !imgSrc.includes('/jogadores/')) {
            return;
          }

          const nTitle = this.normalize(title);
          const nSubtitle = this.normalize(subtitle);
          const nTeam = this.normalize(teamText);

          const playerWords = normPlayer
            .split(' ')
            .filter((w) => w.length >= 3 && !['de', 'da', 'do', 'dos', 'das'].includes(w));
          const firstWordMatches =
            playerWords.length > 0 &&
            (nSubtitle.includes(playerWords[0]) || nTitle.includes(playerWords[0]));
          const lastWordMatches =
            playerWords.length > 1 &&
            (nSubtitle.includes(playerWords[playerWords.length - 1]) ||
              nTitle.includes(playerWords[playerWords.length - 1]));

          const nameMatches =
            nTitle === normPlayer ||
            nSubtitle === normPlayer ||
            nSubtitle.includes(normPlayer) ||
            normPlayer.includes(nSubtitle) ||
            (firstWordMatches && lastWordMatches);

          const teamMatches = normTeam ? nTeam.includes(normTeam) || normTeam.includes(nTeam) : false;

          // Confirmação de alta confiança: nome + clube OU nome civil exatamente idêntico
          if ((nameMatches && teamMatches) || nSubtitle === normPlayer) {
            resolvedPhoto = imgSrc.startsWith('/') ? `https://www.ogol.com.br${imgSrc}` : imgSrc;
          }
        });

        if (resolvedPhoto) {
          return resolvedPhoto;
        }
      } catch (err: any) {
        this.logger.debug(`[PLAYER-PHOTO-AGENT] Falha na query "${q}": ${err.message}`);
      }
    }

    return null;
  }

  private normalize(str: string): string {
    return (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
