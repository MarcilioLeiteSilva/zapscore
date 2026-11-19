import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class Capixaba2027SeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(Capixaba2027SeederService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap() {
    this.logger.log('[CAPIXABA-2027-SEEDER] Verificando integridade das partidas de 2027 no bootstrap...');
    try {
      await this.seedCapixaba2027();
    } catch (err: any) {
      this.logger.error(`[CAPIXABA-2027-SEEDER] Falha ao verificar/popular 2027: ${err.message}`, err.stack);
    }
  }

  async seedCapixaba2027(): Promise<{ success: boolean; fixturesCount: number; message: string }> {
    // 1. Obter ou criar a liga Campeonato Capixaba (611)
    let league = await this.prisma.league.findUnique({
      where: { externalId: 611 },
    });

    if (!league) {
      league = await this.prisma.league.create({
        data: {
          externalId: 611,
          name: 'Campeonato Capixaba',
          country: 'Brazil',
          logo: 'https://media.api-sports.io/football/leagues/611.png',
          type: 'League',
          season: 2027,
        },
      });
      this.logger.log('[CAPIXABA-2027-SEEDER] Liga 611 criada no banco.');
    }

    // 2. Verificar se os 45 jogos já existem
    const existingCount = await this.prisma.fixture.count({
      where: { leagueId: league.id, season: 2027 },
    });

    if (existingCount >= 45) {
      const msg = `Capixaba 2027 já possui ${existingCount} partidas cadastradas. Nenhuma ação necessária.`;
      this.logger.log(`[CAPIXABA-2027-SEEDER] ${msg}`);
      return { success: true, fixturesCount: existingCount, message: msg };
    }

    this.logger.log('[CAPIXABA-2027-SEEDER] Populando 10 clubes oficiais e 45 jogos da FES 2027...');

    // 3. Upsert dos 10 Clubes Oficiais
    const TEAMS_DEF = [
      { key: 'porto_vitoria', externalId: 20717, name: 'Porto Vitória', code: 'PVI', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/20717.png' },
      { key: 'linhares', externalId: 12928, name: 'Linhares FC', code: 'LIN', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/12928.png' },
      { key: 'vitoria', externalId: 7837, name: 'Vitória-ES', code: 'VES', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/7837.png' },
      { key: 'estrela', externalId: 12282, name: 'Estrela do Norte', code: 'EST', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/12282.png' },
      { key: 'real_noroeste', externalId: 10679, name: 'Real Noroeste', code: 'RNO', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/10679.png' },
      { key: 'rio_branco', externalId: 10690, name: 'Rio Branco SAF', code: 'RBR', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/10690.png' },
      { key: 'vilavelhense', externalId: 15609, name: 'Vilavelhense', code: 'VIL', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/15609.png' },
      { key: 'forte', externalId: 26662, name: 'Forte FC', code: 'FOR', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/26662.png' },
      { key: 'serra', externalId: 2225, name: 'Serra', code: 'SER', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/2225.png' },
      { key: 'desportiva', externalId: 7856, name: 'Desportiva Ferroviária', code: 'DES', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/7856.png' },
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

    // 5. As 45 Partidas Oficiais da Tabela FES 2027
    const MATCHES_SCHEDULE = [
      // 1ª Rodada (13 de janeiro)
      { ref: 1, rod: '1ª Rodada', data: '2027-01-13T19:00:00Z', home: 'porto_vitoria', away: 'linhares', estadio: 'Kleber Andrade', cidade: 'Cariacica' },
      { ref: 2, rod: '1ª Rodada', data: '2027-01-13T19:00:00Z', home: 'vitoria', away: 'estrela', estadio: 'Salvador Costa', cidade: 'Vitória' },
      { ref: 3, rod: '1ª Rodada', data: '2027-01-13T19:00:00Z', home: 'real_noroeste', away: 'rio_branco', estadio: 'José Olímpio da Rocha', cidade: 'Águia Branca' },
      { ref: 4, rod: '1ª Rodada', data: '2027-01-13T19:00:00Z', home: 'vilavelhense', away: 'forte', estadio: 'Gil Bernardes', cidade: 'Vila Velha' },
      { ref: 5, rod: '1ª Rodada', data: '2027-01-13T19:00:00Z', home: 'serra', away: 'desportiva', estadio: 'Robertão', cidade: 'Serra' },

      // 2ª Rodada (16 de janeiro)
      { ref: 6, rod: '2ª Rodada', data: '2027-01-16T16:00:00Z', home: 'vitoria', away: 'porto_vitoria', estadio: 'Salvador Costa', cidade: 'Vitória' },
      { ref: 7, rod: '2ª Rodada', data: '2027-01-16T16:00:00Z', home: 'rio_branco', away: 'linhares', estadio: 'Kleber Andrade', cidade: 'Cariacica' },
      { ref: 8, rod: '2ª Rodada', data: '2027-01-16T16:00:00Z', home: 'forte', away: 'real_noroeste', estadio: 'Robertão', cidade: 'Rio Bananal' },
      { ref: 9, rod: '2ª Rodada', data: '2027-01-16T16:00:00Z', home: 'estrela', away: 'serra', estadio: 'Sumaré', cidade: 'Cachoeiro de Itapemirim' },
      { ref: 10, rod: '2ª Rodada', data: '2027-01-16T16:00:00Z', home: 'desportiva', away: 'vilavelhense', estadio: 'Engenheiro Araripe', cidade: 'Cariacica' },

      // 3ª Rodada (20 de janeiro)
      { ref: 11, rod: '3ª Rodada', data: '2027-01-20T19:00:00Z', home: 'porto_vitoria', away: 'rio_branco', estadio: 'Kleber Andrade', cidade: 'Cariacica' },
      { ref: 12, rod: '3ª Rodada', data: '2027-01-20T19:00:00Z', home: 'real_noroeste', away: 'desportiva', estadio: 'José Olímpio da Rocha', cidade: 'Águia Branca' },
      { ref: 13, rod: '3ª Rodada', data: '2027-01-20T19:00:00Z', home: 'vilavelhense', away: 'estrela', estadio: 'Gil Bernardes', cidade: 'Vila Velha' },
      { ref: 14, rod: '3ª Rodada', data: '2027-01-20T19:00:00Z', home: 'serra', away: 'vitoria', estadio: 'Robertão', cidade: 'Serra' },
      { ref: 15, rod: '3ª Rodada', data: '2027-01-20T19:00:00Z', home: 'linhares', away: 'forte', estadio: 'Guilhermão', cidade: 'Linhares' },

      // 4ª Rodada (23 de janeiro)
      { ref: 16, rod: '4ª Rodada', data: '2027-01-23T16:00:00Z', home: 'serra', away: 'porto_vitoria', estadio: 'Robertão', cidade: 'Serra' },
      { ref: 17, rod: '4ª Rodada', data: '2027-01-23T16:00:00Z', home: 'estrela', away: 'real_noroeste', estadio: 'Sumaré', cidade: 'Cachoeiro de Itapemirim' },
      { ref: 18, rod: '4ª Rodada', data: '2027-01-23T16:00:00Z', home: 'forte', away: 'rio_branco', estadio: 'Robertão', cidade: 'Rio Bananal' },
      { ref: 19, rod: '4ª Rodada', data: '2027-01-23T16:00:00Z', home: 'vitoria', away: 'vilavelhense', estadio: 'Salvador Costa', cidade: 'Vitória' },
      { ref: 20, rod: '4ª Rodada', data: '2027-01-23T16:00:00Z', home: 'desportiva', away: 'linhares', estadio: 'Engenheiro Araripe', cidade: 'Cariacica' },

      // 5ª Rodada (30 de janeiro)
      { ref: 21, rod: '5ª Rodada', data: '2027-01-30T16:00:00Z', home: 'porto_vitoria', away: 'forte', estadio: 'Kleber Andrade', cidade: 'Cariacica' },
      { ref: 22, rod: '5ª Rodada', data: '2027-01-30T16:00:00Z', home: 'rio_branco', away: 'desportiva', estadio: 'Kleber Andrade', cidade: 'Cariacica' },
      { ref: 23, rod: '5ª Rodada', data: '2027-01-30T16:00:00Z', home: 'real_noroeste', away: 'vitoria', estadio: 'José Olímpio da Rocha', cidade: 'Águia Branca' },
      { ref: 24, rod: '5ª Rodada', data: '2027-01-30T16:00:00Z', home: 'vilavelhense', away: 'serra', estadio: 'Gil Bernardes', cidade: 'Vila Velha' },
      { ref: 25, rod: '5ª Rodada', data: '2027-01-30T16:00:00Z', home: 'linhares', away: 'estrela', estadio: 'Guilhermão', cidade: 'Linhares' },

      // 6ª Rodada (10 de fevereiro)
      { ref: 26, rod: '6ª Rodada', data: '2027-02-10T19:00:00Z', home: 'estrela', away: 'rio_branco', estadio: 'Sumaré', cidade: 'Cachoeiro de Itapemirim' },
      { ref: 27, rod: '6ª Rodada', data: '2027-02-10T19:00:00Z', home: 'vilavelhense', away: 'porto_vitoria', estadio: 'Gil Bernardes', cidade: 'Vila Velha' },
      { ref: 28, rod: '6ª Rodada', data: '2027-02-10T19:00:00Z', home: 'vitoria', away: 'linhares', estadio: 'Salvador Costa', cidade: 'Vitória' },
      { ref: 29, rod: '6ª Rodada', data: '2027-02-10T19:00:00Z', home: 'serra', away: 'real_noroeste', estadio: 'Robertão', cidade: 'Serra' },
      { ref: 30, rod: '6ª Rodada', data: '2027-02-10T19:00:00Z', home: 'desportiva', away: 'forte', estadio: 'Engenheiro Araripe', cidade: 'Cariacica' },

      // 7ª Rodada (13 de fevereiro)
      { ref: 31, rod: '7ª Rodada', data: '2027-02-13T16:00:00Z', home: 'porto_vitoria', away: 'desportiva', estadio: 'Kleber Andrade', cidade: 'Cariacica' },
      { ref: 32, rod: '7ª Rodada', data: '2027-02-13T16:00:00Z', home: 'rio_branco', away: 'vitoria', estadio: 'Kleber Andrade', cidade: 'Cariacica' },
      { ref: 33, rod: '7ª Rodada', data: '2027-02-13T16:00:00Z', home: 'real_noroeste', away: 'vilavelhense', estadio: 'José Olímpio da Rocha', cidade: 'Águia Branca' },
      { ref: 34, rod: '7ª Rodada', data: '2027-02-13T16:00:00Z', home: 'forte', away: 'estrela', estadio: 'Robertão', cidade: 'Rio Bananal' },
      { ref: 35, rod: '7ª Rodada', data: '2027-02-13T16:00:00Z', home: 'linhares', away: 'serra', estadio: 'Guilhermão', cidade: 'Linhares' },

      // 8ª Rodada (17 de fevereiro)
      { ref: 36, rod: '8ª Rodada', data: '2027-02-17T19:00:00Z', home: 'serra', away: 'rio_branco', estadio: 'Robertão', cidade: 'Serra' },
      { ref: 37, rod: '8ª Rodada', data: '2027-02-17T19:00:00Z', home: 'real_noroeste', away: 'porto_vitoria', estadio: 'José Olímpio da Rocha', cidade: 'Águia Branca' },
      { ref: 38, rod: '8ª Rodada', data: '2027-02-17T19:00:00Z', home: 'estrela', away: 'desportiva', estadio: 'Sumaré', cidade: 'Cachoeiro de Itapemirim' },
      { ref: 39, rod: '8ª Rodada', data: '2027-02-17T19:00:00Z', home: 'vilavelhense', away: 'linhares', estadio: 'Gil Bernardes', cidade: 'Vila Velha' },
      { ref: 40, rod: '8ª Rodada', data: '2027-02-17T19:00:00Z', home: 'vitoria', away: 'forte', estadio: 'Salvador Costa', cidade: 'Vitória' },

      // 9ª Rodada (20 de fevereiro)
      { ref: 41, rod: '9ª Rodada', data: '2027-02-20T16:00:00Z', home: 'porto_vitoria', away: 'estrela', estadio: 'Kleber Andrade', cidade: 'Cariacica' },
      { ref: 42, rod: '9ª Rodada', data: '2027-02-20T16:00:00Z', home: 'rio_branco', away: 'vilavelhense', estadio: 'Kleber Andrade', cidade: 'Cariacica' },
      { ref: 43, rod: '9ª Rodada', data: '2027-02-20T16:00:00Z', home: 'forte', away: 'serra', estadio: 'Robertão', cidade: 'Rio Bananal' },
      { ref: 44, rod: '9ª Rodada', data: '2027-02-20T16:00:00Z', home: 'desportiva', away: 'vitoria', estadio: 'Engenheiro Araripe', cidade: 'Cariacica' },
      { ref: 45, rod: '9ª Rodada', data: '2027-02-20T16:00:00Z', home: 'linhares', away: 'real_noroeste', estadio: 'Guilhermão', cidade: 'Linhares' },
    ];

    let insertedFixtures = 0;

    for (const m of MATCHES_SCHEDULE) {
      const extId = 202761100 + m.ref;
      const homeTeamId = teamDbMap.get(m.home);
      const awayTeamId = teamDbMap.get(m.away);

      if (!homeTeamId || !awayTeamId) {
        this.logger.warn(`[CAPIXABA-2027-SEEDER] Time não encontrado para jogo ${m.ref}: ${m.home} x ${m.away}`);
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

    const successMsg = `Povoamento concluído: ${insertedFixtures} partidas e 10 clubes registrados para o Capixaba 2027.`;
    this.logger.log(`[CAPIXABA-2027-SEEDER] ${successMsg}`);
    return { success: true, fixturesCount: insertedFixtures, message: successMsg };
  }
}
