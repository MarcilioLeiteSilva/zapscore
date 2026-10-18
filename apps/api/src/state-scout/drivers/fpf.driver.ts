import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { FederationDriver, StateScoutMatch } from '../interfaces/state-scout.interface';

@Injectable()
export class FpfDriver implements FederationDriver {
  private readonly logger = new Logger(FpfDriver.name);
  readonly name = 'FPF (Pernambucano)';
  readonly leagueExternalId = 622;
  readonly season = 2027; // Catalogado na API-Football como 2027

  private readonly baseUrl = 'https://fpf-pe.com.br/pt/competicoes';
  private readonly idCampeonato = '1862';
  private readonly idFases = ['4427', '4428'];

  // Cache em memória de detalhes de jogos já consultados (idjogo -> { home, away })
  private readonly matchDetailsCache = new Map<string, { home: string; away: string }>();

  async fetchSchedule(): Promise<StateScoutMatch[]> {
    this.logger.log(`[FPF-DRIVER] Iniciando coleta oficial no portal da FPF para campeonato ${this.idCampeonato}...`);
    const allMatches: StateScoutMatch[] = [];

    for (const idFase of this.idFases) {
      try {
        const matches = await this.fetchMatchesByFase(idFase);
        allMatches.push(...matches);
      } catch (err: any) {
        this.logger.warn(`[FPF-DRIVER] Erro ao coletar fase ${idFase}: ${err.message}`);
      }
    }

    this.logger.log(`[FPF-DRIVER] Coleta concluída com sucesso: ${allMatches.length} partidas oficiais catalogadas.`);
    return allMatches;
  }

  private async fetchMatchesByFase(idFase: string): Promise<StateScoutMatch[]> {
    const body = new URLSearchParams({
      idcampeonato: this.idCampeonato,
      idfase: idFase,
      rodada: '1',
    });

    const res = await fetch(`${this.baseUrl}/jogos_ajax_ver2.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: body.toString(),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ao consultar jogos da fase ${idFase}`);
    }

    const json = await res.json();
    if (!json.html) return [];

    const $ = cheerio.load(json.html);
    const rawGames: Array<{
      jogoId: string | null;
      cronolog: string;
      round: string;
      homeScore: number | null;
      awayScore: number | null;
    }> = [];

    $('.swiper-slide').each((_, slide) => {
      const roundTitle = $(slide).find('.title-rodada').text().trim() || 'Regular Season - 1';

      $(slide).find('.pr-jogos').each((_, el) => {
        const cronolog = $(el).find('.cronolog-sm').text().trim();
        const homeScoreText = $(el).find('.result .text-end').text().trim();
        const awayScoreText = $(el).find('.result .text-start').text().trim();
        const href = $(el).find('a[href*="jogo="]').attr('href') || '';
        const match = href.match(/jogo=(\d+)/);
        const jogoId = match ? match[1] : null;

        rawGames.push({
          jogoId,
          cronolog,
          round: roundTitle,
          homeScore: homeScoreText !== '' && !isNaN(parseInt(homeScoreText, 10)) ? parseInt(homeScoreText, 10) : null,
          awayScore: awayScoreText !== '' && !isNaN(parseInt(awayScoreText, 10)) ? parseInt(awayScoreText, 10) : null,
        });
      });
    });

    const parsedMatches: StateScoutMatch[] = [];

    for (const raw of rawGames) {
      if (!raw.jogoId) continue;

      // Obtém os nomes dos times via cache ou consulta pontual ao infoJogo.php
      const teamNames = await this.resolveTeamNames(raw.jogoId);
      if (!teamNames.home || !teamNames.away) continue;

      const dateInfo = this.parseCronologDate(raw.cronolog);

      parsedMatches.push({
        homeTeamName: teamNames.home,
        awayTeamName: teamNames.away,
        date: dateInfo.date,
        venueName: dateInfo.venue,
        round: raw.round,
        homeScore: raw.homeScore,
        awayScore: raw.awayScore,
        isFinished: raw.homeScore !== null && raw.awayScore !== null,
        sourceId: raw.jogoId,
      });
    }

    return parsedMatches;
  }

  private async resolveTeamNames(jogoId: string): Promise<{ home: string; away: string }> {
    if (this.matchDetailsCache.has(jogoId)) {
      return this.matchDetailsCache.get(jogoId)!;
    }

    try {
      const res = await fetch(`${this.baseUrl}/infoJogo.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        body: `idjogo=${jogoId}`,
      });

      if (!res.ok) return { home: '', away: '' };

      const html = await res.text();
      const $ = cheerio.load(html);

      let home = $('.nm-time').eq(0).text().trim();
      let away = $('.nm-time').eq(1).text().trim();

      if (!home || !away) {
        const teamElements = $('.nm-time span');
        if (teamElements.length >= 2) {
          home = $(teamElements[0]).text().trim();
          away = $(teamElements[1]).text().trim();
        }
      }

      if (home && away) {
        this.matchDetailsCache.set(jogoId, { home, away });
      }

      return { home, away };
    } catch (e: any) {
      this.logger.warn(`[FPF-DRIVER] Falha ao resolver times do jogo ${jogoId}: ${e.message}`);
      return { home: '', away: '' };
    }
  }

  /**
   * Converte o padrão textual da FPF em objeto Date UTC com estádio
   * Ex: "SAB, 17/10 - 15h00 - Paulo Coelho" -> Date(2026-10-17T18:00:00Z), venue: "Paulo Coelho"
   */
  private parseCronologDate(cronolog: string): { date: Date; venue?: string } {
    const match = cronolog.match(/(\d{1,2})\/(\d{1,2})\s*-\s*(\d{1,2})h(\d{2})(?:\s*-\s*(.*))?/);

    if (match) {
      const day = match[1].padStart(2, '0');
      const month = match[2].padStart(2, '0');
      const hour = match[3].padStart(2, '0');
      const min = match[4].padStart(2, '0');
      const venue = match[5] ? match[5].trim() : undefined;

      // Fuso horário de Pernambuco (America/Recife) é UTC-3
      const isoString = `2026-${month}-${day}T${hour}:${min}:00-03:00`;
      const date = new Date(isoString);

      if (!isNaN(date.getTime())) {
        return { date, venue };
      }
    }

    return { date: new Date(), venue: undefined };
  }
}
