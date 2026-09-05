import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ILineupProvider, NormalizedLineupResult, NormalizedPlayer } from '../interfaces/lineup-provider.interface';

@Injectable()
export class BesoccerProvider implements ILineupProvider {
  readonly name = 'besoccer' as const;
  private readonly logger = new Logger(BesoccerProvider.name);

  private readonly headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    Accept: 'application/json, text/html, */*',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control': 'no-cache',
  };

  private normalizeTeamName(name: string): string {
    return (name || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\b(fc|ec|sc|cr|se|afc|cf|ac|clube|esporte|futebol|de|da|do)\b/g, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();
  }

  /**
   * Consulta escalações via BeSoccer / Resultados-Futbol
   */
  async getLineup(params: {
    homeTeamName: string;
    awayTeamName: string;
    matchDate: Date;
    externalFixtureId: number;
    homeTeamExternalId: number;
    awayTeamExternalId: number;
  }): Promise<NormalizedLineupResult | null> {
    try {
      const normHome = this.normalizeTeamName(params.homeTeamName);
      const normAway = this.normalizeTeamName(params.awayTeamName);

      // Endpoint público de busca rápida
      const searchUrl = `https://pt.besoccer.com/scripts/bigdata/matches.php?action=search&team1=${encodeURIComponent(normHome)}&team2=${encodeURIComponent(normAway)}`;
      const response = await axios.get(searchUrl, { headers: this.headers, timeout: 6000 }).catch(() => null);

      if (!response || !response.data) return null;

      // Se houver dados estruturados válidos, mapeia os 22 titulares
      const data = response.data;
      if (!data.home_lineup || !data.away_lineup) return null;

      const homeStarters: NormalizedPlayer[] = [];
      const awayStarters: NormalizedPlayer[] = [];

      for (const p of data.home_lineup) {
        if (p.name) {
          homeStarters.push({
            player: p.name,
            number: p.number ? Number(p.number) : undefined,
            pos: p.pos,
            grid: p.grid,
            isStart: true,
            playerPhoto: p.photo,
          });
        }
      }

      for (const p of data.away_lineup) {
        if (p.name) {
          awayStarters.push({
            player: p.name,
            number: p.number ? Number(p.number) : undefined,
            pos: p.pos,
            grid: p.grid,
            isStart: true,
            playerPhoto: p.photo,
          });
        }
      }

      if (homeStarters.length < 11 || awayStarters.length < 11) {
        return null;
      }

      return {
        success: true,
        confirmed: true,
        source: 'besoccer',
        homeTeam: {
          starters: homeStarters,
          substitutes: [],
        },
        awayTeam: {
          starters: awayStarters,
          substitutes: [],
        },
      };
    } catch (_) {
      return null;
    }
  }
}
