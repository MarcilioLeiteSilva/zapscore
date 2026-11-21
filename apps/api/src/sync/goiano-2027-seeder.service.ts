import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class Goiano2027SeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(Goiano2027SeederService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap() {
    this.logger.log('[GOIANO-2027-SEEDER] Verificando integridade das partidas de 2027 no bootstrap...');
    try {
      await this.seedGoiano2027();
    } catch (err: any) {
      this.logger.error(`[GOIANO-2027-SEEDER] Falha ao verificar/popular 2027: ${err.message}`, err.stack);
    }
  }

  async seedGoiano2027(): Promise<{ success: boolean; fixturesCount: number; message: string }> {
    // 1. Obter ou criar a liga Campeonato Goiano 1ª Divisão (628)
    let league = await this.prisma.league.findUnique({
      where: { externalId: 628 },
    });

    if (!league) {
      league = await this.prisma.league.create({
        data: {
          externalId: 628,
          name: 'Campeonato Goiano 1ª Divisão',
          country: 'Brazil',
          logo: 'https://media.api-sports.io/football/leagues/628.png',
          type: 'League',
          season: 2027,
        },
      });
      this.logger.log('[GOIANO-2027-SEEDER] Liga 628 criada no banco.');
    }

    this.logger.log('[GOIANO-2027-SEEDER] Atualizando 12 clubes oficiais da FGF 2027...');

    // 2. Upsert dos 12 Clubes Oficiais FGF 2027 (Grupos A, B e C)
    const TEAMS_DEF = [
      // Grupo A
      { key: 'vila_nova', externalId: 140, name: 'Vila Nova', code: 'VIL', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/140.png' },
      { key: 'agro_ec', externalId: 27284, name: 'Agro EC', code: 'AGR', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/27284.png' },
      { key: 'anapolis', externalId: 7821, name: 'Anápolis', code: 'ANA', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/7821.png' },
      { key: 'rio_verde', externalId: 7826, name: 'Rio Verde', code: 'RVE', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/7826.png' },

      // Grupo B
      { key: 'atletico_go', externalId: 144, name: 'Atlético Goianiense', code: 'ACG', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/144.png' },
      { key: 'aparecidense', externalId: 1202, name: 'Aparecidense', code: 'APA', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/1202.png' },
      { key: 'anapolina', externalId: 7822, name: 'Anapolina', code: 'APN', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/7822.png' },
      { key: 'goiatuba', externalId: 15620, name: 'Goiatuba', code: 'GTB', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/15620.png' },

      // Grupo C
      { key: 'goias', externalId: 119, name: 'Goiás', code: 'GOI', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/119.png' },
      { key: 'crac', externalId: 7823, name: 'CRAC', code: 'CRA', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/7823.png' },
      { key: 'goianesia', externalId: 7825, name: 'Goianésia', code: 'GNS', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/7825.png' },
      { key: 'jataiense', externalId: 10860, name: 'Jataiense', code: 'JAT', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/10860.png' },
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

    // 3. Upsert da Classificação Inicial (12 clubes zerados na Tabela Geral Única)
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

    // 4. Verificar se os 48 jogos já existem
    const existingCount = await this.prisma.fixture.count({
      where: { leagueId: league.id, season: 2027 },
    });

    if (existingCount >= 48) {
      const msg = `Goiano 2027 clubes atualizados com sucesso e já possui ${existingCount} partidas cadastradas.`;
      this.logger.log(`[GOIANO-2027-SEEDER] ${msg}`);
      return { success: true, fixturesCount: existingCount, message: msg };
    }

    // 5. As 48 Partidas Oficiais da Tabela FGF 2027 (1ª Fase - Confrontos Intergrupos)
    const MATCHES_SCHEDULE = [
      // 1ª Rodada (03/Jan a 07/Jan)
      { ref: 1, rod: '1ª Rodada', data: '2027-01-03T19:00:00Z', home: 'anapolina', away: 'agro_ec', estadio: 'Jonas Duarte', cidade: 'Anápolis' },
      { ref: 2, rod: '1ª Rodada', data: '2027-01-06T19:30:00Z', home: 'aparecidense', away: 'goianesia', estadio: 'Aníbal Batista de Toledo', cidade: 'Aparecida de Goiânia' },
      { ref: 3, rod: '1ª Rodada', data: '2027-01-06T19:30:00Z', home: 'goias', away: 'anapolis', estadio: 'Hailé Pinheiro', cidade: 'Goiânia' },
      { ref: 4, rod: '1ª Rodada', data: '2027-01-06T19:30:00Z', home: 'goiatuba', away: 'rio_verde', estadio: 'Divino Garcia Rosa', cidade: 'Goiatuba' },
      { ref: 5, rod: '1ª Rodada', data: '2027-01-07T19:30:00Z', home: 'jataiense', away: 'vila_nova', estadio: 'Arapucão', cidade: 'Jataí' },
      { ref: 6, rod: '1ª Rodada', data: '2027-01-07T19:30:00Z', home: 'atletico_go', away: 'crac', estadio: 'Antônio Accioly', cidade: 'Goiânia' },

      // 2ª Rodada (09/Jan e 10/Jan)
      { ref: 7, rod: '2ª Rodada', data: '2027-01-09T19:00:00Z', home: 'agro_ec', away: 'aparecidense', estadio: 'Luiz Benedito', cidade: 'Bom Jesus de Goiás' },
      { ref: 8, rod: '2ª Rodada', data: '2027-01-09T19:00:00Z', home: 'anapolis', away: 'jataiense', estadio: 'Jonas Duarte', cidade: 'Anápolis' },
      { ref: 9, rod: '2ª Rodada', data: '2027-01-09T19:00:00Z', home: 'crac', away: 'goiatuba', estadio: 'Genervino da Fonseca', cidade: 'Catalão' },
      { ref: 10, rod: '2ª Rodada', data: '2027-01-10T19:00:00Z', home: 'goianesia', away: 'anapolina', estadio: 'Valdeir José de Oliveira', cidade: 'Goianésia' },
      { ref: 11, rod: '2ª Rodada', data: '2027-01-10T19:00:00Z', home: 'rio_verde', away: 'atletico_go', estadio: 'Mozart Veloso do Carmo', cidade: 'Rio Verde' },
      { ref: 12, rod: '2ª Rodada', data: '2027-01-10T19:00:00Z', home: 'vila_nova', away: 'goias', estadio: 'Onésio Brasileiro Alvarenga', cidade: 'Goiânia' },

      // 3ª Rodada (13/Jan e 14/Jan)
      { ref: 13, rod: '3ª Rodada', data: '2027-01-13T19:30:00Z', home: 'aparecidense', away: 'vila_nova', estadio: 'Aníbal Batista de Toledo', cidade: 'Aparecida de Goiânia' },
      { ref: 14, rod: '3ª Rodada', data: '2027-01-13T19:30:00Z', home: 'anapolina', away: 'jataiense', estadio: 'Jonas Duarte', cidade: 'Anápolis' },
      { ref: 15, rod: '3ª Rodada', data: '2027-01-13T19:30:00Z', home: 'atletico_go', away: 'agro_ec', estadio: 'Antônio Accioly', cidade: 'Goiânia' },
      { ref: 16, rod: '3ª Rodada', data: '2027-01-14T19:30:00Z', home: 'crac', away: 'rio_verde', estadio: 'Genervino da Fonseca', cidade: 'Catalão' },
      { ref: 17, rod: '3ª Rodada', data: '2027-01-14T19:30:00Z', home: 'goianesia', away: 'anapolis', estadio: 'Valdeir José de Oliveira', cidade: 'Goianésia' },
      { ref: 18, rod: '3ª Rodada', data: '2027-01-14T19:30:00Z', home: 'goiatuba', away: 'goias', estadio: 'Divino Garcia Rosa', cidade: 'Goiatuba' },

      // 4ª Rodada (16/Jan e 17/Jan)
      { ref: 19, rod: '4ª Rodada', data: '2027-01-16T19:00:00Z', home: 'agro_ec', away: 'goiatuba', estadio: 'Luiz Benedito', cidade: 'Bom Jesus de Goiás' },
      { ref: 20, rod: '4ª Rodada', data: '2027-01-16T19:00:00Z', home: 'vila_nova', away: 'anapolina', estadio: 'Onésio Brasileiro Alvarenga', cidade: 'Goiânia' },
      { ref: 21, rod: '4ª Rodada', data: '2027-01-16T19:00:00Z', home: 'anapolis', away: 'crac', estadio: 'Jonas Duarte', cidade: 'Anápolis' },
      { ref: 22, rod: '4ª Rodada', data: '2027-01-17T19:00:00Z', home: 'goias', away: 'atletico_go', estadio: 'Hailé Pinheiro', cidade: 'Goiânia' },
      { ref: 23, rod: '4ª Rodada', data: '2027-01-17T19:00:00Z', home: 'jataiense', away: 'aparecidense', estadio: 'Arapucão', cidade: 'Jataí' },
      { ref: 24, rod: '4ª Rodada', data: '2027-01-17T19:00:00Z', home: 'rio_verde', away: 'goianesia', estadio: 'Mozart Veloso do Carmo', cidade: 'Rio Verde' },

      // 5ª Rodada (20/Jan e 21/Jan)
      { ref: 25, rod: '5ª Rodada', data: '2027-01-20T19:30:00Z', home: 'aparecidense', away: 'rio_verde', estadio: 'Aníbal Batista de Toledo', cidade: 'Aparecida de Goiânia' },
      { ref: 26, rod: '5ª Rodada', data: '2027-01-20T19:30:00Z', home: 'anapolina', away: 'goias', estadio: 'Jonas Duarte', cidade: 'Anápolis' },
      { ref: 27, rod: '5ª Rodada', data: '2027-01-20T19:30:00Z', home: 'atletico_go', away: 'jataiense', estadio: 'Antônio Accioly', cidade: 'Goiânia' },
      { ref: 28, rod: '5ª Rodada', data: '2027-01-21T19:30:00Z', home: 'crac', away: 'vila_nova', estadio: 'Genervino da Fonseca', cidade: 'Catalão' },
      { ref: 29, rod: '5ª Rodada', data: '2027-01-21T19:30:00Z', home: 'goianesia', away: 'agro_ec', estadio: 'Valdeir José de Oliveira', cidade: 'Goianésia' },
      { ref: 30, rod: '5ª Rodada', data: '2027-01-21T19:30:00Z', home: 'goiatuba', away: 'anapolis', estadio: 'Divino Garcia Rosa', cidade: 'Goiatuba' },

      // 6ª Rodada (23/Jan e 24/Jan)
      { ref: 31, rod: '6ª Rodada', data: '2027-01-23T19:00:00Z', home: 'agro_ec', away: 'crac', estadio: 'Luiz Benedito', cidade: 'Bom Jesus de Goiás' },
      { ref: 32, rod: '6ª Rodada', data: '2027-01-23T19:00:00Z', home: 'goias', away: 'aparecidense', estadio: 'Hailé Pinheiro', cidade: 'Goiânia' },
      { ref: 33, rod: '6ª Rodada', data: '2027-01-23T19:00:00Z', home: 'anapolis', away: 'atletico_go', estadio: 'Jonas Duarte', cidade: 'Anápolis' },
      { ref: 34, rod: '6ª Rodada', data: '2027-01-24T19:00:00Z', home: 'jataiense', away: 'goiatuba', estadio: 'Arapucão', cidade: 'Jataí' },
      { ref: 35, rod: '6ª Rodada', data: '2027-01-24T19:00:00Z', home: 'rio_verde', away: 'anapolina', estadio: 'Mozart Veloso do Carmo', cidade: 'Rio Verde' },
      { ref: 36, rod: '6ª Rodada', data: '2027-01-24T19:00:00Z', home: 'vila_nova', away: 'goianesia', estadio: 'Onésio Brasileiro Alvarenga', cidade: 'Goiânia' },

      // 7ª Rodada (30/Jan e 31/Jan)
      { ref: 37, rod: '7ª Rodada', data: '2027-01-30T19:00:00Z', home: 'aparecidense', away: 'crac', estadio: 'Aníbal Batista de Toledo', cidade: 'Aparecida de Goiânia' },
      { ref: 38, rod: '7ª Rodada', data: '2027-01-30T19:00:00Z', home: 'goias', away: 'rio_verde', estadio: 'Hailé Pinheiro', cidade: 'Goiânia' },
      { ref: 39, rod: '7ª Rodada', data: '2027-01-30T19:00:00Z', home: 'anapolina', away: 'anapolis', estadio: 'Jonas Duarte', cidade: 'Anápolis' },
      { ref: 40, rod: '7ª Rodada', data: '2027-01-31T19:00:00Z', home: 'atletico_go', away: 'vila_nova', estadio: 'Antônio Accioly', cidade: 'Goiânia' },
      { ref: 41, rod: '7ª Rodada', data: '2027-01-31T19:00:00Z', home: 'goiatuba', away: 'goianesia', estadio: 'Divino Garcia Rosa', cidade: 'Goiatuba' },
      { ref: 42, rod: '7ª Rodada', data: '2027-01-31T19:00:00Z', home: 'jataiense', away: 'agro_ec', estadio: 'Arapucão', cidade: 'Jataí' },

      // 8ª Rodada (06/Fev 16:00 - Rodada simultânea decisiva)
      { ref: 43, rod: '8ª Rodada', data: '2027-02-06T19:00:00Z', home: 'agro_ec', away: 'goias', estadio: 'Luiz Benedito', cidade: 'Bom Jesus de Goiás' },
      { ref: 44, rod: '8ª Rodada', data: '2027-02-06T19:00:00Z', home: 'anapolis', away: 'aparecidense', estadio: 'Jonas Duarte', cidade: 'Anápolis' },
      { ref: 45, rod: '8ª Rodada', data: '2027-02-06T19:00:00Z', home: 'crac', away: 'anapolina', estadio: 'Genervino da Fonseca', cidade: 'Catalão' },
      { ref: 46, rod: '8ª Rodada', data: '2027-02-06T19:00:00Z', home: 'goianesia', away: 'atletico_go', estadio: 'Valdeir José de Oliveira', cidade: 'Goianésia' },
      { ref: 47, rod: '8ª Rodada', data: '2027-02-06T19:00:00Z', home: 'rio_verde', away: 'jataiense', estadio: 'Mozart Veloso do Carmo', cidade: 'Rio Verde' },
      { ref: 48, rod: '8ª Rodada', data: '2027-02-06T19:00:00Z', home: 'vila_nova', away: 'goiatuba', estadio: 'Onésio Brasileiro Alvarenga', cidade: 'Goiânia' },
    ];

    let insertedFixtures = 0;

    for (const m of MATCHES_SCHEDULE) {
      const homeTeamId = teamDbMap.get(m.home);
      const awayTeamId = teamDbMap.get(m.away);

      if (!homeTeamId || !awayTeamId) {
        this.logger.error(`[GOIANO-2027-SEEDER] Erro ao mapear clubes para o jogo ${m.ref}: home=${m.home}, away=${m.away}`);
        continue;
      }

      const extId = 628202700 + m.ref;

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

    const successMsg = `Povoamento concluído: ${insertedFixtures} partidas e 12 clubes registrados para o Goiano 2027.`;
    this.logger.log(`[GOIANO-2027-SEEDER] ${successMsg}`);
    return { success: true, fixturesCount: insertedFixtures, message: successMsg };
  }
}
