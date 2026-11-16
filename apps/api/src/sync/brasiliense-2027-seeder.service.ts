import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class Brasiliense2027SeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(Brasiliense2027SeederService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap() {
    this.logger.log('[BRASILIENSE-2027-SEEDER] Verificando integridade das partidas de 2027 no bootstrap...');
    try {
      await this.seedBrasiliense2027();
    } catch (err: any) {
      this.logger.error(`[BRASILIENSE-2027-SEEDER] Falha ao verificar/popular 2027: ${err.message}`, err.stack);
    }
  }

  async seedBrasiliense2027(): Promise<{ success: boolean; fixturesCount: number; message: string }> {
    // 1. Obter ou criar a liga Campeonato Brasiliense (610)
    let league = await this.prisma.league.findUnique({
      where: { externalId: 610 },
    });

    if (!league) {
      league = await this.prisma.league.create({
        data: {
          externalId: 610,
          name: 'Campeonato Brasiliense',
          country: 'Brazil',
          logo: 'https://media.api-sports.io/football/leagues/610.png',
          type: 'League',
          season: 2027,
        },
      });
      this.logger.log(`[BRASILIENSE-2027-SEEDER] Liga 610 criada no banco.`);
    }

    // 2. Verificar se os 45 jogos já existem
    const existingCount = await this.prisma.fixture.count({
      where: { leagueId: league.id, season: 2027 },
    });

    if (existingCount >= 45) {
      const msg = `Brasiliense 2027 já possui ${existingCount} partidas cadastradas. Nenhuma ação necessária.`;
      this.logger.log(`[BRASILIENSE-2027-SEEDER] ${msg}`);
      return { success: true, fixturesCount: existingCount, message: msg };
    }

    this.logger.log(`[BRASILIENSE-2027-SEEDER] Populando 10 clubes oficiais e 45 jogos da FFDF 2027...`);

    // 3. Upsert dos 10 Clubes Oficiais
    const TEAMS_DEF = [
      { key: 'brasiliense', externalId: 2208, name: 'Brasiliense', code: 'BRS', logo: 'https://media.api-sports.io/football/teams/2208.png' },
      { key: 'gama', externalId: 1222, name: 'Gama', code: 'GAM', logo: 'https://media.api-sports.io/football/teams/1222.png' },
      { key: 'ceilandia', externalId: 7771, name: 'Ceilândia', code: 'CEI', logo: 'https://media.api-sports.io/football/teams/7771.png' },
      { key: 'capital', externalId: 12921, name: 'Capital DF', code: 'CAP', logo: 'https://media.api-sports.io/football/teams/12921.png' },
      { key: 'paranoa', externalId: 12924, name: 'Paranoá', code: 'PAR', logo: 'https://media.api-sports.io/football/teams/12924.png' },
      { key: 'real_brasilia', externalId: 12925, name: 'Real Brasília', code: 'RBR', logo: 'https://media.api-sports.io/football/teams/12925.png' },
      { key: 'samambaia', externalId: 15612, name: 'Samambaia', code: 'SAM', logo: 'https://media.api-sports.io/football/teams/15612.png' },
      { key: 'sobradinho', externalId: 2226, name: 'Sobradinho', code: 'SOB', logo: 'https://media.api-sports.io/football/teams/2226.png' },
      { key: 'taguatinga', externalId: 220001, name: 'Taguatinga', code: 'TAG', logo: 'https://assets.candangol.com.br/cdn-cgi/image/width=256,quality=90,format=png/teams/taguatinga/Taguatinga-2018-01-01_current.webp' },
      { key: 'canaa', externalId: 220002, name: 'Canaã', code: 'CAN', logo: 'https://assets.candangol.com.br/cdn-cgi/image/width=256,quality=90,format=png/teams/canaa/Canaa-2023-03-14_current.webp' },
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

    // 5. As 45 Partidas Oficiais da Tabela Básica FFDF 2027
    const MATCHES_SCHEDULE = [
      // 1ª Rodada (09/01 ou 10/01)
      { ref: 1, rod: '1ª Rodada', data: '2027-01-09T16:00:00Z', home: 'samambaia', away: 'brasiliense', estadio: 'Rorizão', cidade: 'Samambaia' },
      { ref: 2, rod: '1ª Rodada', data: '2027-01-09T16:00:00Z', home: 'ceilandia', away: 'sobradinho', estadio: 'Abadião', cidade: 'Ceilândia' },
      { ref: 3, rod: '1ª Rodada', data: '2027-01-10T16:00:00Z', home: 'gama', away: 'paranoa', estadio: 'Bezerrão', cidade: 'Gama' },
      { ref: 4, rod: '1ª Rodada', data: '2027-01-10T16:00:00Z', home: 'capital', away: 'taguatinga', estadio: 'JK Paranoá', cidade: 'Paranoá' },
      { ref: 5, rod: '1ª Rodada', data: '2027-01-10T16:00:00Z', home: 'real_brasilia', away: 'canaa', estadio: 'Defelê', cidade: 'Brasília' },

      // 2ª Rodada (16/01 ou 17/01)
      { ref: 6, rod: '2ª Rodada', data: '2027-01-16T16:00:00Z', home: 'sobradinho', away: 'samambaia', estadio: 'Defelê', cidade: 'Brasília' },
      { ref: 7, rod: '2ª Rodada', data: '2027-01-16T16:00:00Z', home: 'taguatinga', away: 'real_brasilia', estadio: 'Serejão', cidade: 'Taguatinga' },
      { ref: 8, rod: '2ª Rodada', data: '2027-01-17T16:00:00Z', home: 'paranoa', away: 'capital', estadio: 'Defelê', cidade: 'Brasília' },
      { ref: 9, rod: '2ª Rodada', data: '2027-01-17T16:00:00Z', home: 'brasiliense', away: 'gama', estadio: 'Serejão', cidade: 'Taguatinga' },
      { ref: 10, rod: '2ª Rodada', data: '2027-01-17T16:00:00Z', home: 'canaa', away: 'ceilandia', estadio: 'Rorizão', cidade: 'Samambaia' },

      // 3ª Rodada (20/01)
      { ref: 11, rod: '3ª Rodada', data: '2027-01-20T16:00:00Z', home: 'samambaia', away: 'canaa', estadio: 'Rorizão', cidade: 'Samambaia' },
      { ref: 12, rod: '3ª Rodada', data: '2027-01-20T16:00:00Z', home: 'ceilandia', away: 'taguatinga', estadio: 'Abadião', cidade: 'Ceilândia' },
      { ref: 13, rod: '3ª Rodada', data: '2027-01-20T19:00:00Z', home: 'gama', away: 'sobradinho', estadio: 'Bezerrão', cidade: 'Gama' },
      { ref: 14, rod: '3ª Rodada', data: '2027-01-20T19:00:00Z', home: 'brasiliense', away: 'paranoa', estadio: 'Serejão', cidade: 'Taguatinga' },
      { ref: 15, rod: '3ª Rodada', data: '2027-01-20T20:00:00Z', home: 'real_brasilia', away: 'capital', estadio: 'Defelê', cidade: 'Brasília' },

      // 4ª Rodada (23/01 ou 24/01)
      { ref: 16, rod: '4ª Rodada', data: '2027-01-23T16:00:00Z', home: 'sobradinho', away: 'brasiliense', estadio: 'Defelê', cidade: 'Brasília' },
      { ref: 17, rod: '4ª Rodada', data: '2027-01-23T16:00:00Z', home: 'capital', away: 'ceilandia', estadio: 'JK Paranoá', cidade: 'Paranoá' },
      { ref: 18, rod: '4ª Rodada', data: '2027-01-24T16:00:00Z', home: 'taguatinga', away: 'samambaia', estadio: 'Serejão', cidade: 'Taguatinga' },
      { ref: 19, rod: '4ª Rodada', data: '2027-01-24T16:00:00Z', home: 'paranoa', away: 'real_brasilia', estadio: 'Defelê', cidade: 'Brasília' },
      { ref: 20, rod: '4ª Rodada', data: '2027-01-24T16:00:00Z', home: 'canaa', away: 'gama', estadio: 'Rorizão', cidade: 'Samambaia' },

      // 5ª Rodada (30/01 ou 31/01)
      { ref: 21, rod: '5ª Rodada', data: '2027-01-30T16:00:00Z', home: 'samambaia', away: 'capital', estadio: 'Rorizão', cidade: 'Samambaia' },
      { ref: 22, rod: '5ª Rodada', data: '2027-01-30T16:00:00Z', home: 'ceilandia', away: 'real_brasilia', estadio: 'Abadião', cidade: 'Ceilândia' },
      { ref: 23, rod: '5ª Rodada', data: '2027-01-31T16:00:00Z', home: 'sobradinho', away: 'paranoa', estadio: 'Defelê', cidade: 'Brasília' },
      { ref: 24, rod: '5ª Rodada', data: '2027-01-31T16:00:00Z', home: 'gama', away: 'taguatinga', estadio: 'Bezerrão', cidade: 'Gama' },
      { ref: 25, rod: '5ª Rodada', data: '2027-01-31T16:00:00Z', home: 'brasiliense', away: 'canaa', estadio: 'Serejão', cidade: 'Taguatinga' },

      // 6ª Rodada (04/02, 05/02 ou 06/02)
      { ref: 26, rod: '6ª Rodada', data: '2027-02-04T16:00:00Z', home: 'capital', away: 'gama', estadio: 'JK Paranoá', cidade: 'Paranoá' },
      { ref: 27, rod: '6ª Rodada', data: '2027-02-05T16:00:00Z', home: 'taguatinga', away: 'brasiliense', estadio: 'Serejão', cidade: 'Taguatinga' },
      { ref: 28, rod: '6ª Rodada', data: '2027-02-06T16:00:00Z', home: 'paranoa', away: 'ceilandia', estadio: 'Defelê', cidade: 'Brasília' },
      { ref: 29, rod: '6ª Rodada', data: '2027-02-06T16:00:00Z', home: 'canaa', away: 'sobradinho', estadio: 'Rorizão', cidade: 'Samambaia' },
      { ref: 30, rod: '6ª Rodada', data: '2027-02-06T16:00:00Z', home: 'real_brasilia', away: 'samambaia', estadio: 'Defelê', cidade: 'Brasília' },

      // 7ª Rodada (13/02 ou 14/02)
      { ref: 31, rod: '7ª Rodada', data: '2027-02-13T16:00:00Z', home: 'samambaia', away: 'ceilandia', estadio: 'Rorizão', cidade: 'Samambaia' },
      { ref: 32, rod: '7ª Rodada', data: '2027-02-13T16:00:00Z', home: 'sobradinho', away: 'taguatinga', estadio: 'Defelê', cidade: 'Brasília' },
      { ref: 33, rod: '7ª Rodada', data: '2027-02-14T16:00:00Z', home: 'gama', away: 'real_brasilia', estadio: 'Bezerrão', cidade: 'Gama' },
      { ref: 34, rod: '7ª Rodada', data: '2027-02-14T16:00:00Z', home: 'brasiliense', away: 'capital', estadio: 'Serejão', cidade: 'Taguatinga' },
      { ref: 35, rod: '7ª Rodada', data: '2027-02-14T16:00:00Z', home: 'canaa', away: 'paranoa', estadio: 'Rorizão', cidade: 'Samambaia' },

      // 8ª Rodada (20/02 ou 21/02)
      { ref: 36, rod: '8ª Rodada', data: '2027-02-20T16:00:00Z', home: 'samambaia', away: 'paranoa', estadio: 'Rorizão', cidade: 'Samambaia' },
      { ref: 37, rod: '8ª Rodada', data: '2027-02-20T16:00:00Z', home: 'ceilandia', away: 'gama', estadio: 'Abadião', cidade: 'Ceilândia' },
      { ref: 38, rod: '8ª Rodada', data: '2027-02-21T16:00:00Z', home: 'capital', away: 'sobradinho', estadio: 'JK Paranoá', cidade: 'Paranoá' },
      { ref: 39, rod: '8ª Rodada', data: '2027-02-21T16:00:00Z', home: 'taguatinga', away: 'canaa', estadio: 'Serejão', cidade: 'Taguatinga' },
      { ref: 40, rod: '8ª Rodada', data: '2027-02-21T16:00:00Z', home: 'real_brasilia', away: 'brasiliense', estadio: 'Defelê', cidade: 'Brasília' },

      // 9ª Rodada (27/02 ou 28/02)
      { ref: 41, rod: '9ª Rodada', data: '2027-02-27T16:00:00Z', home: 'sobradinho', away: 'real_brasilia', estadio: 'Defelê', cidade: 'Brasília' },
      { ref: 42, rod: '9ª Rodada', data: '2027-02-27T16:00:00Z', home: 'gama', away: 'samambaia', estadio: 'Bezerrão', cidade: 'Gama' },
      { ref: 43, rod: '9ª Rodada', data: '2027-02-28T16:00:00Z', home: 'paranoa', away: 'taguatinga', estadio: 'Defelê', cidade: 'Brasília' },
      { ref: 44, rod: '9ª Rodada', data: '2027-02-28T16:00:00Z', home: 'ceilandia', away: 'brasiliense', estadio: 'Abadião', cidade: 'Ceilândia' },
      { ref: 45, rod: '9ª Rodada', data: '2027-02-28T16:00:00Z', home: 'capital', away: 'canaa', estadio: 'JK Paranoá', cidade: 'Paranoá' },
    ];

    let insertedFixtures = 0;

    for (const m of MATCHES_SCHEDULE) {
      const extId = 202761000 + m.ref;
      const homeTeamId = teamDbMap.get(m.home);
      const awayTeamId = teamDbMap.get(m.away);

      if (!homeTeamId || !awayTeamId) {
        this.logger.warn(`[BRASILIENSE-2027-SEEDER] Time não encontrado para jogo ${m.ref}: ${m.home} x ${m.away}`);
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

    const successMsg = `Povoamento concluído: ${insertedFixtures} partidas e 10 clubes registrados para o Brasiliense 2027.`;
    this.logger.log(`[BRASILIENSE-2027-SEEDER] ${successMsg}`);
    return { success: true, fixturesCount: insertedFixtures, message: successMsg };
  }
}
