import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class Baiano2027SeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(Baiano2027SeederService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap() {
    this.logger.log('[BAIANO-2027-SEEDER] Verificando integridade das partidas de 2027 no bootstrap...');
    try {
      await this.seedBaiano2027();
    } catch (err: any) {
      this.logger.error(`[BAIANO-2027-SEEDER] Falha ao verificar/popular 2027: ${err.message}`, err.stack);
    }
  }

  async seedBaiano2027(): Promise<{ success: boolean; fixturesCount: number; message: string }> {
    // 1. Obter ou criar a liga Baiano 1ª Divisão (602)
    let league = await this.prisma.league.findUnique({
      where: { externalId: 602 },
    });

    if (!league) {
      league = await this.prisma.league.create({
        data: {
          externalId: 602,
          name: 'Campeonato Baiano 1ª Divisão',
          country: 'Brazil',
          logo: 'https://media.api-sports.io/football/leagues/602.png',
          type: 'League',
          season: 2027,
        },
      });
      this.logger.log(`[BAIANO-2027-SEEDER] Liga 602 criada no banco.`);
    }

    // 2. Verificar se os 45 jogos já existem
    const existingCount = await this.prisma.fixture.count({
      where: { leagueId: league.id, season: 2027 },
    });

    if (existingCount >= 45) {
      const msg = `Baiano 2027 já possui ${existingCount} partidas cadastradas. Nenhuma ação necessária.`;
      this.logger.log(`[BAIANO-2027-SEEDER] ${msg}`);
      return { success: true, fixturesCount: existingCount, message: msg };
    }

    this.logger.log(`[BAIANO-2027-SEEDER] Populando 10 clubes oficiais e 45 jogos da FBF 2027...`);

    // 3. Upsert dos 10 Clubes Oficiais
    const TEAMS_DEF = [
      { key: 'bahia', externalId: 118, name: 'Bahia', code: 'BAH', logo: 'https://media.api-sports.io/football/teams/118.png' },
      { key: 'vitoria', externalId: 136, name: 'Vitória', code: 'VIT', logo: 'https://media.api-sports.io/football/teams/136.png' },
      { key: 'fluminense', externalId: 1200, name: 'Fluminense de Feira', code: 'FLU', logo: 'https://media.api-sports.io/football/teams/1200.png' },
      { key: 'juazeirense', externalId: 1224, name: 'Juazeirense', code: 'JUA', logo: 'https://media.api-sports.io/football/teams/1224.png' },
      { key: 'jacuipense', externalId: 7831, name: 'Jacuipense', code: 'JAC', logo: 'https://media.api-sports.io/football/teams/7831.png' },
      { key: 'galicia', externalId: 12935, name: 'Galícia', code: 'GAL', logo: 'https://media.api-sports.io/football/teams/12935.png' },
      { key: 'barcelona', externalId: 15103, name: 'Barcelona BA', code: 'BAR', logo: 'https://media.api-sports.io/football/teams/15103.png' },
      { key: 'jequie', externalId: 15104, name: 'Jequié', code: 'JEQ', logo: 'https://media.api-sports.io/football/teams/15104.png' },
      { key: 'porto', externalId: 23591, name: 'Porto Sport Club', code: 'POR', logo: 'https://media.api-sports.io/football/teams/23591.png' },
      { key: 'ssa', externalId: 23592, name: 'SSA FC', code: 'SSA', logo: 'https://media.api-sports.io/football/teams/23592.png' },
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

    // 5. As 45 Partidas Oficiais da Tabela Básica FBF 2027
    const MATCHES_SCHEDULE = [
      // 1ª Rodada
      { ref: 1, rod: '1ª Rodada', data: '2027-01-09T16:00:00Z', home: 'fluminense', away: 'juazeirense', estadio: 'Joia da Princesa', cidade: 'Feira de Santana' },
      { ref: 2, rod: '1ª Rodada', data: '2027-01-09T18:30:00Z', home: 'bahia', away: 'ssa', estadio: 'Arena Fonte Nova', cidade: 'Salvador' },
      { ref: 3, rod: '1ª Rodada', data: '2027-01-10T16:00:00Z', home: 'jequie', away: 'galicia', estadio: 'Waldomiro Borges', cidade: 'Jequié' },
      { ref: 4, rod: '1ª Rodada', data: '2027-01-10T16:00:00Z', home: 'porto', away: 'jacuipense', estadio: 'Agnaldo Bento', cidade: 'Porto Seguro' },
      { ref: 5, rod: '1ª Rodada', data: '2027-01-10T18:30:00Z', home: 'vitoria', away: 'barcelona', estadio: 'Barradão', cidade: 'Salvador' },

      // 2ª Rodada
      { ref: 6, rod: '2ª Rodada', data: '2027-01-13T19:00:00Z', home: 'barcelona', away: 'jequie', estadio: 'Mário Pessoa', cidade: 'Ilhéus' },
      { ref: 7, rod: '2ª Rodada', data: '2027-01-13T21:30:00Z', home: 'jacuipense', away: 'bahia', estadio: 'Valfredão', cidade: 'Riachão do Jacuípe' },
      { ref: 8, rod: '2ª Rodada', data: '2027-01-14T19:00:00Z', home: 'juazeirense', away: 'vitoria', estadio: 'Adauto Moraes', cidade: 'Juazeiro' },
      { ref: 9, rod: '2ª Rodada', data: '2027-01-14T16:00:00Z', home: 'ssa', away: 'fluminense', estadio: 'Pituaçu', cidade: 'Salvador' },
      { ref: 10, rod: '2ª Rodada', data: '2027-01-14T20:00:00Z', home: 'galicia', away: 'porto', estadio: 'Pituaçu', cidade: 'Salvador' },

      // 3ª Rodada
      { ref: 11, rod: '3ª Rodada', data: '2027-01-16T16:00:00Z', home: 'fluminense', away: 'galicia', estadio: 'Joia da Princesa', cidade: 'Feira de Santana' },
      { ref: 12, rod: '3ª Rodada', data: '2027-01-16T18:30:00Z', home: 'jacuipense', away: 'ssa', estadio: 'Valfredão', cidade: 'Riachão do Jacuípe' },
      { ref: 13, rod: '3ª Rodada', data: '2027-01-17T16:00:00Z', home: 'jequie', away: 'bahia', estadio: 'Waldomiro Borges', cidade: 'Jequié' },
      { ref: 14, rod: '3ª Rodada', data: '2027-01-17T16:00:00Z', home: 'juazeirense', away: 'barcelona', estadio: 'Adauto Moraes', cidade: 'Juazeiro' },
      { ref: 15, rod: '3ª Rodada', data: '2027-01-17T18:30:00Z', home: 'vitoria', away: 'porto', estadio: 'Barradão', cidade: 'Salvador' },

      // 4ª Rodada
      { ref: 16, rod: '4ª Rodada', data: '2027-01-20T19:00:00Z', home: 'bahia', away: 'juazeirense', estadio: 'Arena Fonte Nova', cidade: 'Salvador' },
      { ref: 17, rod: '4ª Rodada', data: '2027-01-20T19:00:00Z', home: 'jequie', away: 'ssa', estadio: 'Waldomiro Borges', cidade: 'Jequié' },
      { ref: 18, rod: '4ª Rodada', data: '2027-01-21T16:00:00Z', home: 'porto', away: 'fluminense', estadio: 'Agnaldo Bento', cidade: 'Porto Seguro' },
      { ref: 19, rod: '4ª Rodada', data: '2027-01-21T19:00:00Z', home: 'galicia', away: 'barcelona', estadio: 'Pituaçu', cidade: 'Salvador' },
      { ref: 20, rod: '4ª Rodada', data: '2027-01-21T21:30:00Z', home: 'vitoria', away: 'jacuipense', estadio: 'Barradão', cidade: 'Salvador' },

      // 5ª Rodada
      { ref: 21, rod: '5ª Rodada', data: '2027-01-23T16:00:00Z', home: 'fluminense', away: 'jequie', estadio: 'Joia da Princesa', cidade: 'Feira de Santana' },
      { ref: 22, rod: '5ª Rodada', data: '2027-01-24T16:00:00Z', home: 'bahia', away: 'vitoria', estadio: 'Arena Fonte Nova', cidade: 'Salvador' },
      { ref: 23, rod: '5ª Rodada', data: '2027-01-24T16:00:00Z', home: 'barcelona', away: 'porto', estadio: 'Mário Pessoa', cidade: 'Ilhéus' },
      { ref: 24, rod: '5ª Rodada', data: '2027-01-24T18:30:00Z', home: 'jacuipense', away: 'juazeirense', estadio: 'Valfredão', cidade: 'Riachão do Jacuípe' },
      { ref: 25, rod: '5ª Rodada', data: '2027-01-24T18:30:00Z', home: 'ssa', away: 'galicia', estadio: 'Pituaçu', cidade: 'Salvador' },

      // 6ª Rodada
      { ref: 26, rod: '6ª Rodada', data: '2027-01-30T16:00:00Z', home: 'barcelona', away: 'fluminense', estadio: 'Mário Pessoa', cidade: 'Ilhéus' },
      { ref: 27, rod: '6ª Rodada', data: '2027-01-31T16:00:00Z', home: 'porto', away: 'bahia', estadio: 'Agnaldo Bento', cidade: 'Porto Seguro' },
      { ref: 28, rod: '6ª Rodada', data: '2027-01-31T16:00:00Z', home: 'juazeirense', away: 'ssa', estadio: 'Adauto Moraes', cidade: 'Juazeiro' },
      { ref: 29, rod: '6ª Rodada', data: '2027-01-31T18:30:00Z', home: 'galicia', away: 'jacuipense', estadio: 'Pituaçu', cidade: 'Salvador' },
      { ref: 30, rod: '6ª Rodada', data: '2027-01-31T18:30:00Z', home: 'vitoria', away: 'jequie', estadio: 'Barradão', cidade: 'Salvador' },

      // 7ª Rodada
      { ref: 31, rod: '7ª Rodada', data: '2027-02-06T16:00:00Z', home: 'fluminense', away: 'vitoria', estadio: 'Joia da Princesa', cidade: 'Feira de Santana' },
      { ref: 32, rod: '7ª Rodada', data: '2027-02-07T16:00:00Z', home: 'bahia', away: 'galicia', estadio: 'Arena Fonte Nova', cidade: 'Salvador' },
      { ref: 33, rod: '7ª Rodada', data: '2027-02-07T16:00:00Z', home: 'jacuipense', away: 'barcelona', estadio: 'Valfredão', cidade: 'Riachão do Jacuípe' },
      { ref: 34, rod: '7ª Rodada', data: '2027-02-07T18:30:00Z', home: 'jequie', away: 'juazeirense', estadio: 'Waldomiro Borges', cidade: 'Jequié' },
      { ref: 35, rod: '7ª Rodada', data: '2027-02-07T18:30:00Z', home: 'ssa', away: 'porto', estadio: 'Pituaçu', cidade: 'Salvador' },

      // 8ª Rodada
      { ref: 36, rod: '8ª Rodada', data: '2027-02-13T16:00:00Z', home: 'barcelona', away: 'bahia', estadio: 'Mário Pessoa', cidade: 'Ilhéus' },
      { ref: 37, rod: '8ª Rodada', data: '2027-02-13T18:30:00Z', home: 'jacuipense', away: 'fluminense', estadio: 'Valfredão', cidade: 'Riachão do Jacuípe' },
      { ref: 38, rod: '8ª Rodada', data: '2027-02-14T16:00:00Z', home: 'porto', away: 'jequie', estadio: 'Agnaldo Bento', cidade: 'Porto Seguro' },
      { ref: 39, rod: '8ª Rodada', data: '2027-02-14T16:00:00Z', home: 'juazeirense', away: 'galicia', estadio: 'Adauto Moraes', cidade: 'Juazeiro' },
      { ref: 40, rod: '8ª Rodada', data: '2027-02-14T18:30:00Z', home: 'vitoria', away: 'ssa', estadio: 'Barradão', cidade: 'Salvador' },

      // 9ª Rodada (Horário Uniforme)
      { ref: 41, rod: '9ª Rodada', data: '2027-02-21T16:00:00Z', home: 'bahia', away: 'fluminense', estadio: 'Arena Fonte Nova', cidade: 'Salvador' },
      { ref: 42, rod: '9ª Rodada', data: '2027-02-21T16:00:00Z', home: 'jequie', away: 'jacuipense', estadio: 'Waldomiro Borges', cidade: 'Jequié' },
      { ref: 43, rod: '9ª Rodada', data: '2027-02-21T16:00:00Z', home: 'juazeirense', away: 'porto', estadio: 'Adauto Moraes', cidade: 'Juazeiro' },
      { ref: 44, rod: '9ª Rodada', data: '2027-02-21T16:00:00Z', home: 'ssa', away: 'barcelona', estadio: 'Pituaçu', cidade: 'Salvador' },
      { ref: 45, rod: '9ª Rodada', data: '2027-02-21T16:00:00Z', home: 'galicia', away: 'vitoria', estadio: 'Pituaçu', cidade: 'Salvador' },
    ];

    let insertedFixtures = 0;

    for (const m of MATCHES_SCHEDULE) {
      const extId = 202760200 + m.ref;
      const homeTeamId = teamDbMap.get(m.home);
      const awayTeamId = teamDbMap.get(m.away);

      if (!homeTeamId || !awayTeamId) {
        this.logger.warn(`[BAIANO-2027-SEEDER] Time não encontrado para jogo ${m.ref}: ${m.home} x ${m.away}`);
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

    const successMsg = `Povoamento concluído: ${insertedFixtures} partidas e 10 clubes registrados para o Baiano 2027.`;
    this.logger.log(`[BAIANO-2027-SEEDER] ${successMsg}`);
    return { success: true, fixturesCount: insertedFixtures, message: successMsg };
  }
}

