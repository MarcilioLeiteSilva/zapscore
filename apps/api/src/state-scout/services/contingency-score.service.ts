import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';

export interface ContingencyMatchScore {
  homeScore: number;
  awayScore: number;
  isFinished: boolean;
  source: string;
  goals?: Array<{
    player: string;
    minute: number;
    team: 'home' | 'away';
  }>;
}

@Injectable()
export class ContingencyScoreService {
  private readonly logger = new Logger(ContingencyScoreService.name);

  /**
   * Tenta resolver o placar e gols de uma partida através de fontes de contingência
   * em cascata: SuperPlacar / Portais Rápidos -> OGol -> GE
   */
  async findFallbackScore(
    homeTeamName: string,
    awayTeamName: string,
    _matchDate?: Date,
  ): Promise<ContingencyMatchScore | null> {
    this.logger.log(
      `[CONTINGENCY-SCORE] Buscando placar de contingência para: ${homeTeamName} x ${awayTeamName}...`,
    );

    // 1. Tenta SuperPlacar / Resultados Rápidos Estaduais (Altíssima cobertura de A2/Turnos)
    try {
      const spScore = await this.scrapeSuperPlacar(homeTeamName, awayTeamName);
      if (spScore) {
        this.logger.log(
          `[CONTINGENCY-SCORE ✅] Placar localizado no SuperPlacar: ${homeTeamName} ${spScore.homeScore} x ${spScore.awayScore} ${awayTeamName}`,
        );
        return spScore;
      }
    } catch (err: any) {
      this.logger.warn(`[CONTINGENCY-SCORE] Erro na consulta ao SuperPlacar: ${err.message}`);
    }

    // 2. Tenta OGol (ogol.com.br)
    try {
      const ogolScore = await this.scrapeOgol(homeTeamName, awayTeamName);
      if (ogolScore) {
        this.logger.log(
          `[CONTINGENCY-SCORE ✅] Placar localizado no OGol: ${homeTeamName} ${ogolScore.homeScore} x ${ogolScore.awayScore} ${awayTeamName}`,
        );
        return ogolScore;
      }
    } catch (err: any) {
      this.logger.warn(`[CONTINGENCY-SCORE] Erro na consulta ao OGol: ${err.message}`);
    }

    // 3. Tenta GE (ge.globo.com)
    try {
      const geScore = await this.scrapeGeGlobo(homeTeamName, awayTeamName);
      if (geScore) {
        this.logger.log(
          `[CONTINGENCY-SCORE ✅] Placar localizado no GE: ${homeTeamName} ${geScore.homeScore} x ${geScore.awayScore} ${awayTeamName}`,
        );
        return geScore;
      }
    } catch (err: any) {
      this.logger.warn(`[CONTINGENCY-SCORE] Erro na consulta ao GE: ${err.message}`);
    }

    this.logger.log(
      `[CONTINGENCY-SCORE] Nenhuma fonte de contingência possui o placar consolidado ainda para ${homeTeamName} x ${awayTeamName}.`,
    );
    return null;
  }

