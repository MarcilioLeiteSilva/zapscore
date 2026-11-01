import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class Cearense2027SeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(Cearense2027SeederService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap() {
    this.logger.log('[CEARENSE-2027-SEEDER] Verificando integridade das partidas de 2027 no bootstrap...');
    try {
      await this.seedCearense2027();
    } catch (err: any) {
      this.logger.error(`[CEARENSE-2027-SEEDER] Falha ao verificar/popular 2027: ${err.message}`, err.stack);
    }
  }

  async seedCearense2027(): Promise<{ success: boolean; fixturesCount: number; message: string }> {
    // 1. Obter ou criar a liga Cearense Série A (609)
    let league = await this.prisma.league.findUnique({
      where: { externalId: 609 },
    });

    if (!league) {
      league = await this.prisma.league.create({
        data: {
          externalId: 609,
          name: 'Campeonato Cearense Série A',
          country: 'Brazil',
          logo: 'https://media.api-sports.io/football/leagues/609.png',
          type: 'League',
          season: 2027,
        },
      });
      this.logger.log(`[CEARENSE-2027-SEEDER] Liga 609 criada no banco.`);
    }

    // 2. Verificar se os 45 jogos já existem
    const existingCount = await this.prisma.fixture.count({
      where: { leagueId: league.id, season: 2027 },
    });

    if (existingCount >= 45) {
      const msg = `Cearense 2027 já possui ${existingCount} partidas cadastradas. Nenhuma ação necessária.`;
      this.logger.log(`[CEARENSE-2027-SEEDER] ${msg}`);
      return { success: true, fixturesCount: existingCount, message: msg };
    }

    this.logger.log(`[CEARENSE-2027-SEEDER] Populando 10 clubes oficiais e 45 jogos da FCF 2027...`);

    // 3. Upsert dos 10 Clubes Oficiais
    const TEAMS_DEF = [
      { key: 'ceara', externalId: 129, name: 'Ceara', code: 'CEA', logo: 'https://media.api-sports.io/football/teams/129.png' },
      { key: 'fortaleza', externalId: 154, name: 'Fortaleza EC', code: 'FOR', logo: 'https://media.api-sports.io/football/teams/154.png' },
      { key: 'ferroviario', externalId: 1195, name: 'Ferroviario', code: 'FER', logo: 'https://media.api-sports.io/football/teams/1195.png' },
      { key: 'floresta', externalId: 7774, name: 'Floresta', code: 'FLO', logo: 'https://media.api-sports.io/football/teams/7774.png' },
      { key: 'iguatu', externalId: 15505, name: 'Iguatu', code: 'IGU', logo: 'https://media.api-sports.io/football/teams/15505.png' },
      { key: 'maracana', externalId: 13089, name: 'Maracanã', code: 'MAR', logo: 'https://media.api-sports.io/football/teams/13089.png' },
      { key: 'horizonte', externalId: 12297, name: 'Horizonte', code: 'HOR', logo: 'https://media.api-sports.io/football/teams/12297.png' },
      { key: 'icasa', externalId: 7868, name: 'Icasa', code: 'ICA', logo: 'https://media.api-sports.io/football/teams/7868.png' },
      { key: 'maranguape', externalId: 13090, name: 'Maranguape', code: 'MPE', logo: 'https://media.api-sports.io/football/teams/13090.png' },
      { key: 'itapipoca', externalId: 7869, name: 'Itapipoca', code: 'ITA', logo: 'https://media.api-sports.io/football/teams/7869.png' },
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

    // 4. Upsert da Classificação Inicial (10 clubes zerados)
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

    // 5. As 45 Partidas Oficiais da Tabela Detalhada FCF 2027
    const MATCHES_SCHEDULE = [
      // 1ª Rodada
      { ref: 1, rod: '1ª Rodada', data: '2027-01-05T19:00:00Z', home: 'ferroviario', away: 'floresta', estadio: 'Presidente Vargas', cidade: 'Fortaleza' },
      { ref: 2, rod: '1ª Rodada', data: '2027-01-05T20:00:00Z', home: 'horizonte', away: 'ceara', estadio: 'Domingão', cidade: 'Horizonte' },
      { ref: 3, rod: '1ª Rodada', data: '2027-01-06T19:00:00Z', home: 'fortaleza', away: 'itapipoca', estadio: 'Presidente Vargas', cidade: 'Fortaleza' },
      { ref: 4, rod: '1ª Rodada', data: '2027-01-06T16:00:00Z', home: 'maracana', away: 'iguatu', estadio: 'Almir Dutra', cidade: 'Maracanaú' },
      { ref: 5, rod: '1ª Rodada', data: '2027-01-06T20:00:00Z', home: 'icasa', away: 'maranguape', estadio: 'Romeirão', cidade: 'Juazeiro do Norte' },

      // 2ª Rodada
      { ref: 6, rod: '2ª Rodada', data: '2027-01-09T16:30:00Z', home: 'floresta', away: 'fortaleza', estadio: 'Presidente Vargas', cidade: 'Fortaleza' },
      { ref: 7, rod: '2ª Rodada', data: '2027-01-09T16:00:00Z', home: 'maranguape', away: 'horizonte', estadio: 'Moraisão', cidade: 'Maranguape' },
      { ref: 8, rod: '2ª Rodada', data: '2027-01-10T16:00:00Z', home: 'ceara', away: 'maracana', estadio: 'Presidente Vargas', cidade: 'Fortaleza' },
      { ref: 9, rod: '2ª Rodada', data: '2027-01-10T16:00:00Z', home: 'iguatu', away: 'icasa', estadio: 'Morenão', cidade: 'Iguatu' },
      { ref: 10, rod: '2ª Rodada', data: '2027-01-10T16:00:00Z', home: 'itapipoca', away: 'ferroviario', estadio: 'Perilão', cidade: 'Itapipoca' },

      // 3ª Rodada
      { ref: 11, rod: '3ª Rodada', data: '2027-01-12T20:00:00Z', home: 'fortaleza', away: 'maranguape', estadio: 'Presidente Vargas', cidade: 'Fortaleza' },
      { ref: 12, rod: '3ª Rodada', data: '2027-01-13T19:00:00Z', home: 'ferroviario', away: 'icasa', estadio: 'Presidente Vargas', cidade: 'Fortaleza' },
      { ref: 13, rod: '3ª Rodada', data: '2027-01-13T20:00:00Z', home: 'iguatu', away: 'ceara', estadio: 'Morenão', cidade: 'Iguatu' },
      { ref: 14, rod: '3ª Rodada', data: '2027-01-13T16:00:00Z', home: 'maracana', away: 'itapipoca', estadio: 'Almir Dutra', cidade: 'Maracanaú' },
      { ref: 15, rod: '3ª Rodada', data: '2027-01-14T20:00:00Z', home: 'floresta', away: 'horizonte', estadio: 'Presidente Vargas', cidade: 'Fortaleza' },

      // 4ª Rodada
      { ref: 16, rod: '4ª Rodada', data: '2027-01-16T16:30:00Z', home: 'ceara', away: 'ferroviario', estadio: 'Presidente Vargas', cidade: 'Fortaleza' },
      { ref: 17, rod: '4ª Rodada', data: '2027-01-16T16:00:00Z', home: 'maranguape', away: 'itapipoca', estadio: 'Moraisão', cidade: 'Maranguape' },
      { ref: 18, rod: '4ª Rodada', data: '2027-01-17T16:00:00Z', home: 'floresta', away: 'maracana', estadio: 'Presidente Vargas', cidade: 'Fortaleza' },
      { ref: 19, rod: '4ª Rodada', data: '2027-01-17T16:00:00Z', home: 'horizonte', away: 'iguatu', estadio: 'Domingão', cidade: 'Horizonte' },
      { ref: 20, rod: '4ª Rodada', data: '2027-01-17T17:00:00Z', home: 'icasa', away: 'fortaleza', estadio: 'Romeirão', cidade: 'Juazeiro do Norte' },

      // 5ª Rodada
      { ref: 21, rod: '5ª Rodada', data: '2027-01-20T20:00:00Z', home: 'ceara', away: 'maranguape', estadio: 'Presidente Vargas', cidade: 'Fortaleza' },
      { ref: 22, rod: '5ª Rodada', data: '2027-01-20T19:00:00Z', home: 'maracana', away: 'ferroviario', estadio: 'Almir Dutra', cidade: 'Maracanaú' },
      { ref: 23, rod: '5ª Rodada', data: '2027-01-20T16:00:00Z', home: 'itapipoca', away: 'floresta', estadio: 'Perilão', cidade: 'Itapipoca' },
      { ref: 24, rod: '5ª Rodada', data: '2027-01-20T20:00:00Z', home: 'icasa', away: 'horizonte', estadio: 'Romeirão', cidade: 'Juazeiro do Norte' },
      { ref: 25, rod: '5ª Rodada', data: '2027-01-21T20:00:00Z', home: 'fortaleza', away: 'iguatu', estadio: 'Presidente Vargas', cidade: 'Fortaleza' },

      // 6ª Rodada
      { ref: 26, rod: '6ª Rodada', data: '2027-01-23T16:30:00Z', home: 'ceara', away: 'icasa', estadio: 'Presidente Vargas', cidade: 'Fortaleza' },
      { ref: 27, rod: '6ª Rodada', data: '2027-01-23T16:00:00Z', home: 'maranguape', away: 'floresta', estadio: 'Moraisão', cidade: 'Maranguape' },
      { ref: 28, rod: '6ª Rodada', data: '2027-01-24T16:00:00Z', home: 'ferroviario', away: 'fortaleza', estadio: 'Presidente Vargas', cidade: 'Fortaleza' },
      { ref: 29, rod: '6ª Rodada', data: '2027-01-24T16:00:00Z', home: 'iguatu', away: 'itapipoca', estadio: 'Morenão', cidade: 'Iguatu' },
      { ref: 30, rod: '6ª Rodada', data: '2027-01-24T16:00:00Z', home: 'horizonte', away: 'maracana', estadio: 'Domingão', cidade: 'Horizonte' },

      // 7ª Rodada
      { ref: 31, rod: '7ª Rodada', data: '2027-01-30T16:00:00Z', home: 'ferroviario', away: 'maranguape', estadio: 'Presidente Vargas', cidade: 'Fortaleza' },
      { ref: 32, rod: '7ª Rodada', data: '2027-01-30T16:00:00Z', home: 'maracana', away: 'icasa', estadio: 'Almir Dutra', cidade: 'Maracanaú' },
      { ref: 33, rod: '7ª Rodada', data: '2027-01-31T18:00:00Z', home: 'fortaleza', away: 'ceara', estadio: 'Arena Castelão', cidade: 'Fortaleza' },
      { ref: 34, rod: '7ª Rodada', data: '2027-01-31T16:00:00Z', home: 'floresta', away: 'iguatu', estadio: 'Presidente Vargas', cidade: 'Fortaleza' },
      { ref: 35, rod: '7ª Rodada', data: '2027-01-31T16:00:00Z', home: 'itapipoca', away: 'horizonte', estadio: 'Perilão', cidade: 'Itapipoca' },

      // 8ª Rodada
      { ref: 36, rod: '8ª Rodada', data: '2027-02-06T16:30:00Z', home: 'ceara', away: 'floresta', estadio: 'Presidente Vargas', cidade: 'Fortaleza' },
      { ref: 37, rod: '8ª Rodada', data: '2027-02-06T17:00:00Z', home: 'icasa', away: 'itapipoca', estadio: 'Romeirão', cidade: 'Juazeiro do Norte' },
      { ref: 38, rod: '8ª Rodada', data: '2027-02-07T16:00:00Z', home: 'fortaleza', away: 'maracana', estadio: 'Presidente Vargas', cidade: 'Fortaleza' },
      { ref: 39, rod: '8ª Rodada', data: '2027-02-07T16:00:00Z', home: 'maranguape', away: 'iguatu', estadio: 'Moraisão', cidade: 'Maranguape' },
      { ref: 40, rod: '8ª Rodada', data: '2027-02-08T20:00:00Z', home: 'ferroviario', away: 'horizonte', estadio: 'Presidente Vargas', cidade: 'Fortaleza' },

      // 9ª Rodada
      { ref: 41, rod: '9ª Rodada', data: '2027-02-14T16:00:00Z', home: 'floresta', away: 'icasa', estadio: 'Presidente Vargas', cidade: 'Fortaleza' },
      { ref: 42, rod: '9ª Rodada', data: '2027-02-14T16:00:00Z', home: 'iguatu', away: 'ferroviario', estadio: 'Morenão', cidade: 'Iguatu' },
      { ref: 43, rod: '9ª Rodada', data: '2027-02-14T16:00:00Z', home: 'horizonte', away: 'fortaleza', estadio: 'Domingão', cidade: 'Horizonte' },
      { ref: 44, rod: '9ª Rodada', data: '2027-02-14T16:00:00Z', home: 'maracana', away: 'maranguape', estadio: 'Almir Dutra', cidade: 'Maracanaú' },
      { ref: 45, rod: '9ª Rodada', data: '2027-02-14T16:00:00Z', home: 'itapipoca', away: 'ceara', estadio: 'Perilão', cidade: 'Itapipoca' },
    ];

    let insertedFixtures = 0;

    for (const m of MATCHES_SCHEDULE) {
      const extId = 202760900 + m.ref;
      const homeTeamId = teamDbMap.get(m.home);
      const awayTeamId = teamDbMap.get(m.away);

      if (!homeTeamId || !awayTeamId) {
        this.logger.warn(`[CEARENSE-2027-SEEDER] Time não encontrado para jogo ${m.ref}: ${m.home} x ${m.away}`);
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

    const successMsg = `Povoamento concluído: ${insertedFixtures} partidas e 10 clubes registrados para o Cearense 2027.`;
    this.logger.log(`[CEARENSE-2027-SEEDER] ${successMsg}`);
    return { success: true, fixturesCount: insertedFixtures, message: successMsg };
  }
}

