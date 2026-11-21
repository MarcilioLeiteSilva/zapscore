import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class Piauiense2027SeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(Piauiense2027SeederService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap() {
    this.logger.log('[PIAUIENSE-2027-SEEDER] Verificando integridade das partidas de 2027 no bootstrap...');
    try {
      await this.seedPiauiense2027();
    } catch (err: any) {
      this.logger.error(`[PIAUIENSE-2027-SEEDER] Falha ao verificar/popular 2027: ${err.message}`, err.stack);
    }
  }

  async seedPiauiense2027(): Promise<{ success: boolean; fixturesCount: number; message: string }> {
    // 1. Obter ou criar a liga Campeonato Piauiense (621)
    let league = await this.prisma.league.findUnique({
      where: { externalId: 621 },
    });

    if (!league) {
      league = await this.prisma.league.create({
        data: {
          externalId: 621,
          name: 'Campeonato Piauiense',
          country: 'Brazil',
          logo: 'https://media.api-sports.io/football/leagues/621.png',
          type: 'League',
          season: 2027,
        },
      });
      this.logger.log('[PIAUIENSE-2027-SEEDER] Liga 621 criada no banco.');
    }

    // 2. Verificar se os 28 jogos já existem
    const existingCount = await this.prisma.fixture.count({
      where: { leagueId: league.id, season: 2027 },
    });

    if (existingCount >= 28) {
      const msg = `Piauiense 2027 já possui ${existingCount} partidas cadastradas. Nenhuma ação necessária.`;
      this.logger.log(`[PIAUIENSE-2027-SEEDER] ${msg}`);
      return { success: true, fixturesCount: existingCount, message: msg };
    }

    this.logger.log('[PIAUIENSE-2027-SEEDER] Populando 8 clubes oficiais e 28 jogos da FFP 2027...');

    // 3. Upsert dos 8 Clubes Oficiais com Escudos Oficiais FFP/CBF
    const TEAMS_DEF = [
      { key: 'altos', externalId: 7820, name: 'Altos', code: 'ALT', logo: 'https://wsrv.nl/?url=conteudo.cbf.com.br/clubes/53914/escudo.jpg' },
      { key: 'atletico_pi', externalId: 65174, name: 'Atlético Piauiense', code: 'CAP', logo: 'https://wsrv.nl/?url=conteudo.cbf.com.br/clubes/65174/escudo.jpg' },
      { key: 'flamengo_pi', externalId: 7828, name: 'Flamengo-PI', code: 'FLA', logo: 'https://wsrv.nl/?url=conteudo.cbf.com.br/clubes/20044/escudo.jpg' },
      { key: 'fluminense_pi', externalId: 10425, name: 'Fluminense-PI', code: 'FLU', logo: 'https://wsrv.nl/?url=conteudo.cbf.com.br/clubes/35775/escudo.jpg' },
      { key: 'oeirense', externalId: 15624, name: 'Oeirense', code: 'OEI', logo: 'https://wsrv.nl/?url=conteudo.cbf.com.br/clubes/57053/escudo.jpg' },
      { key: 'piaui', externalId: 7827, name: 'Piauí', code: 'PIA', logo: 'https://wsrv.nl/?url=conteudo.cbf.com.br/clubes/20111/escudo.jpg' },
      { key: 'river', externalId: 2218, name: 'River', code: 'RIV', logo: 'https://wsrv.nl/?url=conteudo.cbf.com.br/clubes/20077/escudo.jpg' },
      { key: 'teresina', externalId: 54232, name: 'Teresina', code: 'TEC', logo: 'https://wsrv.nl/?url=conteudo.cbf.com.br/clubes/54232/escudo.jpg' },
    ];

    const teamDbMap = new Map<string, string>(); // key -> team.id (UUID)

    for (const t of TEAMS_DEF) {
      const team = await this.prisma.team.upsert({
        where: { externalId: t.externalId },
        update: { name: t.name, logo: t.logo },
        create: {
          externalId: t.externalId,
          name: t.name,
          code: t.code,
          logo: t.logo,
          country: 'Brazil',
        },
      });
      teamDbMap.set(t.key, team.id);
    }

    // 4. Upsert da Classificação Inicial (8 clubes zerados)
    let rank = 1;
    for (const t of TEAMS_DEF) {
      const teamId = teamDbMap.get(t.key)!;
      await this.prisma.standing.upsert({
        where: {
          leagueId_teamId_season: {
            leagueId: league.id,
            teamId: teamId,
            season: 2027,
          },
        },
        update: {},
        create: {
          leagueId: league.id,
          teamId: teamId,
          season: 2027,
          rank: rank++,
          points: 0,
          played: 0,
          win: 0,
          draw: 0,
          lose: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalsDiff: 0,
        },
      });
    }

    // 5. As 28 Partidas Oficiais da Tabela FFP 2027 (1ª Fase - Turno Único)
    const MATCHES_SCHEDULE = [
      // 1ª Rodada
      { ref: 1, rod: '1ª Rodada', data: '2027-01-09T18:45:00Z', home: 'oeirense', away: 'river', estadio: 'Gerson Campos', cidade: 'Oeiras' },
      { ref: 2, rod: '1ª Rodada', data: '2027-01-09T19:00:00Z', home: 'piaui', away: 'teresina', estadio: 'Lindolfo Monteiro', cidade: 'Teresina' },
      { ref: 3, rod: '1ª Rodada', data: '2027-01-10T19:00:00Z', home: 'flamengo_pi', away: 'altos', estadio: 'Lindolfo Monteiro', cidade: 'Teresina' },
      { ref: 4, rod: '1ª Rodada', data: '2027-01-13T22:00:00Z', home: 'fluminense_pi', away: 'atletico_pi', estadio: 'Lindolfo Monteiro', cidade: 'Teresina' },

      // 2ª Rodada
      { ref: 5, rod: '2ª Rodada', data: '2027-01-16T18:45:00Z', home: 'oeirense', away: 'flamengo_pi', estadio: 'Gerson Campos', cidade: 'Oeiras' },
      { ref: 6, rod: '2ª Rodada', data: '2027-01-16T19:00:00Z', home: 'atletico_pi', away: 'piaui', estadio: 'Lindolfo Monteiro', cidade: 'Teresina' },
      { ref: 7, rod: '2ª Rodada', data: '2027-01-17T19:00:00Z', home: 'river', away: 'teresina', estadio: 'Lindolfo Monteiro', cidade: 'Teresina' },
      { ref: 8, rod: '2ª Rodada', data: '2027-01-20T22:00:00Z', home: 'fluminense_pi', away: 'altos', estadio: 'Lindolfo Monteiro', cidade: 'Teresina' },

      // 3ª Rodada
      { ref: 9, rod: '3ª Rodada', data: '2027-01-23T19:00:00Z', home: 'river', away: 'fluminense_pi', estadio: 'Lindolfo Monteiro', cidade: 'Teresina' },
      { ref: 10, rod: '3ª Rodada', data: '2027-01-24T19:00:00Z', home: 'piaui', away: 'flamengo_pi', estadio: 'Lindolfo Monteiro', cidade: 'Teresina' },
      { ref: 11, rod: '3ª Rodada', data: '2027-01-26T22:00:00Z', home: 'altos', away: 'oeirense', estadio: 'Lindolfo Monteiro', cidade: 'Teresina' },
      { ref: 12, rod: '3ª Rodada', data: '2027-01-27T22:00:00Z', home: 'teresina', away: 'atletico_pi', estadio: 'Lindolfo Monteiro', cidade: 'Teresina' },

      // 4ª Rodada
      { ref: 13, rod: '4ª Rodada', data: '2027-01-30T18:45:00Z', home: 'oeirense', away: 'fluminense_pi', estadio: 'Gerson Campos', cidade: 'Oeiras' },
      { ref: 14, rod: '4ª Rodada', data: '2027-01-30T19:00:00Z', home: 'atletico_pi', away: 'river', estadio: 'Lindolfo Monteiro', cidade: 'Teresina' },
      { ref: 15, rod: '4ª Rodada', data: '2027-01-31T19:00:00Z', home: 'flamengo_pi', away: 'teresina', estadio: 'Lindolfo Monteiro', cidade: 'Teresina' },
      { ref: 16, rod: '4ª Rodada', data: '2027-02-03T22:00:00Z', home: 'altos', away: 'piaui', estadio: 'Lindolfo Monteiro', cidade: 'Teresina' },

      // 5ª Rodada
      { ref: 17, rod: '5ª Rodada', data: '2027-02-06T18:45:00Z', home: 'oeirense', away: 'piaui', estadio: 'Gerson Campos', cidade: 'Oeiras' },
      { ref: 18, rod: '5ª Rodada', data: '2027-02-06T19:00:00Z', home: 'atletico_pi', away: 'altos', estadio: 'Lindolfo Monteiro', cidade: 'Teresina' },
      { ref: 19, rod: '5ª Rodada', data: '2027-02-10T22:00:00Z', home: 'flamengo_pi', away: 'river', estadio: 'Lindolfo Monteiro', cidade: 'Teresina' },
      { ref: 20, rod: '5ª Rodada', data: '2027-02-11T22:00:00Z', home: 'fluminense_pi', away: 'teresina', estadio: 'Lindolfo Monteiro', cidade: 'Teresina' },

      // 6ª Rodada
      { ref: 21, rod: '6ª Rodada', data: '2027-02-13T19:00:00Z', home: 'altos', away: 'river', estadio: 'Lindolfo Monteiro', cidade: 'Teresina' },
      { ref: 22, rod: '6ª Rodada', data: '2027-02-14T19:00:00Z', home: 'atletico_pi', away: 'flamengo_pi', estadio: 'Lindolfo Monteiro', cidade: 'Teresina' },
      { ref: 23, rod: '6ª Rodada', data: '2027-02-16T22:00:00Z', home: 'teresina', away: 'oeirense', estadio: 'Lindolfo Monteiro', cidade: 'Teresina' },
      { ref: 24, rod: '6ª Rodada', data: '2027-02-17T22:00:00Z', home: 'piaui', away: 'fluminense_pi', estadio: 'Lindolfo Monteiro', cidade: 'Teresina' },

      // 7ª Rodada
      { ref: 25, rod: '7ª Rodada', data: '2027-02-20T22:00:00Z', home: 'oeirense', away: 'atletico_pi', estadio: 'Gerson Campos', cidade: 'Oeiras' },
      { ref: 26, rod: '7ª Rodada', data: '2027-02-20T22:00:00Z', home: 'fluminense_pi', away: 'flamengo_pi', estadio: 'Lindolfo Monteiro', cidade: 'Teresina' },
      { ref: 27, rod: '7ª Rodada', data: '2027-02-20T22:00:00Z', home: 'river', away: 'piaui', estadio: 'Albertão', cidade: 'Teresina' },
      { ref: 28, rod: '7ª Rodada', data: '2027-02-20T22:00:00Z', home: 'teresina', away: 'altos', estadio: 'Lindolfo Monteiro', cidade: 'Teresina' },
    ];

    let insertedFixtures = 0;

    for (const m of MATCHES_SCHEDULE) {
      const extId = 202762100 + m.ref;
      const homeTeamId = teamDbMap.get(m.home);
      const awayTeamId = teamDbMap.get(m.away);

      if (!homeTeamId || !awayTeamId) {
        this.logger.warn(`[PIAUIENSE-2027-SEEDER] Time não encontrado para jogo ${m.ref}: ${m.home} x ${m.away}`);
        continue;
      }

      await this.prisma.fixture.upsert({
        where: { externalId: extId },
        update: {
          date: new Date(m.data),
          round: m.rod,
          venueName: m.estadio,
          venueCity: m.cidade,
          statusLong: 'Not Started',
          statusShort: 'NS',
        },
        create: {
          externalId: extId,
          leagueId: league.id,
          season: 2027,
          date: new Date(m.data),
          round: m.rod,
          statusLong: 'Not Started',
          statusShort: 'NS',
          venueName: m.estadio,
          venueCity: m.cidade,
          homeTeamId,
          awayTeamId,
        },
      });

      insertedFixtures++;
    }

    const successMsg = `Povoamento concluído: ${insertedFixtures} partidas e 8 clubes registrados para o Piauiense 2027.`;
    this.logger.log(`[PIAUIENSE-2027-SEEDER] ${successMsg}`);
    return { success: true, fixturesCount: insertedFixtures, message: successMsg };
  }
}
