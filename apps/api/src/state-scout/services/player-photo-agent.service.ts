import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as cheerio from 'cheerio';
import { PrismaService } from '../../prisma/prisma.service';

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

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cron Autônomo Diário (Executa 1 vez ao dia às 03:00 da madrugada)
   * Varre atletas sem foto cadastrada no banco e enriquece via OGol
   */
  @Cron('0 3 * * *')
  async cronDailyPlayerPhotoSync() {
    this.logger.log('[PLAYER-PHOTO-AGENT] Disparando rotina diária de enriquecimento de fotos de atletas...');
    await this.syncMissingPlayerPhotos();
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
    let updatedScorers = 0;
    let updatedLineups = 0;
    let updatedEvents = 0;
    const details: string[] = [];

    try {
      // 1. Identifica atletas na Artilharia sem foto
      const scorersMissing = await this.prisma.scorer.findMany({
        where: { playerPhoto: null },
        take: 40,
      });

      // 2. Identifica atletas nas Escalações sem foto (agrupados por nome e time)
      const lineupsMissing = await this.prisma.fixtureLineup.findMany({
        where: { playerPhoto: null },
        distinct: ['player', 'teamId'],
        take: 40,
      });

      // Mapeia atletas únicos a consultar (chave: nome do jogador)
      const targetPlayers = new Map<string, { playerName: string; teamName?: string }>();

      for (const s of scorersMissing) {
        const cleanName = s.playerName.trim();
        if (cleanName && cleanName !== 'Desconhecido') {
          targetPlayers.set(cleanName.toLowerCase(), { playerName: cleanName, teamName: s.teamName });
        }
      }

      for (const l of lineupsMissing) {
        const cleanName = l.player.trim();
        if (cleanName && cleanName !== 'Desconhecido' && !targetPlayers.has(cleanName.toLowerCase())) {
          targetPlayers.set(cleanName.toLowerCase(), { playerName: cleanName });
        }
      }

      this.logger.log(
        `[PLAYER-PHOTO-AGENT] Identificados ${targetPlayers.size} atletas sem foto para enriquecimento...`,
      );

      for (const target of targetPlayers.values()) {
        try {
          const photoUrl = await this.scrapePlayerPhotoFromOgol(target.playerName, target.teamName);

          if (photoUrl) {
            // Atualiza Scorer
            const sUpdate = await this.prisma.scorer.updateMany({
              where: { playerName: target.playerName, playerPhoto: null },
              data: { playerPhoto: photoUrl },
            });
            updatedScorers += sUpdate.count;

            // Atualiza FixtureLineup
            const lUpdate = await this.prisma.fixtureLineup.updateMany({
              where: { player: target.playerName, playerPhoto: null },
              data: { playerPhoto: photoUrl },
            });
            updatedLineups += lUpdate.count;

            // Atualiza FixtureEvent
            const eUpdate = await this.prisma.fixtureEvent.updateMany({
              where: { player: target.playerName, playerPhoto: null },
              data: { playerPhoto: photoUrl },
            });
            updatedEvents += eUpdate.count;

            const logMsg = `Foto vinculada para ${target.playerName} (${target.teamName || 'Geral'}): ${photoUrl}`;
            this.logger.log(`[PLAYER-PHOTO-AGENT ✅] ${logMsg}`);
            details.push(logMsg);
          }
        } catch (playerErr: any) {
          this.logger.warn(
            `[PLAYER-PHOTO-AGENT] Falha ao processar atleta ${target.playerName}: ${playerErr.message}`,
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
   * Realiza a raspagem cirúrgica da foto oficial do jogador no OGol
   */
  async scrapePlayerPhotoFromOgol(playerName: string, teamName?: string): Promise<string | null> {
    const cleanPlayer = playerName.trim();
    if (!cleanPlayer) return null;

    const url = `https://www.ogol.com.br/pesquisa?search_txt=${encodeURIComponent(cleanPlayer)}`;

    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
    });

    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);

    let resolvedPhoto: string | null = null;
    const normPlayer = this.normalize(cleanPlayer);
    const normTeam = teamName ? this.normalize(teamName) : '';

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

      // Verificação de correspondência do nome
      const nameMatches =
        nTitle === normPlayer ||
        nSubtitle.includes(normPlayer) ||
        normPlayer.includes(nTitle) ||
        (normPlayer.length > 3 && nSubtitle.split(' ').includes(normPlayer));

      // Se temos o time, dá preferência ao time correspondente
      const teamMatches = normTeam ? nTeam.includes(normTeam) || normTeam.includes(nTeam) : true;

      if (nameMatches && teamMatches) {
        resolvedPhoto = imgSrc.startsWith('/') ? `https://www.ogol.com.br${imgSrc}` : imgSrc;
      }
    });

    // Se não encontrou com filtro estrito de time, tenta apenas por nome completo caso seja único
    if (!resolvedPhoto) {
      $('.zz-search-item.player').each((_, el) => {
        if (resolvedPhoto) return;

        const title = $(el).find('.content a.title').text().trim();
        const subtitle = $(el).find('.content .subtitle').text().trim();
        const imgSrc = $(el).find('.img img').attr('src') || '';

        if (!imgSrc || imgSrc.includes('default') || !imgSrc.includes('/jogadores/')) {
          return;
        }

        const nTitle = this.normalize(title);
        const nSubtitle = this.normalize(subtitle);

        if (nTitle === normPlayer || (normPlayer.length >= 5 && nSubtitle.includes(normPlayer))) {
          resolvedPhoto = imgSrc.startsWith('/') ? `https://www.ogol.com.br${imgSrc}` : imgSrc;
        }
      });
    }

    return resolvedPhoto;
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
