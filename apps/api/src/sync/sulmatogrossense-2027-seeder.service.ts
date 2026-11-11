import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class Sulmatogrossense2027SeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(Sulmatogrossense2027SeederService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap() {
    this.logger.log('[SULMATOGROSSENSE-2027-SEEDER] Verificando integridade das partidas de 2027 no bootstrap...');
    try {
      await this.seedSulmatogrossense2027();
    } catch (err: any) {
      this.logger.error(`[SULMATOGROSSENSE-2027-SEEDER] Falha ao verificar/popular 2027: ${err.message}`, err.stack);
    }
  }

  async seedSulmatogrossense2027(): Promise<{ success: boolean; fixturesCount: number; message: string }> {
    // 1. Obter ou criar a liga Sul-Mato-Grossense (623)
    let league = await this.prisma.league.findUnique({
      where: { externalId: 623 },
    });

    if (!league) {
      league = await this.prisma.league.create({
        data: {
          externalId: 623,
          name: 'Campeonato Sul-Matogrossense',
          country: 'Brazil',
          logo: 'https://media.api-sports.io/football/leagues/623.png',
          type: 'League',
          season: 2027,
        },
      });
      this.logger.log(`[SULMATOGROSSENSE-2027-SEEDER] Liga 623 criada no banco.`);
    }

    // 2. Verificar se os 45 jogos já existem
    const existingCount = await this.prisma.fixture.count({
      where: { leagueId: league.id, season: 2027 },
    });

    if (existingCount >= 45) {
      const msg = `Sul-Mato-Grossense 2027 já possui ${existingCount} partidas cadastradas. Nenhuma ação necessária.`;
      this.logger.log(`[SULMATOGROSSENSE-2027-SEEDER] ${msg}`);
      return { success: true, fixturesCount: existingCount, message: msg };
    }

    this.logger.log(`[SULMATOGROSSENSE-2027-SEEDER] Populando 10 clubes oficiais e 45 jogos da FFMS 2027...`);

    // 3. Upsert dos 10 Clubes Oficiais
    const TEAMS_DEF = [
      { key: 'operario', externalId: 2217, name: 'Operário-MS', code: 'OPE', logo: 'https://media.api-sports.io/football/teams/2217.png' },
      { key: 'corumbaense', externalId: 1206, name: 'Corumbaense', code: 'COR', logo: 'https://media.api-sports.io/football/teams/1206.png' },
      { key: 'dourados', externalId: 16480, name: 'Dourados', code: 'DOU', logo: 'https://media.api-sports.io/football/teams/16480.png' },
      { key: 'ivinhema', externalId: 10687, name: 'Ivinhema', code: 'IVI', logo: 'https://media.api-sports.io/football/teams/10687.png' },
      { key: 'naviraiense', externalId: 18365, name: 'Naviraiense', code: 'NAV', logo: 'https://media.api-sports.io/football/teams/18365.png' },
      { key: 'pantanal', externalId: 22828, name: 'Pantanal', code: 'PAN', logo: 'https://media.api-sports.io/football/teams/22828.png' },
      { key: 'bataguassu', externalId: 27285, name: 'Bataguassu', code: 'BAT', logo: 'https://media.api-sports.io/football/teams/27285.png' },
      { key: 'cra', externalId: 27286, name: 'CR Aquidauana', code: 'CRA', logo: 'https://media.api-sports.io/football/teams/27286.png' },
      { key: 'comercial', externalId: 7855, name: 'Comercial-MS', code: 'COM', logo: 'https://media.api-sports.io/football/teams/7855.png' },
      { key: 'misto', externalId: 27291, name: 'Misto-MS', code: 'MIS', logo: 'https://media.api-sports.io/football/teams/27291.png' },
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

    // 5. As 45 Partidas Oficiais da Tabela Básica FFMS 2027
    const MATCHES_SCHEDULE = [
      // 1ª Rodada
      { ref: 1, rod: '1ª Rodada', data: '2027-01-16T19:00:00Z', home: 'misto', away: 'bataguassu', estadio: 'Madrugadão', cidade: 'Três Lagoas' },
      { ref: 2, rod: '1ª Rodada', data: '2027-01-16T20:00:00Z', home: 'cra', away: 'dourados', estadio: 'Noroeste', cidade: 'Aquidauana' },
      { ref: 3, rod: '1ª Rodada', data: '2027-01-17T20:00:00Z', home: 'comercial', away: 'operario', estadio: 'Moreninhas', cidade: 'Campo Grande' },
      { ref: 4, rod: '1ª Rodada', data: '2027-01-17T21:00:00Z', home: 'naviraiense', away: 'corumbaense', estadio: 'Virotão', cidade: 'Naviraí' },
      { ref: 5, rod: '1ª Rodada', data: '2027-01-17T21:00:00Z', home: 'ivinhema', away: 'pantanal', estadio: 'Saraivão', cidade: 'Ivinhema' },

      // 2ª Rodada
      { ref: 6, rod: '2ª Rodada', data: '2027-01-20T23:30:00Z', home: 'bataguassu', away: 'cra', estadio: 'Pereirão', cidade: 'Bataguassu' },
      { ref: 7, rod: '2ª Rodada', data: '2027-01-20T19:00:00Z', home: 'dourados', away: 'comercial', estadio: 'Douradão', cidade: 'Dourados' },
      { ref: 8, rod: '2ª Rodada', data: '2027-01-20T23:30:00Z', home: 'corumbaense', away: 'ivinhema', estadio: 'Arthur Marinho', cidade: 'Corumbá' },
      { ref: 9, rod: '2ª Rodada', data: '2027-01-20T23:30:00Z', home: 'operario', away: 'naviraiense', estadio: 'Moreninhas', cidade: 'Campo Grande' },
      { ref: 10, rod: '2ª Rodada', data: '2027-01-21T23:30:00Z', home: 'pantanal', away: 'misto', estadio: 'Moreninhas', cidade: 'Campo Grande' },

      // 3ª Rodada
      { ref: 11, rod: '3ª Rodada', data: '2027-01-23T19:00:00Z', home: 'misto', away: 'corumbaense', estadio: 'Madrugadão', cidade: 'Três Lagoas' },
      { ref: 12, rod: '3ª Rodada', data: '2027-01-24T14:00:00Z', home: 'pantanal', away: 'bataguassu', estadio: 'Moreninhas', cidade: 'Campo Grande' },
      { ref: 13, rod: '3ª Rodada', data: '2027-01-24T20:00:00Z', home: 'comercial', away: 'cra', estadio: 'Moreninhas', cidade: 'Campo Grande' },
      { ref: 14, rod: '3ª Rodada', data: '2027-01-24T21:00:00Z', home: 'naviraiense', away: 'dourados', estadio: 'Virotão', cidade: 'Naviraí' },
      { ref: 15, rod: '3ª Rodada', data: '2027-01-24T21:00:00Z', home: 'ivinhema', away: 'operario', estadio: 'Saraivão', cidade: 'Ivinhema' },

      // 4ª Rodada
      { ref: 16, rod: '4ª Rodada', data: '2027-01-30T22:00:00Z', home: 'bataguassu', away: 'comercial', estadio: 'Pereirão', cidade: 'Bataguassu' },
      { ref: 17, rod: '4ª Rodada', data: '2027-01-30T22:00:00Z', home: 'corumbaense', away: 'pantanal', estadio: 'Arthur Marinho', cidade: 'Corumbá' },
      { ref: 18, rod: '4ª Rodada', data: '2027-01-30T20:00:00Z', home: 'cra', away: 'naviraiense', estadio: 'Noroeste', cidade: 'Aquidauana' },
      { ref: 19, rod: '4ª Rodada', data: '2027-01-31T21:00:00Z', home: 'operario', away: 'misto', estadio: 'Moreninhas', cidade: 'Campo Grande' },
      { ref: 20, rod: '4ª Rodada', data: '2027-01-31T19:00:00Z', home: 'dourados', away: 'ivinhema', estadio: 'Douradão', cidade: 'Dourados' },

      // 5ª Rodada
      { ref: 21, rod: '5ª Rodada', data: '2027-02-06T22:00:00Z', home: 'corumbaense', away: 'bataguassu', estadio: 'Arthur Marinho', cidade: 'Corumbá' },
      { ref: 22, rod: '5ª Rodada', data: '2027-02-06T19:00:00Z', home: 'misto', away: 'dourados', estadio: 'Madrugadão', cidade: 'Três Lagoas' },
      { ref: 23, rod: '5ª Rodada', data: '2027-02-07T21:00:00Z', home: 'naviraiense', away: 'comercial', estadio: 'Virotão', cidade: 'Naviraí' },
      { ref: 24, rod: '5ª Rodada', data: '2027-02-07T14:00:00Z', home: 'pantanal', away: 'operario', estadio: 'Moreninhas', cidade: 'Campo Grande' },
      { ref: 25, rod: '5ª Rodada', data: '2027-02-07T21:00:00Z', home: 'ivinhema', away: 'cra', estadio: 'Saraivão', cidade: 'Ivinhema' },

      // 6ª Rodada
      { ref: 26, rod: '6ª Rodada', data: '2027-02-13T22:00:00Z', home: 'bataguassu', away: 'naviraiense', estadio: 'Pereirão', cidade: 'Bataguassu' },
      { ref: 27, rod: '6ª Rodada', data: '2027-02-13T20:00:00Z', home: 'comercial', away: 'ivinhema', estadio: 'Moreninhas', cidade: 'Campo Grande' },
      { ref: 28, rod: '6ª Rodada', data: '2027-02-13T20:00:00Z', home: 'cra', away: 'misto', estadio: 'Noroeste', cidade: 'Aquidauana' },
      { ref: 29, rod: '6ª Rodada', data: '2027-02-14T21:00:00Z', home: 'operario', away: 'corumbaense', estadio: 'Moreninhas', cidade: 'Campo Grande' },
      { ref: 30, rod: '6ª Rodada', data: '2027-02-14T19:00:00Z', home: 'dourados', away: 'pantanal', estadio: 'Douradão', cidade: 'Dourados' },

      // 7ª Rodada
      { ref: 31, rod: '7ª Rodada', data: '2027-02-17T23:30:00Z', home: 'operario', away: 'bataguassu', estadio: 'Moreninhas', cidade: 'Campo Grande' },
      { ref: 32, rod: '7ª Rodada', data: '2027-02-17T23:30:00Z', home: 'ivinhema', away: 'naviraiense', estadio: 'Saraivão', cidade: 'Ivinhema' },
      { ref: 33, rod: '7ª Rodada', data: '2027-02-17T23:30:00Z', home: 'corumbaense', away: 'dourados', estadio: 'Arthur Marinho', cidade: 'Corumbá' },
      { ref: 34, rod: '7ª Rodada', data: '2027-02-17T23:30:00Z', home: 'misto', away: 'comercial', estadio: 'Madrugadão', cidade: 'Três Lagoas' },
      { ref: 35, rod: '7ª Rodada', data: '2027-02-18T23:30:00Z', home: 'pantanal', away: 'cra', estadio: 'Moreninhas', cidade: 'Campo Grande' },

      // 8ª Rodada
      { ref: 36, rod: '8ª Rodada', data: '2027-02-20T22:00:00Z', home: 'bataguassu', away: 'ivinhema', estadio: 'Pereirão', cidade: 'Bataguassu' },
      { ref: 37, rod: '8ª Rodada', data: '2027-02-20T20:00:00Z', home: 'cra', away: 'corumbaense', estadio: 'Noroeste', cidade: 'Aquidauana' },
      { ref: 38, rod: '8ª Rodada', data: '2027-02-21T19:00:00Z', home: 'dourados', away: 'operario', estadio: 'Douradão', cidade: 'Dourados' },
      { ref: 39, rod: '8ª Rodada', data: '2027-02-21T21:00:00Z', home: 'naviraiense', away: 'misto', estadio: 'Virotão', cidade: 'Naviraí' },
      { ref: 40, rod: '8ª Rodada', data: '2027-02-21T20:00:00Z', home: 'comercial', away: 'pantanal', estadio: 'Moreninhas', cidade: 'Campo Grande' },

      // 9ª Rodada
      { ref: 41, rod: '9ª Rodada', data: '2027-02-24T23:30:00Z', home: 'bataguassu', away: 'dourados', estadio: 'Pereirão', cidade: 'Bataguassu' },
      { ref: 42, rod: '9ª Rodada', data: '2027-02-24T23:30:00Z', home: 'ivinhema', away: 'misto', estadio: 'Saraivão', cidade: 'Ivinhema' },
      { ref: 43, rod: '9ª Rodada', data: '2027-02-24T23:30:00Z', home: 'operario', away: 'cra', estadio: 'Moreninhas', cidade: 'Campo Grande' },
      { ref: 44, rod: '9ª Rodada', data: '2027-02-24T23:30:00Z', home: 'naviraiense', away: 'pantanal', estadio: 'Virotão', cidade: 'Naviraí' },
      { ref: 45, rod: '9ª Rodada', data: '2027-02-24T23:30:00Z', home: 'corumbaense', away: 'comercial', estadio: 'Arthur Marinho', cidade: 'Corumbá' },
    ];

    let insertedFixtures = 0;

    for (const m of MATCHES_SCHEDULE) {
      const extId = 202762300 + m.ref;
      const homeTeamId = teamDbMap.get(m.home);
      const awayTeamId = teamDbMap.get(m.away);

      if (!homeTeamId || !awayTeamId) {
        this.logger.warn(`[SULMATOGROSSENSE-2027-SEEDER] Time não encontrado para jogo ${m.ref}: ${m.home} x ${m.away}`);
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

    const successMsg = `Povoamento concluído: ${insertedFixtures} partidas e 10 clubes registrados para o Sul-Mato-Grossense 2027.`;
    this.logger.log(`[SULMATOGROSSENSE-2027-SEEDER] ${successMsg}`);
    return { success: true, fixturesCount: insertedFixtures, message: successMsg };
  }
}

