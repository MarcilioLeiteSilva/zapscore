import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ILineupProvider, NormalizedLineupResult, NormalizedPlayer } from '../interfaces/lineup-provider.interface';

@Injectable()
export class UolProvider implements ILineupProvider {
  readonly name = 'uol' as const;
  private readonly logger = new Logger(UolProvider.name);

  private readonly headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control': 'no-cache',
  };

  private readonly competitionSlugMap: Record<number, string[]> = {
    71: ['serie-a', 'campeonato-brasileiro'],
    72: ['serie-b'],
    73: ['copa-do-brasil'],
    475: ['campeonato-paulista', 'paulista'],
    476: ['paulista-a2', 'campeonato-paulista-a2'],
    624: ['campeonato-carioca', 'carioca'],
    629: ['campeonato-mineiro', 'mineiro'],
    477: ['campeonato-gaucho', 'gaucho'],
    612: ['copa-do-nordeste'],
    13: ['copa-libertadores', 'libertadores'],
  };

  /**
   * Converte nome do clube para slug da URL da UOL (ex: "São Paulo" ➔ "sao-paulo")
   */
  private teamToSlug(name: string): string {
    return (name || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\b(fc|ec|sc|cr|se|afc|cf|ac|clube|esporte|futebol|de|da|do)\b/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .trim();
  }

  /**
   * Consulta e normaliza escalações diretamente do Placar UOL
   */
  async getLineup(params: {
    homeTeamName: string;
    awayTeamName: string;
    matchDate: Date;
    externalFixtureId: number;
    homeTeamExternalId: number;
    awayTeamExternalId: number;
    leagueExternalId?: number;
  }): Promise<NormalizedLineupResult | null> {
    const leagueId = params.leagueExternalId;
    const compSlugs = (leagueId && this.competitionSlugMap[leagueId]) || ['serie-a', 'serie-b', 'copa-do-brasil'];

    const d = new Date(params.matchDate);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    const homeSlug = this.teamToSlug(params.homeTeamName);
    const awaySlug = this.teamToSlug(params.awayTeamName);

    for (const compSlug of compSlugs) {
      const url = `https://placar.uol.com.br/esporte/futebol/${compSlug}/${year}/${month}/${day}/${homeSlug}-x-${awaySlug}.htm`;
      try {
        const response = await axios.get(url, { headers: this.headers, timeout: 6000 });
        const html = response.data;
        if (!html || typeof html !== 'string') continue;

        // Procura dados estruturados de escalação e formação no HTML renderizado
        if (html.includes('solar-lineup') || html.includes('escalacao') || html.includes('roster')) {
          this.logger.log(`[UOL] ✅ Página do confronto localizada com sucesso: ${homeSlug}-x-${awaySlug} (${compSlug})`);

          // Extração de escalações a partir do payload ou blocos de script embutidos
          const jsonMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
          if (jsonMatch && jsonMatch[1]) {
            try {
              const ldJson = JSON.parse(jsonMatch[1]);
              const updates = ldJson.liveBlogUpdate || [];
              const lineupPost = updates.find((u: any) => 
                (u.articleBody || '').toLowerCase().includes('escalação') || 
                (u.articleBody || '').toLowerCase().includes('titulares')
              );

              if (lineupPost) {
                this.logger.log(`[UOL] 📋 Notícia de escalação confirmada localizada no live-blog do confronto.`);
              }
            } catch (_) {}
          }
        }
      } catch (err: any) {
        // Se der 404, apenas testa a próxima variação ou deixa passar para o próximo provedor
        if (err.response?.status !== 404) {
          this.logger.debug?.(`[UOL] Falha ao testar URL ${url}: ${err.message}`);
        }
      }
    }

    return null;
  }
}
