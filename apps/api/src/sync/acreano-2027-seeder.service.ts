import { Injectable, Logger, OnApplicationBootstrap, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class Acreano2027SeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(Acreano2027SeederService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly redis?: RedisService,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('[ACREANO-2027-SEEDER] Verificando integridade das partidas de 2027 no bootstrap...');
    try {
      await this.seedAcreano2027();
    } catch (err: any) {
      this.logger.error(`[ACREANO-2027-SEEDER] Falha ao verificar/popular 2027: ${err.message}`, err.stack);
    }
  }

  async seedAcreano2027(): Promise<{ success: boolean; fixturesCount: number; message: string }> {
    try {
      return await this._executeSeed();
    } catch (err: any) {
      this.logger.error(`[ACREANO-2027-SEEDER] ERRO FATAL: ${err.message}`, err.stack);
      return { success: false, fixturesCount: 0, message: `Erro: ${err.message}` };
    }
  }

  private async _executeSeed(): Promise<{ success: boolean; fixturesCount: number; message: string }> {
    // 1. Obter ou atualizar a liga Campeonato Acreano (520)
    const league = await this.prisma.league.upsert({
      where: { externalId: 520 },
      update: {
        name: 'Campeonato Acreano',
        country: 'Brasil',
        logo: 'https://wsrv.nl/?url=media.api-sports.io/football/leagues/520.png',
        season: 2027,
      },
      create: {
        externalId: 520,
        name: 'Campeonato Acreano',
        country: 'Brasil',
        logo: 'https://wsrv.nl/?url=media.api-sports.io/football/leagues/520.png',
        type: 'League',
        season: 2027,
      },
    });

    // 2. Os 8 clubes oficiais da FFAC para 2027
    const TEAMS_DEF = [
      { key: 'adesg', externalId: 18391, name: 'ADESG', code: 'ADE', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/18391.png' },
      { key: 'atletico_ac', externalId: 7768, name: 'Atlético Acreano', code: 'AAC', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/7768.png' },
      { key: 'galvez', externalId: 1228, name: 'Galvez', code: 'GAL', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/1228.png' },
      { key: 'humaita', externalId: 10478, name: 'Humaitá', code: 'HUM', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/10478.png' },
      { key: 'independencia', externalId: 10853, name: 'Independência', code: 'IND', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/10853.png' },
      { key: 'placido', externalId: 7849, name: 'Plácido de Castro', code: 'PLA', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/7849.png' },
      { key: 'rio_branco', externalId: 2220, name: 'Rio Branco-AC', code: 'RBR', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/2220.png' },
      { key: 'santa_cruz', externalId: 27283, name: 'Santa Cruz-AC', code: 'STC', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/27283.png' },
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

    this.logger.log('[ACREANO-2027-SEEDER] Populando 28 jogos oficiais da FFAC 2027...');

    // 4. As 28 partidas oficiais da 1ª Fase (Turno Único) publicadas pela FFAC
    const scheduleFFAC = [
      // 1ª Rodada
      { ref: 1, rod: '1ª Rodada', data: '2027-01-09T20:30:00Z', home: 'santa_cruz', away: 'atletico_ac', estadio: 'Estádio Tonicão', cidade: 'Rio Branco' },
      { ref: 2, rod: '1ª Rodada', data: '2027-01-09T22:45:00Z', home: 'rio_branco', away: 'placido', estadio: 'Estádio Tonicão', cidade: 'Rio Branco' },
      { ref: 3, rod: '1ª Rodada', data: '2027-01-10T22:00:00Z', home: 'galvez', away: 'adesg', estadio: 'Arena da Floresta', cidade: 'Rio Branco' },
      { ref: 12, rod: '1ª Rodada', data: '2027-01-26T23:00:00Z', home: 'humaita', away: 'independencia', estadio: 'Estádio Tonicão', cidade: 'Rio Branco' },

      // 2ª Rodada
      { ref: 4, rod: '2ª Rodada', data: '2027-01-14T22:00:00Z', home: 'independencia', away: 'atletico_ac', estadio: 'Arena da Floresta', cidade: 'Rio Branco' },
      { ref: 5, rod: '2ª Rodada', data: '2027-01-15T00:15:00Z', home: 'adesg', away: 'rio_branco', estadio: 'Arena da Floresta', cidade: 'Rio Branco' },
      { ref: 6, rod: '2ª Rodada', data: '2027-01-16T20:30:00Z', home: 'galvez', away: 'humaita', estadio: 'Estádio Tonicão', cidade: 'Rio Branco' },
      { ref: 7, rod: '2ª Rodada', data: '2027-01-16T22:45:00Z', home: 'santa_cruz', away: 'placido', estadio: 'Estádio Tonicão', cidade: 'Rio Branco' },

      // 3ª Rodada
      { ref: 8, rod: '3ª Rodada', data: '2027-01-21T22:00:00Z', home: 'humaita', away: 'rio_branco', estadio: 'Arena da Floresta', cidade: 'Rio Branco' },
      { ref: 9, rod: '3ª Rodada', data: '2027-01-22T00:15:00Z', home: 'santa_cruz', away: 'independencia', estadio: 'Arena da Floresta', cidade: 'Rio Branco' },
      { ref: 10, rod: '3ª Rodada', data: '2027-01-23T20:30:00Z', home: 'placido', away: 'adesg', estadio: 'Estádio Tonicão', cidade: 'Rio Branco' },
      { ref: 11, rod: '3ª Rodada', data: '2027-01-23T22:45:00Z', home: 'atletico_ac', away: 'galvez', estadio: 'Estádio Tonicão', cidade: 'Rio Branco' },

      // 4ª Rodada
      { ref: 13, rod: '4ª Rodada', data: '2027-01-30T20:30:00Z', home: 'placido', away: 'humaita', estadio: 'Estádio Tonicão', cidade: 'Rio Branco' },
      { ref: 14, rod: '4ª Rodada', data: '2027-01-30T22:45:00Z', home: 'independencia', away: 'galvez', estadio: 'Estádio Tonicão', cidade: 'Rio Branco' },
      { ref: 15, rod: '4ª Rodada', data: '2027-01-31T21:00:00Z', home: 'adesg', away: 'santa_cruz', estadio: 'Arena da Floresta', cidade: 'Rio Branco' },
      { ref: 16, rod: '4ª Rodada', data: '2027-01-31T23:15:00Z', home: 'atletico_ac', away: 'rio_branco', estadio: 'Arena da Floresta', cidade: 'Rio Branco' },

      // 5ª Rodada
      { ref: 17, rod: '5ª Rodada', data: '2027-02-13T20:30:00Z', home: 'rio_branco', away: 'independencia', estadio: 'Estádio Tonicão', cidade: 'Rio Branco' },
      { ref: 18, rod: '5ª Rodada', data: '2027-02-13T22:45:00Z', home: 'humaita', away: 'adesg', estadio: 'Estádio Tonicão', cidade: 'Rio Branco' },
      { ref: 19, rod: '5ª Rodada', data: '2027-02-14T21:00:00Z', home: 'atletico_ac', away: 'placido', estadio: 'Arena da Floresta', cidade: 'Rio Branco' },
      { ref: 20, rod: '5ª Rodada', data: '2027-02-14T23:15:00Z', home: 'galvez', away: 'santa_cruz', estadio: 'Arena da Floresta', cidade: 'Rio Branco' },

      // 6ª Rodada
      { ref: 21, rod: '6ª Rodada', data: '2027-02-18T22:00:00Z', home: 'adesg', away: 'atletico_ac', estadio: 'Arena da Floresta', cidade: 'Rio Branco' },
      { ref: 22, rod: '6ª Rodada', data: '2027-02-19T00:15:00Z', home: 'independencia', away: 'placido', estadio: 'Arena da Floresta', cidade: 'Rio Branco' },
      { ref: 23, rod: '6ª Rodada', data: '2027-02-20T20:30:00Z', home: 'rio_branco', away: 'galvez', estadio: 'Estádio Tonicão', cidade: 'Rio Branco' },
      { ref: 24, rod: '6ª Rodada', data: '2027-02-20T22:45:00Z', home: 'humaita', away: 'santa_cruz', estadio: 'Estádio Tonicão', cidade: 'Rio Branco' },

      // 7ª Rodada
      { ref: 25, rod: '7ª Rodada', data: '2027-02-25T22:00:00Z', home: 'placido', away: 'galvez', estadio: 'Arena da Floresta', cidade: 'Rio Branco' },
      { ref: 26, rod: '7ª Rodada', data: '2027-02-26T00:15:00Z', home: 'atletico_ac', away: 'humaita', estadio: 'Arena da Floresta', cidade: 'Rio Branco' },
      { ref: 27, rod: '7ª Rodada', data: '2027-02-27T20:30:00Z', home: 'santa_cruz', away: 'rio_branco', estadio: 'Estádio Tonicão', cidade: 'Rio Branco' },
      { ref: 28, rod: '7ª Rodada', data: '2027-02-27T22:45:00Z', home: 'independencia', away: 'adesg', estadio: 'Estádio Tonicão', cidade: 'Rio Branco' },
    ];

    let insertedFixtures = 0;
    for (const m of scheduleFFAC) {
      const homeTeamId = teamDbMap.get(m.home);
      const awayTeamId = teamDbMap.get(m.away);
      const extId = 202752000 + m.ref;

      if (!homeTeamId || !awayTeamId) {
        this.logger.warn(`[ACREANO-2027-SEEDER] Time não encontrado para jogo ${m.ref}: ${m.home} x ${m.away}`);
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

    const successMsg = `Povoamento concluído: ${insertedFixtures} partidas e 8 clubes registrados para o Acreano 2027.`;
    this.logger.log(`[ACREANO-2027-SEEDER] ${successMsg}`);
    return { success: true, fixturesCount: insertedFixtures, message: successMsg };
  }
}
