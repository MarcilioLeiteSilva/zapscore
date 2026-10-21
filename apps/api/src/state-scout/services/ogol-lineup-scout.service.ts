import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FixturesGateway } from '../../fixtures/fixtures.gateway';
import { normalizeTeamString, STATE_LEAGUE_ALIASES } from '../config/team-aliases.config';
import * as cheerio from 'cheerio';

export interface OgolPlayerLineup {
  name: string;
  ogolUrl: string | null;
  ogolPlayerId: string | null;
}

export interface OgolTeamLineup {
  teamName: string;
  starters: OgolPlayerLineup[];
  lastMatchDate?: string;
}

export interface OgolLineupSyncResult {
  scannedMatches: number;
  syncedMatches: number;
  updatedLineupsCount: number;
  details: string[];
}

@Injectable()
export class OgolLineupScoutService {
  private readonly logger = new Logger(OgolLineupScoutService.name);

  // Mapeamento de ligas estaduais para a página canônica da edição no OGol
  private readonly ogolEditions: Record<number, string> = {
    // Campeonato Pernambucano (Liga 622)
    622: 'https://www.ogol.com.br/edicao/campeonato-pernambucano-2026-27-turno-forro/225812',
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly fixturesGateway: FixturesGateway,
  ) {}

  /**
   * Sincroniza escalações iniciais (Últimos Titulares) para partidas estaduais sem dados
   */
  async syncUpcomingLineups(leagueExternalId = 622): Promise<OgolLineupSyncResult> {
    const details: string[] = [];
    let syncedMatches = 0;
    let updatedLineupsCount = 0;

    const editionUrl = this.ogolEditions[leagueExternalId];
    if (!editionUrl) {
      const msg = `Nenhuma edição cadastrada no OGol para a liga #${leagueExternalId}`;
      this.logger.warn(`[OGOL-LINEUP] ${msg}`);
      return { scannedMatches: 0, syncedMatches: 0, updatedLineupsCount: 0, details: [msg] };
    }

    try {
      this.logger.log(`[OGOL-LINEUP] 🔎 Buscando partidas da edição no OGol: ${editionUrl}`);
      const ogolMatches = await this.scrapeEditionMatches(editionUrl);
      this.logger.log(`[OGOL-LINEUP] Encontrados ${ogolMatches.length} jogos na edição do OGol.`);

      // 2. Busca partidas do estadual no banco sem escalação completa
      const fixtures = await this.prisma.fixture.findMany({
        where: {
          league: { externalId: leagueExternalId },
          statusShort: { in: ['NS', 'TBD', '1H', '2H', 'HT', 'LIVE'] },
        },
        include: {
          homeTeam: true,
          awayTeam: true,
          lineups: true,
        },
        orderBy: { date: 'asc' },
      });

      this.logger.log(
        `[OGOL-LINEUP] Avaliando ${fixtures.length} partidas no banco ZapScore para a liga #${leagueExternalId}...`,
      );

      for (const fixture of fixtures) {
        // Se ambos os times já têm 11 titulares, ignora
        const homeStarters = fixture.lineups.filter(
          (l) => l.teamId === fixture.homeTeam.externalId && l.isStart,
        );
        const awayStarters = fixture.lineups.filter(
          (l) => l.teamId === fixture.awayTeam.externalId && l.isStart,
        );

        if (homeStarters.length >= 11 && awayStarters.length >= 11) {
          continue;
        }

        // 3. Pareamento com o slug de jogos do OGol
        const matchedOgolMatch = this.findMatchingOgolMatch(
          ogolMatches,
          fixture.homeTeam.name,
          fixture.awayTeam.name,
          leagueExternalId,
        );

        if (!matchedOgolMatch) {
          continue;
        }

        this.logger.log(
          `[OGOL-LINEUP] Partida casada: ${fixture.homeTeam.name} x ${fixture.awayTeam.name} -> ${matchedOgolMatch.href}`,
        );

        // 4. Faz o scraping dos "Últimos Titulares" da partida no OGol
        const lineups = await this.scrapeMatchTitulares(matchedOgolMatch.href);
        if (!lineups || lineups.length === 0) {
          continue;
        }

        let matchUpdated = false;

        // Processa mandante
        const homeLineupData = this.matchTeamLineup(lineups, fixture.homeTeam.name, leagueExternalId);
        if (homeLineupData && homeLineupData.starters.length > 0 && homeStarters.length < 11) {
          await this.persistTeamStarters(fixture.id, fixture.homeTeam.externalId, homeLineupData.starters);
          updatedLineupsCount += homeLineupData.starters.length;
          matchUpdated = true;
        }

        // Processa visitante
        const awayLineupData = this.matchTeamLineup(lineups, fixture.awayTeam.name, leagueExternalId);
        if (awayLineupData && awayLineupData.starters.length > 0 && awayStarters.length < 11) {
          await this.persistTeamStarters(fixture.id, fixture.awayTeam.externalId, awayLineupData.starters);
          updatedLineupsCount += awayLineupData.starters.length;
          matchUpdated = true;
        }

        if (matchUpdated) {
          syncedMatches++;
          const info = `Escalação inicial sincronizada: ${fixture.homeTeam.name} x ${fixture.awayTeam.name}`;
          details.push(info);
          this.logger.log(`[OGOL-LINEUP] ✅ ${info}`);

          // Notifica os apps móveis via WebSocket em tempo real
          const updated = await this.prisma.fixture.findUnique({
            where: { id: fixture.id },
            include: { homeTeam: true, awayTeam: true, lineups: true },
          });
          if (updated) {
            this.fixturesGateway.emitFixtureUpdate(fixture.id, updated);
          }
        }
      }

      return {
        scannedMatches: fixtures.length,
        syncedMatches,
        updatedLineupsCount,
        details,
      };
    } catch (err: any) {
      this.logger.error(`[OGOL-LINEUP] Erro durante a sincronização: ${err.message}`);
      return {
        scannedMatches: 0,
        syncedMatches: 0,
        updatedLineupsCount: 0,
        details: [`Erro: ${err.message}`],
      };
    }
  }

