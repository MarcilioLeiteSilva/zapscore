import { Injectable, Logger, OnApplicationBootstrap, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class Potiguar2027SeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(Potiguar2027SeederService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly redis?: RedisService,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('[POTIGUAR-2027-SEEDER] Verificando integridade das partidas de 2027 no bootstrap...');
    try {
      await this.seedPotiguar2027();
    } catch (err: any) {
      this.logger.error(`[POTIGUAR-2027-SEEDER] Falha ao verificar/popular 2027: ${err.message}`, err.stack);
    }
  }

  async seedPotiguar2027(): Promise<{ success: boolean; fixturesCount: number; message: string }> {
    try {
      return await this._executeSeed();
    } catch (err: any) {
      this.logger.error(`[POTIGUAR-2027-SEEDER] ERRO FATAL: ${err.message}`, err.stack);
      return { success: false, fixturesCount: 0, message: `Erro: ${err.message}` };
    }
  }

  private async _executeSeed(): Promise<{ success: boolean; fixturesCount: number; message: string }> {
    // 1. Obter ou atualizar a liga Campeonato Potiguar (616)
    const league = await this.prisma.league.upsert({
      where: { externalId: 616 },
      update: {
        name: 'Campeonato Potiguar',
        country: 'Brasil',
        logo: 'https://wsrv.nl/?url=media.api-sports.io/football/leagues/616.png',
        season: 2027,
      },
      create: {
        externalId: 616,
        name: 'Campeonato Potiguar',
        country: 'Brasil',
        logo: 'https://wsrv.nl/?url=media.api-sports.io/football/leagues/616.png',
        type: 'League',
        season: 2027,
      },
    });

    // 2. Os 8 clubes oficiais da FNF para 2027
    const TEAMS_DEF = [
      { key: 'abc', externalId: 754, name: 'ABC', code: 'ABC', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/754.png' },
      { key: 'america_rn', externalId: 2233, name: 'América-RN', code: 'AME', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/2233.png' },
      { key: 'alecrim', externalId: 20715, name: 'Alecrim', code: 'ALE', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/20715.png' },
      { key: 'laguna', externalId: 274175, name: 'Laguna', code: 'LAG', logo: 'https://wsrv.nl/?url=cdn-img.staticzz.com/img/logos/equipas/274175_imgbank_1740583405.png' },
      { key: 'palmeira', externalId: 12949, name: 'Palmeira', code: 'PAL', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/12949.png' },
      { key: 'potiguar', externalId: 7861, name: 'Potiguar de Mossoró', code: 'POT', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/7861.png' },
      { key: 'qfc', externalId: 25073, name: 'QFC', code: 'QFC', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/25073.png' },
      { key: 'santa_cruz_rn', externalId: 2222, name: 'Santa Cruz de Natal', code: 'STC', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/2222.png' },
    ];

    const teamDbMap = new Map<string, string>();
    for (const t of TEAMS_DEF) {
      const team = await this.prisma.team.upsert({
        where: { externalId: t.externalId },
        update: {
          name: t.name,
          logo: t.logo,
          code: t.code,
        },
        create: {
          externalId: t.externalId,
          name: t.name,
          code: t.code,
          country: 'Brasil',
          logo: t.logo,
        },
      });
      teamDbMap.set(t.key, team.id);
    }

    // 3. Tabela zerada de classificação (Turno Único, 8 clubes)
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

    this.logger.log('[POTIGUAR-2027-SEEDER] Populando 28 jogos oficiais da FNF 2027...');

    // 4. As 28 partidas oficiais da 1ª Fase (Turno Único) publicadas pela FNF
    const scheduleFNF = [
      // 1ª Rodada
      { ref: 1, rod: '1ª Rodada', data: '2027-01-09T19:00:00Z', home: 'abc', away: 'laguna', estadio: 'Estádio Frasqueirão', cidade: 'Natal' },
      { ref: 2, rod: '1ª Rodada', data: '2027-01-09T19:00:00Z', home: 'america_rn', away: 'alecrim', estadio: 'Arena das Dunas', cidade: 'Natal' },
      { ref: 3, rod: '1ª Rodada', data: '2027-01-10T19:00:00Z', home: 'potiguar', away: 'santa_cruz_rn', estadio: 'Estádio Edgarzão', cidade: 'Assú' },
      { ref: 4, rod: '1ª Rodada', data: '2027-01-10T19:00:00Z', home: 'qfc', away: 'palmeira', estadio: 'Estádio Pascoal de Lima', cidade: 'Natal' },

      // 2ª Rodada
      { ref: 5, rod: '2ª Rodada', data: '2027-01-13T19:00:00Z', home: 'palmeira', away: 'abc', estadio: 'Estádio Nazarenão', cidade: 'Goianinha' },
      { ref: 6, rod: '2ª Rodada', data: '2027-01-13T23:00:00Z', home: 'santa_cruz_rn', away: 'america_rn', estadio: 'Estádio Barrettão', cidade: 'Ceará-Mirim' },
      { ref: 7, rod: '2ª Rodada', data: '2027-01-13T23:00:00Z', home: 'potiguar', away: 'qfc', estadio: 'Estádio Edgarzão', cidade: 'Assú' },
      { ref: 8, rod: '2ª Rodada', data: '2027-01-13T19:00:00Z', home: 'alecrim', away: 'laguna', estadio: 'Estádio Barrettão', cidade: 'Ceará-Mirim' },

      // 3ª Rodada
      { ref: 9, rod: '3ª Rodada', data: '2027-01-16T19:00:00Z', home: 'qfc', away: 'abc', estadio: 'Estádio Pascoal de Lima', cidade: 'Natal' },
      { ref: 10, rod: '3ª Rodada', data: '2027-01-17T19:00:00Z', home: 'america_rn', away: 'potiguar', estadio: 'Arena das Dunas', cidade: 'Natal' },
      { ref: 11, rod: '3ª Rodada', data: '2027-01-17T19:00:00Z', home: 'laguna', away: 'santa_cruz_rn', estadio: 'Estádio Nazarenão', cidade: 'Goianinha' },
      { ref: 12, rod: '3ª Rodada', data: '2027-01-17T19:00:00Z', home: 'palmeira', away: 'alecrim', estadio: 'Estádio Nazarenão', cidade: 'Goianinha' },

      // 4ª Rodada
      { ref: 13, rod: '4ª Rodada', data: '2027-01-20T23:00:00Z', home: 'abc', away: 'america_rn', estadio: 'Estádio Frasqueirão', cidade: 'Natal' },
      { ref: 14, rod: '4ª Rodada', data: '2027-01-20T23:00:00Z', home: 'potiguar', away: 'laguna', estadio: 'Estádio Edgarzão', cidade: 'Assú' },
      { ref: 15, rod: '4ª Rodada', data: '2027-01-20T19:00:00Z', home: 'alecrim', away: 'qfc', estadio: 'Estádio Barrettão', cidade: 'Ceará-Mirim' },
      { ref: 16, rod: '4ª Rodada', data: '2027-01-20T19:00:00Z', home: 'santa_cruz_rn', away: 'palmeira', estadio: 'Estádio Barrettão', cidade: 'Ceará-Mirim' },

      // 5ª Rodada
      { ref: 17, rod: '5ª Rodada', data: '2027-01-23T19:00:00Z', home: 'abc', away: 'alecrim', estadio: 'Estádio Frasqueirão', cidade: 'Natal' },
      { ref: 18, rod: '5ª Rodada', data: '2027-01-24T19:00:00Z', home: 'laguna', away: 'america_rn', estadio: 'Estádio Nazarenão', cidade: 'Goianinha' },
      { ref: 19, rod: '5ª Rodada', data: '2027-01-24T19:00:00Z', home: 'palmeira', away: 'potiguar', estadio: 'Estádio Nazarenão', cidade: 'Goianinha' },
      { ref: 20, rod: '5ª Rodada', data: '2027-01-24T19:00:00Z', home: 'qfc', away: 'santa_cruz_rn', estadio: 'Estádio Pascoal de Lima', cidade: 'Natal' },

      // 6ª Rodada
      { ref: 21, rod: '6ª Rodada', data: '2027-01-30T20:00:00Z', home: 'potiguar', away: 'abc', estadio: 'Estádio Edgarzão', cidade: 'Assú' },
      { ref: 22, rod: '6ª Rodada', data: '2027-01-31T19:00:00Z', home: 'america_rn', away: 'qfc', estadio: 'Arena das Dunas', cidade: 'Natal' },
      { ref: 23, rod: '6ª Rodada', data: '2027-01-31T19:00:00Z', home: 'santa_cruz_rn', away: 'alecrim', estadio: 'Estádio Barrettão', cidade: 'Ceará-Mirim' },
      { ref: 24, rod: '6ª Rodada', data: '2027-01-31T19:00:00Z', home: 'laguna', away: 'palmeira', estadio: 'Estádio Nazarenão', cidade: 'Goianinha' },

      // 7ª Rodada
      { ref: 25, rod: '7ª Rodada', data: '2027-02-14T19:00:00Z', home: 'abc', away: 'santa_cruz_rn', estadio: 'Estádio Frasqueirão', cidade: 'Natal' },
      { ref: 26, rod: '7ª Rodada', data: '2027-02-14T19:00:00Z', home: 'america_rn', away: 'palmeira', estadio: 'Arena das Dunas', cidade: 'Natal' },
      { ref: 27, rod: '7ª Rodada', data: '2027-02-14T19:00:00Z', home: 'alecrim', away: 'potiguar', estadio: 'Estádio Barrettão', cidade: 'Ceará-Mirim' },
      { ref: 28, rod: '7ª Rodada', data: '2027-02-14T19:00:00Z', home: 'qfc', away: 'laguna', estadio: 'Estádio Pascoal de Lima', cidade: 'Natal' },
    ];

    let insertedFixtures = 0;
    for (const m of scheduleFNF) {
      const homeTeamId = teamDbMap.get(m.home);
      const awayTeamId = teamDbMap.get(m.away);
      const extId = 202761600 + m.ref;

      if (!homeTeamId || !awayTeamId) {
        this.logger.warn(`[POTIGUAR-2027-SEEDER] Time não encontrado para jogo ${m.ref}: ${m.home} x ${m.away}`);
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

    if (this.redis) {
      try {
        await this.redis.delPattern('fixtures:*');
        await this.redis.delPattern('standings:*');
      } catch (_) {}
    }

    const successMsg = `Povoamento concluído: ${insertedFixtures} partidas e 8 clubes registrados para o Potiguar 2027.`;
    this.logger.log(`[POTIGUAR-2027-SEEDER] ${successMsg}`);
    return { success: true, fixturesCount: insertedFixtures, message: successMsg };
  }
}
