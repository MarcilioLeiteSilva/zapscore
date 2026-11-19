import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class Mineiro2027SeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(Mineiro2027SeederService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap() {
    this.logger.log('[MINEIRO-2027-SEEDER] Verificando integridade das partidas de 2027 no bootstrap...');
    try {
      await this.seedMineiro2027();
    } catch (err: any) {
      this.logger.error(`[MINEIRO-2027-SEEDER] Falha ao verificar/popular 2027: ${err.message}`, err.stack);
    }
  }

  async seedMineiro2027(): Promise<{ success: boolean; fixturesCount: number; message: string }> {
    // 1. Obter ou criar a liga Campeonato Mineiro Módulo 1 (629)
    let league = await this.prisma.league.findUnique({
      where: { externalId: 629 },
    });

    if (!league) {
      league = await this.prisma.league.create({
        data: {
          externalId: 629,
          name: 'Campeonato Mineiro Módulo 1',
          country: 'Brazil',
          logo: 'https://media.api-sports.io/football/leagues/629.png',
          type: 'League',
          season: 2027,
        },
      });
      this.logger.log('[MINEIRO-2027-SEEDER] Liga 629 criada no banco.');
    }

    // 2. Verificar se os 36 jogos da 1ª Fase já existem
    const existingCount = await this.prisma.fixture.count({
      where: { leagueId: league.id, season: 2027 },
    });

    if (existingCount >= 36) {
      const msg = `Mineiro 2027 já possui ${existingCount} partidas cadastradas. Nenhuma ação necessária.`;
      this.logger.log(`[MINEIRO-2027-SEEDER] ${msg}`);
      return { success: true, fixturesCount: existingCount, message: msg };
    }

    this.logger.log('[MINEIRO-2027-SEEDER] Populando 12 clubes oficiais e 36 jogos da FMF 2027...');

    // 3. Upsert dos 12 Clubes Oficiais (Grupos A e B — REC/FMF 2027)
    const TEAMS_DEF = [
      // Grupo A
      { key: 'atletico_mg', externalId: 1062, name: 'Atlético-MG', code: 'CAM', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/1062.png' },
      { key: 'pouso_alegre', externalId: 13084, name: 'Pouso Alegre', code: 'PAF', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/13084.png' },
      { key: 'north', externalId: 21166, name: 'North', code: 'NOR', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/21166.png' },
      { key: 'tombense', externalId: 2227, name: 'Tombense', code: 'TOM', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/2227.png' },
      { key: 'betim', externalId: 13086, name: 'Betim', code: 'BET', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/13086.png' },
      { key: 'villa_nova', externalId: 629001, name: 'Villa Nova-MG', code: 'VIL', logo: 'https://cdn-img.staticzz.com/img/logos/equipas/3536_imgbank.png' },
      // Grupo B
      { key: 'cruzeiro', externalId: 135, name: 'Cruzeiro', code: 'CRU', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/135.png' },
      { key: 'america_mg', externalId: 125, name: 'América-MG', code: 'AME', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/125.png' },
      { key: 'urt', externalId: 2228, name: 'URT', code: 'URT', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/2228.png' },
      { key: 'uberlandia', externalId: 1196, name: 'Uberlândia', code: 'UBE', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/1196.png' },
      { key: 'itabirito', externalId: 21165, name: 'Itabirito', code: 'ITA', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/21165.png' },
      { key: 'democrata_sl', externalId: 13081, name: 'Democrata-SL', code: 'DSL', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/13081.png' },
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

    // 4. Upsert da Classificação Inicial (12 clubes zerados)
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

    // 5. As 36 Partidas Oficiais da Fase Classificatória FMF 2027 (6 Rodadas x 6 Jogos)
    // Horários convertidos de BRT (UTC-3) para UTC (+3h)
    const MATCHES_SCHEDULE = [
      // 1ª Rodada (03/01 e 06/01/2027)
      { ref: 1, rod: '1ª Rodada', data: '2027-01-03T20:00:00Z', home: 'north', away: 'urt', estadio: 'Arena Credinor', cidade: 'Montes Claros' },
      { ref: 2, rod: '1ª Rodada', data: '2027-01-06T22:00:00Z', home: 'pouso_alegre', away: 'america_mg', estadio: 'Irmão Gino Maria Rossi - Manduzão', cidade: 'Pouso Alegre' },
      { ref: 3, rod: '1ª Rodada', data: '2027-01-06T22:00:00Z', home: 'tombense', away: 'democrata_sl', estadio: 'Antônio G. de Almeida', cidade: 'Tombos' },
      { ref: 4, rod: '1ª Rodada', data: '2027-01-06T22:30:00Z', home: 'betim', away: 'uberlandia', estadio: 'Arena Urbsan', cidade: 'Betim' },
      { ref: 5, rod: '1ª Rodada', data: '2027-01-06T22:30:00Z', home: 'villa_nova', away: 'cruzeiro', estadio: 'Castor Cifuentes', cidade: 'Nova Lima' },
      { ref: 6, rod: '1ª Rodada', data: '2027-01-06T23:00:00Z', home: 'atletico_mg', away: 'itabirito', estadio: 'Arena MRV', cidade: 'Belo Horizonte' },

      // 2ª Rodada (09/01 e 10/01/2027)
      { ref: 7, rod: '2ª Rodada', data: '2027-01-09T19:00:00Z', home: 'america_mg', away: 'north', estadio: 'Independência', cidade: 'Belo Horizonte' },
      { ref: 8, rod: '2ª Rodada', data: '2027-01-09T19:00:00Z', home: 'democrata_sl', away: 'villa_nova', estadio: 'Arena do Jacaré', cidade: 'Sete Lagoas' },
      { ref: 9, rod: '2ª Rodada', data: '2027-01-09T19:00:00Z', home: 'itabirito', away: 'pouso_alegre', estadio: 'Dilzon Melo', cidade: 'Varginha' },
      { ref: 10, rod: '2ª Rodada', data: '2027-01-09T21:00:00Z', home: 'uberlandia', away: 'atletico_mg', estadio: 'Parque do Sabiá', cidade: 'Uberlândia' },
      { ref: 11, rod: '2ª Rodada', data: '2027-01-09T22:30:00Z', home: 'urt', away: 'tombense', estadio: 'Arena DB (Zama Maciel)', cidade: 'Patos de Minas' },
      { ref: 12, rod: '2ª Rodada', data: '2027-01-10T20:00:00Z', home: 'cruzeiro', away: 'betim', estadio: 'Mineirão', cidade: 'Belo Horizonte' },

      // 3ª Rodada (13/01/2027)
      { ref: 13, rod: '3ª Rodada', data: '2027-01-13T22:00:00Z', home: 'pouso_alegre', away: 'democrata_sl', estadio: 'Irmão Gino Maria Rossi - Manduzão', cidade: 'Pouso Alegre' },
      { ref: 14, rod: '3ª Rodada', data: '2027-01-13T22:00:00Z', home: 'tombense', away: 'uberlandia', estadio: 'Antônio G. de Almeida', cidade: 'Tombos' },
      { ref: 15, rod: '3ª Rodada', data: '2027-01-13T22:30:00Z', home: 'betim', away: 'america_mg', estadio: 'Arena Urbsan', cidade: 'Betim' },
      { ref: 16, rod: '3ª Rodada', data: '2027-01-13T22:30:00Z', home: 'villa_nova', away: 'itabirito', estadio: 'Castor Cifuentes', cidade: 'Nova Lima' },
      { ref: 17, rod: '3ª Rodada', data: '2027-01-13T23:00:00Z', home: 'atletico_mg', away: 'urt', estadio: 'Arena MRV', cidade: 'Belo Horizonte' },
      { ref: 18, rod: '3ª Rodada', data: '2027-01-13T23:00:00Z', home: 'north', away: 'cruzeiro', estadio: 'Arena Credinor', cidade: 'Montes Claros' },

      // 4ª Rodada (16/01 e 17/01/2027)
      { ref: 19, rod: '4ª Rodada', data: '2027-01-16T19:00:00Z', home: 'america_mg', away: 'tombense', estadio: 'Independência', cidade: 'Belo Horizonte' },
      { ref: 20, rod: '4ª Rodada', data: '2027-01-16T19:00:00Z', home: 'democrata_sl', away: 'north', estadio: 'Arena do Jacaré', cidade: 'Sete Lagoas' },
      { ref: 21, rod: '4ª Rodada', data: '2027-01-16T19:00:00Z', home: 'itabirito', away: 'betim', estadio: 'Dilzon Melo', cidade: 'Varginha' },
      { ref: 22, rod: '4ª Rodada', data: '2027-01-16T21:00:00Z', home: 'uberlandia', away: 'villa_nova', estadio: 'Parque do Sabiá', cidade: 'Uberlândia' },
      { ref: 23, rod: '4ª Rodada', data: '2027-01-16T22:30:00Z', home: 'urt', away: 'pouso_alegre', estadio: 'Arena DB (Zama Maciel)', cidade: 'Patos de Minas' },
      { ref: 24, rod: '4ª Rodada', data: '2027-01-17T20:00:00Z', home: 'cruzeiro', away: 'atletico_mg', estadio: 'Mineirão', cidade: 'Belo Horizonte' },

      // 5ª Rodada (20/01/2027)
      { ref: 25, rod: '5ª Rodada', data: '2027-01-20T22:00:00Z', home: 'pouso_alegre', away: 'uberlandia', estadio: 'Irmão Gino Maria Rossi - Manduzão', cidade: 'Pouso Alegre' },
      { ref: 26, rod: '5ª Rodada', data: '2027-01-20T22:00:00Z', home: 'tombense', away: 'cruzeiro', estadio: 'Antônio G. de Almeida', cidade: 'Tombos' },
      { ref: 27, rod: '5ª Rodada', data: '2027-01-20T22:30:00Z', home: 'betim', away: 'democrata_sl', estadio: 'Arena Urbsan', cidade: 'Betim' },
      { ref: 28, rod: '5ª Rodada', data: '2027-01-20T22:30:00Z', home: 'villa_nova', away: 'urt', estadio: 'Castor Cifuentes', cidade: 'Nova Lima' },
      { ref: 29, rod: '5ª Rodada', data: '2027-01-20T23:00:00Z', home: 'atletico_mg', away: 'america_mg', estadio: 'Arena MRV', cidade: 'Belo Horizonte' },
      { ref: 30, rod: '5ª Rodada', data: '2027-01-20T23:00:00Z', home: 'north', away: 'itabirito', estadio: 'Arena Credinor', cidade: 'Montes Claros' },

      // 6ª Rodada (23/01/2027)
      { ref: 31, rod: '6ª Rodada', data: '2027-01-23T19:00:00Z', home: 'america_mg', away: 'villa_nova', estadio: 'Independência', cidade: 'Belo Horizonte' },
      { ref: 32, rod: '6ª Rodada', data: '2027-01-23T19:00:00Z', home: 'cruzeiro', away: 'pouso_alegre', estadio: 'Mineirão', cidade: 'Belo Horizonte' },
      { ref: 33, rod: '6ª Rodada', data: '2027-01-23T19:00:00Z', home: 'democrata_sl', away: 'atletico_mg', estadio: 'Arena do Jacaré', cidade: 'Sete Lagoas' },
      { ref: 34, rod: '6ª Rodada', data: '2027-01-23T19:00:00Z', home: 'itabirito', away: 'tombense', estadio: 'Dilzon Melo', cidade: 'Varginha' },
      { ref: 35, rod: '6ª Rodada', data: '2027-01-23T19:00:00Z', home: 'urt', away: 'betim', estadio: 'Arena DB (Zama Maciel)', cidade: 'Patos de Minas' },
      { ref: 36, rod: '6ª Rodada', data: '2027-01-23T19:00:00Z', home: 'uberlandia', away: 'north', estadio: 'Parque do Sabiá', cidade: 'Uberlândia' },
    ];

    let insertedFixtures = 0;

    for (const m of MATCHES_SCHEDULE) {
      const extId = 202762900 + m.ref;
      const homeTeamId = teamDbMap.get(m.home);
      const awayTeamId = teamDbMap.get(m.away);

      if (!homeTeamId || !awayTeamId) {
        this.logger.warn(`[MINEIRO-2027-SEEDER] Time não encontrado para jogo ${m.ref}: ${m.home} x ${m.away}`);
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

    const successMsg = `Povoamento concluído: ${insertedFixtures} partidas e 12 clubes registrados para o Mineiro 2027.`;
    this.logger.log(`[MINEIRO-2027-SEEDER] ${successMsg}`);
    return { success: true, fixturesCount: insertedFixtures, message: successMsg };
  }
}