  /**
   * Extrai a listagem de jogos de uma edição no OGol
   */
  private async scrapeEditionMatches(
    editionUrl: string,
  ): Promise<Array<{ href: string; slug: string; id: string }>> {
    const res = await fetch(editionUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    if (!res.ok) {
      throw new Error(`Falha ao acessar edição OGol (${res.status})`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const matches: Array<{ href: string; slug: string; id: string }> = [];

    $('a[href*="/jogo/"]').each((i, el) => {
      const href = $(el).attr('href');
      if (!href) return;

      const matchSlug = href.split('/jogo/')[1];
      if (matchSlug && !matches.some((m) => m.href === href)) {
        const parts = matchSlug.split('/');
        const slugAndDate = parts[0];
        const id = parts[1] || '';

        matches.push({
          href: href.startsWith('http') ? href : `https://www.ogol.com.br${href}`,
          slug: slugAndDate,
          id,
        });
      }
    });

    return matches;
  }

  /**
   * Extrai os titulares da página de uma partida no OGol
   */
  private async scrapeMatchTitulares(matchUrl: string): Promise<OgolTeamLineup[] | null> {
    try {
      const res = await fetch(matchUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        },
      });

      if (!res.ok) return null;

      const html = await res.text();
      const $ = cheerio.load(html);

      const header = $('h2.header:contains("Últimos Titulares")');
      if (header.length === 0) return null;

      const card = header.parent().parent();
      const body = card.find('.card-data__body');
      const teams: OgolTeamLineup[] = [];

      body.find('.section').each((i, el) => {
        const sectionText = $(el).text().trim();
        const teamNameRaw = sectionText.split('(')[0].trim();
        const nextP = $(el).next('p');

        const starters: OgolPlayerLineup[] = [];
        nextP.find('a').each((j, a) => {
          const playerName = $(a).text().trim();
          const playerHref = $(a).attr('href') || null;
          let ogolPlayerId: string | null = null;
          if (playerHref) {
            const parts = playerHref.split('/');
            ogolPlayerId = parts[parts.length - 1] || null;
          }
          starters.push({
            name: playerName,
            ogolUrl: playerHref
              ? playerHref.startsWith('http')
                ? playerHref
                : `https://www.ogol.com.br${playerHref}`
              : null,
            ogolPlayerId,
          });
        });

        teams.push({
          teamName: teamNameRaw,
          starters,
        });
      });

      return teams;
    } catch (err: any) {
      this.logger.warn(`[OGOL-LINEUP] Falha ao extrair titulares de ${matchUrl}: ${err.message}`);
      return null;
    }
  }

  /**
   * Localiza no catálogo de partidas do OGol o confronto correspondente
   */
  private findMatchingOgolMatch(
    ogolMatches: Array<{ href: string; slug: string; id: string }>,
    homeTeamName: string,
    awayTeamName: string,
    leagueExternalId: number,
  ) {
    const normHome = normalizeTeamString(homeTeamName);
    const normAway = normalizeTeamString(awayTeamName);

    // Obtém aliases cadastrados para matching mais tolerante
    const aliasesCatalog = STATE_LEAGUE_ALIASES[leagueExternalId] || [];
    const homeAliases = this.getTeamKeywords(normHome, aliasesCatalog);
    const awayAliases = this.getTeamKeywords(normAway, aliasesCatalog);

    return ogolMatches.find((m) => {
      const normSlug = normalizeTeamString(m.slug);
      const matchesHome = homeAliases.some((alias) => normSlug.includes(alias));
      const matchesAway = awayAliases.some((alias) => normSlug.includes(alias));
      return matchesHome && matchesAway;
    });
  }

  /**
   * Faz o matching do time extraído do card com o time da partida
   */
  private matchTeamLineup(
    lineups: OgolTeamLineup[],
    targetTeamName: string,
    leagueExternalId: number,
  ): OgolTeamLineup | undefined {
    const normTarget = normalizeTeamString(targetTeamName);
    const aliasesCatalog = STATE_LEAGUE_ALIASES[leagueExternalId] || [];
    const targetKeywords = this.getTeamKeywords(normTarget, aliasesCatalog);

    return lineups.find((l) => {
      const normExtracted = normalizeTeamString(l.teamName);
      return targetKeywords.some(
        (kw) => normExtracted.includes(kw) || kw.includes(normExtracted),
      );
    });
  }

  /**
   * Gera lista de palavras-chave / variações aceitáveis para o time
   */
  private getTeamKeywords(normName: string, catalog: any[]): string[] {
    const keywords = new Set<string>();
    keywords.add(normName);

    // Palavras principais sem sufixos como FC, SC, PE, etc.
    const clean = normName
      .replace(/\b(futebol clube|sport club|esporte clube|clube|pe|fc|sc|ec)\b/g, '')
      .trim();
    if (clean.length >= 3) {
      keywords.add(clean);
    }

    // Busca no catálogo de aliases
    const found = catalog.find(
      (entry) =>
        normalizeTeamString(entry.canonicalName) === normName ||
        entry.aliases.some((a: string) => normalizeTeamString(a) === normName),
    );

    if (found) {
      found.aliases.forEach((a: string) => {
        const normA = normalizeTeamString(a);
        if (normA.length >= 3) keywords.add(normA);
      });
    }

    return Array.from(keywords);
  }

  /**
   * Persiste os 11 titulares no banco com grid tático universal equilibrado
   */
  private async persistTeamStarters(
    fixtureId: string,
    teamId: number,
    starters: OgolPlayerLineup[],
  ): Promise<void> {
    // Purga alinhamentos prévios provisórios deste time para garantir consistência
    await this.prisma.fixtureLineup.deleteMany({
      where: {
        fixtureId,
        teamId,
        isStart: true,
      },
    });

    // Posições e grid tático universal padrão (4-3-3):
    // 1: Goleiro (grid 1:1)
    // 2 a 5: Defesa (grid 2:1, 2:2, 2:3, 2:4)
    // 6 a 8: Meio (grid 3:1, 3:2, 3:3)
    // 9 a 11: Ataque (grid 4:1, 4:2, 4:3)
    const tacticalLayout = [
      { pos: 'G', grid: '1:1' },
      { pos: 'D', grid: '2:1' },
      { pos: 'D', grid: '2:2' },
      { pos: 'D', grid: '2:3' },
      { pos: 'D', grid: '2:4' },
      { pos: 'M', grid: '3:1' },
      { pos: 'M', grid: '3:2' },
      { pos: 'M', grid: '3:3' },
      { pos: 'F', grid: '4:1' },
      { pos: 'F', grid: '4:2' },
      { pos: 'F', grid: '4:3' },
    ];

    const toCreate = starters.slice(0, 11).map((player, idx) => {
      const layout = tacticalLayout[idx] || { pos: 'M', grid: `3:${idx}` };
      const parsedExternalId = player.ogolPlayerId ? parseInt(player.ogolPlayerId, 10) : null;

      return {
        fixtureId,
        teamId,
        player: player.name,
        number: idx + 1,
        pos: layout.pos,
        grid: layout.grid,
        isStart: true,
        externalPlayerId: !isNaN(parsedExternalId as number) ? parsedExternalId : null,
      };
    });

    await this.prisma.fixtureLineup.createMany({
      data: toCreate,
    });
  }
}