  /**
   * Fonte 1: SuperPlacar (Resultados rápidos e gols detalhados)
   */
  private async scrapeSuperPlacar(
    homeName: string,
    awayName: string,
  ): Promise<ContingencyMatchScore | null> {
    const res = await fetch('https://www.superplacar.com.br/', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);

    const normHome = this.normalize(homeName);
    const normAway = this.normalize(awayName);

    let matchFound: ContingencyMatchScore | null = null;

    $('.jogo').each((_, el) => {
      if (matchFound) return;

      const t1 = $(el).find('.time-1 .nome-time').text().trim();
      const t2 = $(el).find('.time-2 .nome-time').text().trim();
      const placarText = $(el).find('.placar').text().trim(); // Ex: "0 - 4"

      if (!t1 || !t2 || !placarText) return;

      const normT1 = this.normalize(t1);
      const normT2 = this.normalize(t2);

      const matchesOrder =
        (normT1.includes(normHome) || normHome.includes(normT1)) &&
        (normT2.includes(normAway) || normAway.includes(normT2));

      const matchesReverse =
        (normT1.includes(normAway) || normAway.includes(normT1)) &&
        (normT2.includes(normHome) || normHome.includes(normT2));

      if (matchesOrder || matchesReverse) {
        const parts = placarText.split('-').map((p) => parseInt(p.trim(), 10));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          const homeScore = matchesOrder ? parts[0] : parts[1];
          const awayScore = matchesOrder ? parts[1] : parts[0];

          // Extrai eventos de gols se disponíveis
          const goals: Array<{ player: string; minute: number; team: 'home' | 'away' }> = [];

          $(el)
            .find('.resultado.gols .time-1 p')
            .each((_, p) => {
              const player = $(p).find('span').text().trim();
              const minText = $(p).find('strong').text().trim();
              const minuteMatch = minText.match(/(\d+)/);
              const minute = minuteMatch ? parseInt(minuteMatch[1], 10) : 1;
              if (player) {
                goals.push({
                  player,
                  minute,
                  team: matchesOrder ? 'home' : 'away',
                });
              }
            });

          $(el)
            .find('.resultado.gols .time-2 p')
            .each((_, p) => {
              const player = $(p).find('span').text().trim();
              const minText = $(p).find('strong').text().trim();
              const minuteMatch = minText.match(/(\d+)/);
              const minute = minuteMatch ? parseInt(minuteMatch[1], 10) : 1;
              if (player) {
                goals.push({
                  player,
                  minute,
                  team: matchesOrder ? 'away' : 'home',
                });
              }
            });

          // Valida rigorosamente se a partida está de fato encerrada no SuperPlacar
          const statusText = $(el).find('.status').text().trim().toLowerCase();
          const isEncerrado =
            $(el).hasClass('encerrado') ||
            statusText.includes('encerrado') ||
            statusText.includes('fim') ||
            statusText.includes('final');

          matchFound = {
            homeScore,
            awayScore,
            isFinished: isEncerrado,
            source: 'SuperPlacar',
            goals,
          };
        }
      }
    });

    return matchFound;
  }

  /**
   * Fonte 2: OGol (ogol.com.br)
   */
  private async scrapeOgol(
    homeName: string,
    awayName: string,
  ): Promise<ContingencyMatchScore | null> {
    const query = encodeURIComponent(`${homeName} ${awayName}`);
    const res = await fetch(`https://www.ogol.com.br/search.php?inputForm=geral&search_txt=${query}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
    });

    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);

    // Procura por resultados de jogos no padrão do OGol
    let matchScore: ContingencyMatchScore | null = null;
    const normHome = this.normalize(homeName);
    const normAway = this.normalize(awayName);

    $('tr').each((_, tr) => {
      if (matchScore) return;
      const text = $(tr).text().toLowerCase();
      if (text.includes(normHome) && text.includes(normAway)) {
        // Tenta capturar padrão "X - Y" ou "X-Y"
        const scoreMatch = $(tr).text().match(/(\d+)\s*[-xX]\s*(\d+)/);
        if (scoreMatch) {
          matchScore = {
            homeScore: parseInt(scoreMatch[1], 10),
            awayScore: parseInt(scoreMatch[2], 10),
            isFinished: true,
            source: 'OGol',
          };
        }
      }
    });

    return matchScore;
  }

  /**
   * Fonte 3: GE Globo (ge.globo.com)
   */
  private async scrapeGeGlobo(
    homeName: string,
    awayName: string,
  ): Promise<ContingencyMatchScore | null> {
    // Consulta API pública de tempo real do GE para estaduais/jogos de hoje
    const res = await fetch('https://api.globoesporte.globo.com/cobertura/jogos/hoje/', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) return null;
    try {
      const data = await res.json();
      if (!Array.isArray(data)) return null;

      const normHome = this.normalize(homeName);
      const normAway = this.normalize(awayName);

      for (const jogo of data) {
        const equipeMandante = this.normalize(jogo.equipes?.mandante?.nome_popular || '');
        const equipeVisitante = this.normalize(jogo.equipes?.visitante?.nome_popular || '');

        if (
          (equipeMandante.includes(normHome) || normHome.includes(equipeMandante)) &&
          (equipeVisitante.includes(normAway) || normAway.includes(equipeVisitante))
        ) {
          const homeScore = jogo.placar_oficial_mandante;
          const awayScore = jogo.placar_oficial_visitante;

          if (homeScore !== null && awayScore !== null && typeof homeScore === 'number') {
            return {
              homeScore,
              awayScore,
              isFinished: jogo.status === 'encerrado' || jogo.fase_jogo === 'FIM',
              source: 'GE Globo',
            };
          }
        }
      }
    } catch {
      // Ignora erro de JSON e segue
    }

    return null;
  }

  private normalize(str: string): string {
    return (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();
  }
}
