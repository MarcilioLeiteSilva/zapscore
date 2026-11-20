import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class Rondoniense2027SeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(Rondoniense2027SeederService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap() {
    this.logger.log('[RONDONIENSE-2027-SEEDER] Verificando integridade das partidas de 2027 no bootstrap...');
    try {
      await this.seedRondoniense2027();
    } catch (err: any) {
      this.logger.error(`[RONDONIENSE-2027-SEEDER] Falha ao verificar/popular 2027: ${err.message}`, err.stack);
    }
  }

  async seedRondoniense2027(): Promise<{ success: boolean; fixturesCount: number; message: string }> {
    // 1. Obter ou criar a liga Campeonato Rondoniense (615)
    let league = await this.prisma.league.findUnique({
      where: { externalId: 615 },
    });

    if (!league) {
      league = await this.prisma.league.create({
        data: {
          externalId: 615,
          name: 'Campeonato Rondoniense',
          country: 'Brazil',
          logo: 'https://media.api-sports.io/football/leagues/615.png',
          type: 'League',
          season: 2027,
        },
      });
      this.logger.log('[RONDONIENSE-2027-SEEDER] Liga 615 criada no banco.');
    }

    // 2. Verificar se os 24 jogos já existem
    const existingCount = await this.prisma.fixture.count({
      where: { leagueId: league.id, season: 2027 },
    });

    if (existingCount >= 24) {
      const msg = `Rondoniense 2027 já possui ${existingCount} partidas cadastradas. Nenhuma ação necessária.`;
      this.logger.log(`[RONDONIENSE-2027-SEEDER] ${msg}`);
      return { success: true, fixturesCount: existingCount, message: msg };
    }

    this.logger.log('[RONDONIENSE-2027-SEEDER] Populando 8 clubes oficiais e 24 jogos da FFER 2027...');

    // 3. Upsert dos 8 Clubes Oficiais
    const TEAMS_DEF = [
      // Grupo A (Capital)
      { key: 'porto_velho', externalId: 12946, name: 'Gazin Porto Velho', code: 'POR', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/12946.png' },
      { key: 'genus', externalId: 1229, name: 'Sport Genus', code: 'GEN', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/1229.png' },
      { key: 'rondoniense', externalId: 7877, name: 'Rondoniense', code: 'RON', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/7877.png' },
      { key: 'barcelona', externalId: 7823, name: 'Barcelona-RO', code: 'BAR', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/7823.png' },
      // Grupo B (Interior)
      { key: 'ji_parana', externalId: 10675, name: 'Ji-Paraná', code: 'JIP', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/10675.png' },
      { key: 'guapore', externalId: 12944, name: 'Guaporé', code: 'GUA', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/12944.png' },
      { key: 'rolim_de_moura', externalId: 25483, name: 'Rolim de Moura', code: 'ROL', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/25483.png' },
      { key: 'vilhena', externalId: 12281, name: 'Vilhena', code: 'VEC', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/12281.png' },
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

    // 5. As 24 Partidas Oficiais da Tabela FFER 2027 (1ª Fase - Turno e Returno)
    const MATCHES_SCHEDULE = [
      // 1ª Rodada (Jogos de Ida)
      { ref: 1, rod: '1ª Rodada', data: '2027-01-16T19:00:00Z', home: 'porto_velho', away: 'rondoniense', estadio: 'A Definir', cidade: 'Porto Velho' },
      { ref: 2, rod: '1ª Rodada', data: '2027-01-17T19:00:00Z', home: 'genus', away: 'barcelona', estadio: 'A Definir', cidade: 'Porto Velho' },
      { ref: 3, rod: '1ª Rodada', data: '2027-01-17T19:00:00Z', home: 'ji_parana', away: 'vilhena', estadio: 'Biancão', cidade: 'Ji-Paraná' },
      { ref: 4, rod: '1ª Rodada', data: '2027-01-17T21:00:00Z', home: 'guapore', away: 'rolim_de_moura', estadio: 'Cassolão', cidade: 'Rolim de Moura' },

      // 2ª Rodada
      { ref: 5, rod: '2ª Rodada', data: '2027-01-20T23:00:00Z', home: 'barcelona', away: 'porto_velho', estadio: 'A Definir', cidade: 'Porto Velho' },
      { ref: 6, rod: '2ª Rodada', data: '2027-01-20T23:00:00Z', home: 'rondoniense', away: 'genus', estadio: 'A Definir', cidade: 'Porto Velho' },
      { ref: 7, rod: '2ª Rodada', data: '2027-01-20T23:00:00Z', home: 'vilhena', away: 'guapore', estadio: 'Portal da Amazônia', cidade: 'Vilhena' },
      { ref: 8, rod: '2ª Rodada', data: '2027-01-20T23:00:00Z', home: 'rolim_de_moura', away: 'ji_parana', estadio: 'Cassolão', cidade: 'Rolim de Moura' },

      // 3ª Rodada
      { ref: 9, rod: '3ª Rodada', data: '2027-01-23T19:00:00Z', home: 'barcelona', away: 'rondoniense', estadio: 'A Definir', cidade: 'Porto Velho' },
      { ref: 10, rod: '3ª Rodada', data: '2027-01-24T19:00:00Z', home: 'porto_velho', away: 'genus', estadio: 'A Definir', cidade: 'Porto Velho' },
      { ref: 11, rod: '3ª Rodada', data: '2027-01-24T19:00:00Z', home: 'ji_parana', away: 'guapore', estadio: 'Biancão', cidade: 'Ji-Paraná' },
      { ref: 12, rod: '3ª Rodada', data: '2027-01-24T19:00:00Z', home: 'rolim_de_moura', away: 'vilhena', estadio: 'Cassolão', cidade: 'Rolim de Moura' },

      // 4ª Rodada (Jogos de Volta)
      { ref: 13, rod: '4ª Rodada', data: '2027-01-30T19:00:00Z', home: 'rondoniense', away: 'porto_velho', estadio: 'A Definir', cidade: 'Porto Velho' },
      { ref: 14, rod: '4ª Rodada', data: '2027-01-31T19:00:00Z', home: 'barcelona', away: 'genus', estadio: 'A Definir', cidade: 'Porto Velho' },
      { ref: 15, rod: '4ª Rodada', data: '2027-01-31T19:00:00Z', home: 'vilhena', away: 'ji_parana', estadio: 'Portal da Amazônia', cidade: 'Vilhena' },
      { ref: 16, rod: '4ª Rodada', data: '2027-01-31T19:00:00Z', home: 'rolim_de_moura', away: 'guapore', estadio: 'Cassolão', cidade: 'Rolim de Moura' },

      // 5ª Rodada
      { ref: 17, rod: '5ª Rodada', data: '2027-02-06T19:00:00Z', home: 'porto_velho', away: 'barcelona', estadio: 'A Definir', cidade: 'Porto Velho' },
      { ref: 18, rod: '5ª Rodada', data: '2027-02-07T19:00:00Z', home: 'genus', away: 'rondoniense', estadio: 'A Definir', cidade: 'Porto Velho' },
      { ref: 19, rod: '5ª Rodada', data: '2027-02-07T21:00:00Z', home: 'guapore', away: 'vilhena', estadio: 'Cassolão', cidade: 'Rolim de Moura' },
      { ref: 20, rod: '5ª Rodada', data: '2027-02-07T19:00:00Z', home: 'ji_parana', away: 'rolim_de_moura', estadio: 'Biancão', cidade: 'Ji-Paraná' },

      // 6ª Rodada
      { ref: 21, rod: '6ª Rodada', data: '2027-02-13T19:00:00Z', home: 'rondoniense', away: 'barcelona', estadio: 'A Definir', cidade: 'Porto Velho' },
      { ref: 22, rod: '6ª Rodada', data: '2027-02-13T19:00:00Z', home: 'genus', away: 'porto_velho', estadio: 'A Definir', cidade: 'Porto Velho' },
      { ref: 23, rod: '6ª Rodada', data: '2027-02-14T21:00:00Z', home: 'guapore', away: 'ji_parana', estadio: 'Cassolão', cidade: 'Rolim de Moura' },
      { ref: 24, rod: '6ª Rodada', data: '2027-02-14T19:00:00Z', home: 'vilhena', away: 'rolim_de_moura', estadio: 'Portal da Amazônia', cidade: 'Vilhena' },
    ];

    let insertedFixtures = 0;

    for (const m of MATCHES_SCHEDULE) {
      const extId = 202761500 + m.ref;
      const homeTeamId = teamDbMap.get(m.home);
      const awayTeamId = teamDbMap.get(m.away);

      if (!homeTeamId || !awayTeamId) {
        this.logger.warn(`[RONDONIENSE-2027-SEEDER] Time não encontrado para jogo ${m.ref}: ${m.home} x ${m.away}`);
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

    const successMsg = `Povoamento concluído: ${insertedFixtures} partidas e 8 clubes registrados para o Rondoniense 2027.`;
    this.logger.log(`[RONDONIENSE-2027-SEEDER] ${successMsg}`);
    return { success: true, fixturesCount: insertedFixtures, message: successMsg };
  }
}
