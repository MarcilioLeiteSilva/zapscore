import { Injectable, Logger, OnApplicationBootstrap, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class Matogrossense2027SeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(Matogrossense2027SeederService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly redis?: RedisService,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('[MATOGROSSENSE-2027-SEEDER] Verificando integridade das partidas de 2027 no bootstrap...');
    try {
      await this.seedMatogrossense2027();
    } catch (err: any) {
      this.logger.error(`[MATOGROSSENSE-2027-SEEDER] Falha ao verificar/popular 2027: ${err.message}`, err.stack);
    }
  }

  async seedMatogrossense2027(): Promise<{ success: boolean; fixturesCount: number; message: string }> {
    try {
      return await this._executeSeed();
    } catch (err: any) {
      this.logger.error(`[MATOGROSSENSE-2027-SEEDER] ERRO FATAL: ${err.message}`, err.stack);
      return { success: false, fixturesCount: 0, message: `Erro: ${err.message}` };
    }
  }

  private async _executeSeed(): Promise<{ success: boolean; fixturesCount: number; message: string }> {
    // 1. Obter ou atualizar a liga Campeonato Mato-Grossense (630)
    const league = await this.prisma.league.upsert({
      where: { externalId: 630 },
      update: {
        name: 'Campeonato Matogrossense',
        country: 'Brasil',
        logo: 'https://wsrv.nl/?url=media.api-sports.io/football/leagues/630.png',
        season: 2027,
      },
      create: {
        externalId: 630,
        name: 'Campeonato Matogrossense',
        country: 'Brasil',
        logo: 'https://wsrv.nl/?url=media.api-sports.io/football/leagues/630.png',
        type: 'League',
        season: 2027,
      },
    });

    // 2. Os 10 clubes oficiais da FMF para 2027
    const TEAMS_DEF = [
      { key: 'cuiaba', externalId: 1193, name: 'Cuiabá', code: 'CUI', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/1193.png' },
      { key: 'luverdense', externalId: 752, name: 'Luverdense', code: 'LUV', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/752.png' },
      { key: 'mixto', externalId: 2215, name: 'Mixto', code: 'MIX', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/2215.png' },
      { key: 'operario_vg', externalId: 9999, name: 'Operário-VG', code: 'OPV', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/9999.png' },
      { key: 'uniao', externalId: 7788, name: 'União Rondonópolis', code: 'UNI', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/7788.png' },
      { key: 'nova_mutum', externalId: 13130, name: 'Nova Mutum', code: 'NMU', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/13130.png' },
      { key: 'sport_sinop', externalId: 18273, name: 'Sport Sinop', code: 'SSI', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/18273.png' },
      { key: 'chapada', externalId: 26048, name: 'Chapada', code: 'CHA', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/26048.png' },
      { key: 'sinop', externalId: 2214, name: 'Sinop', code: 'SIN', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/2214.png' },
      { key: 'cacerense', externalId: 7808, name: 'Cacerense', code: 'CAC', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/7808.png' },
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

    // 3. Tabela zerada de classificação (Grupo Único, 10 clubes)
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

    if (this.redis) {
      try {
        await this.redis.delPattern('standings:*');
        this.logger.log('[MATOGROSSENSE-2027-SEEDER] Cache de standings invalidado no Redis.');
      } catch (err: any) {
        this.logger.warn(`[MATOGROSSENSE-2027-SEEDER] Erro ao limpar cache Redis: ${err.message}`);
      }
    }

    // 4. Verificar se os 45 jogos da 1ª Fase já existem
    const existingCount = await this.prisma.fixture.count({
      where: { leagueId: league.id, season: 2027 },
    });

    if (existingCount >= 45) {
      const msg = `Mato-Grossense 2027 já possui ${existingCount} partidas e 10 clubes na tabela. Nenhuma ação pendente.`;
      this.logger.log(`[MATOGROSSENSE-2027-SEEDER] ${msg}`);
      return { success: true, fixturesCount: existingCount, message: msg };
    }

    this.logger.log('[MATOGROSSENSE-2027-SEEDER] Populando 45 jogos oficiais da FMF 2027...');

    // 5. As 45 partidas oficiais da 1ª Fase (Turno Único) publicadas pela FMF
    const scheduleFMF = [
      // 1ª Rodada
      { ref: 1, rod: '1ª Rodada', data: '2027-01-10T21:00:00Z', home: 'sport_sinop', away: 'uniao', estadio: 'Gigante do Norte', cidade: 'Sinop' },
      { ref: 2, rod: '1ª Rodada', data: '2027-01-09T21:00:00Z', home: 'mixto', away: 'sinop', estadio: 'Dutrinha', cidade: 'Cuiabá' },
      { ref: 3, rod: '1ª Rodada', data: '2027-01-10T20:00:00Z', home: 'chapada', away: 'cacerense', estadio: 'Apolônio de Melo', cidade: 'Chapada dos Guimarães' },
      { ref: 4, rod: '1ª Rodada', data: '2027-01-09T20:30:00Z', home: 'nova_mutum', away: 'operario_vg', estadio: 'Waldir Doilho Wons', cidade: 'Nova Mutum' },
      { ref: 5, rod: '1ª Rodada', data: '2027-01-10T21:00:00Z', home: 'cuiaba', away: 'luverdense', estadio: 'Arena Pantanal', cidade: 'Cuiabá' },

      // 2ª Rodada
      { ref: 6, rod: '2ª Rodada', data: '2027-01-13T23:00:00Z', home: 'uniao', away: 'cuiaba', estadio: 'Luthero Lopes', cidade: 'Rondonópolis' },
      { ref: 7, rod: '2ª Rodada', data: '2027-01-14T23:00:00Z', home: 'operario_vg', away: 'sport_sinop', estadio: 'Dito Souza', cidade: 'Várzea Grande' },
      { ref: 8, rod: '2ª Rodada', data: '2027-01-13T23:00:00Z', home: 'luverdense', away: 'mixto', estadio: 'Passo das Emas', cidade: 'Lucas do Rio Verde' },
      { ref: 9, rod: '2ª Rodada', data: '2027-01-14T00:00:00Z', home: 'sinop', away: 'chapada', estadio: 'Gigante do Norte', cidade: 'Sinop' },
      { ref: 10, rod: '2ª Rodada', data: '2027-01-13T23:00:00Z', home: 'cacerense', away: 'nova_mutum', estadio: 'Geraldão', cidade: 'Cáceres' },

      // 3ª Rodada
      { ref: 11, rod: '3ª Rodada', data: '2027-01-17T21:00:00Z', home: 'mixto', away: 'uniao', estadio: 'Dutrinha', cidade: 'Cuiabá' },
      { ref: 12, rod: '3ª Rodada', data: '2027-01-17T21:00:00Z', home: 'cuiaba', away: 'nova_mutum', estadio: 'Arena Pantanal', cidade: 'Cuiabá' },
      { ref: 13, rod: '3ª Rodada', data: '2027-01-17T21:00:00Z', home: 'operario_vg', away: 'cacerense', estadio: 'Dito Souza', cidade: 'Várzea Grande' },
      { ref: 14, rod: '3ª Rodada', data: '2027-01-17T21:00:00Z', home: 'sinop', away: 'luverdense', estadio: 'Gigante do Norte', cidade: 'Sinop' },
      { ref: 15, rod: '3ª Rodada', data: '2027-01-17T21:00:00Z', home: 'chapada', away: 'sport_sinop', estadio: 'Apolônio de Melo', cidade: 'Chapada dos Guimarães' },

      // 4ª Rodada
      { ref: 16, rod: '4ª Rodada', data: '2027-01-20T23:00:00Z', home: 'sport_sinop', away: 'mixto', estadio: 'Gigante do Norte', cidade: 'Sinop' },
      { ref: 17, rod: '4ª Rodada', data: '2027-01-20T23:00:00Z', home: 'luverdense', away: 'operario_vg', estadio: 'Passo das Emas', cidade: 'Lucas do Rio Verde' },
      { ref: 18, rod: '4ª Rodada', data: '2027-01-20T23:00:00Z', home: 'uniao', away: 'sinop', estadio: 'Luthero Lopes', cidade: 'Rondonópolis' },
      { ref: 19, rod: '4ª Rodada', data: '2027-01-20T23:00:00Z', home: 'cacerense', away: 'cuiaba', estadio: 'Geraldão', cidade: 'Cáceres' },
      { ref: 20, rod: '4ª Rodada', data: '2027-01-20T23:00:00Z', home: 'nova_mutum', away: 'chapada', estadio: 'Waldir Doilho Wons', cidade: 'Nova Mutum' },

      // 5ª Rodada
      { ref: 21, rod: '5ª Rodada', data: '2027-01-24T21:00:00Z', home: 'operario_vg', away: 'cuiaba', estadio: 'Dito Souza', cidade: 'Várzea Grande' },
      { ref: 22, rod: '5ª Rodada', data: '2027-01-24T21:00:00Z', home: 'luverdense', away: 'cacerense', estadio: 'Passo das Emas', cidade: 'Lucas do Rio Verde' },
      { ref: 23, rod: '5ª Rodada', data: '2027-01-24T21:00:00Z', home: 'sport_sinop', away: 'sinop', estadio: 'Gigante do Norte', cidade: 'Sinop' },
      { ref: 24, rod: '5ª Rodada', data: '2027-01-24T21:00:00Z', home: 'chapada', away: 'uniao', estadio: 'Apolônio de Melo', cidade: 'Chapada dos Guimarães' },
      { ref: 25, rod: '5ª Rodada', data: '2027-01-24T21:00:00Z', home: 'mixto', away: 'nova_mutum', estadio: 'Dutrinha', cidade: 'Cuiabá' },

      // 6ª Rodada
      { ref: 26, rod: '6ª Rodada', data: '2027-01-31T21:00:00Z', home: 'uniao', away: 'luverdense', estadio: 'Luthero Lopes', cidade: 'Rondonópolis' },
      { ref: 27, rod: '6ª Rodada', data: '2027-01-31T21:00:00Z', home: 'cuiaba', away: 'chapada', estadio: 'Arena Pantanal', cidade: 'Cuiabá' },
      { ref: 28, rod: '6ª Rodada', data: '2027-01-31T21:00:00Z', home: 'cacerense', away: 'mixto', estadio: 'Geraldão', cidade: 'Cáceres' },
      { ref: 29, rod: '6ª Rodada', data: '2027-01-31T21:00:00Z', home: 'sinop', away: 'operario_vg', estadio: 'Gigante do Norte', cidade: 'Sinop' },
      { ref: 30, rod: '6ª Rodada', data: '2027-01-31T21:00:00Z', home: 'nova_mutum', away: 'sport_sinop', estadio: 'Waldir Doilho Wons', cidade: 'Nova Mutum' },

      // 7ª Rodada
      { ref: 31, rod: '7ª Rodada', data: '2027-02-07T21:00:00Z', home: 'mixto', away: 'chapada', estadio: 'Dutrinha', cidade: 'Cuiabá' },
      { ref: 32, rod: '7ª Rodada', data: '2027-02-07T21:00:00Z', home: 'cuiaba', away: 'sinop', estadio: 'Arena Pantanal', cidade: 'Cuiabá' },
      { ref: 33, rod: '7ª Rodada', data: '2027-02-07T21:00:00Z', home: 'operario_vg', away: 'uniao', estadio: 'Dito Souza', cidade: 'Várzea Grande' },
      { ref: 34, rod: '7ª Rodada', data: '2027-02-07T21:00:00Z', home: 'luverdense', away: 'nova_mutum', estadio: 'Passo das Emas', cidade: 'Lucas do Rio Verde' },
      { ref: 35, rod: '7ª Rodada', data: '2027-02-07T21:00:00Z', home: 'sport_sinop', away: 'cacerense', estadio: 'Gigante do Norte', cidade: 'Sinop' },

      // 8ª Rodada
      { ref: 36, rod: '8ª Rodada', data: '2027-02-14T21:00:00Z', home: 'mixto', away: 'operario_vg', estadio: 'Dutrinha', cidade: 'Cuiabá' },
      { ref: 37, rod: '8ª Rodada', data: '2027-02-14T21:00:00Z', home: 'sport_sinop', away: 'cuiaba', estadio: 'Gigante do Norte', cidade: 'Sinop' },
      { ref: 38, rod: '8ª Rodada', data: '2027-02-14T21:00:00Z', home: 'chapada', away: 'luverdense', estadio: 'Apolônio de Melo', cidade: 'Chapada dos Guimarães' },
      { ref: 39, rod: '8ª Rodada', data: '2027-02-14T21:00:00Z', home: 'nova_mutum', away: 'uniao', estadio: 'Waldir Doilho Wons', cidade: 'Nova Mutum' },
      { ref: 40, rod: '8ª Rodada', data: '2027-02-14T21:00:00Z', home: 'cacerense', away: 'sinop', estadio: 'Geraldão', cidade: 'Cáceres' },

      // 9ª Rodada
      { ref: 41, rod: '9ª Rodada', data: '2027-02-17T23:00:00Z', home: 'cuiaba', away: 'mixto', estadio: 'Arena Pantanal', cidade: 'Cuiabá' },
      { ref: 42, rod: '9ª Rodada', data: '2027-02-17T23:00:00Z', home: 'operario_vg', away: 'chapada', estadio: 'Dito Souza', cidade: 'Várzea Grande' },
      { ref: 43, rod: '9ª Rodada', data: '2027-02-17T23:00:00Z', home: 'luverdense', away: 'sport_sinop', estadio: 'Passo das Emas', cidade: 'Lucas do Rio Verde' },
      { ref: 44, rod: '9ª Rodada', data: '2027-02-17T23:00:00Z', home: 'uniao', away: 'cacerense', estadio: 'Luthero Lopes', cidade: 'Rondonópolis' },
      { ref: 45, rod: '9ª Rodada', data: '2027-02-17T23:00:00Z', home: 'sinop', away: 'nova_mutum', estadio: 'Gigante do Norte', cidade: 'Sinop' },
    ];

    let insertedFixtures = 0;
    for (const m of scheduleFMF) {
      const homeTeamId = teamDbMap.get(m.home);
      const awayTeamId = teamDbMap.get(m.away);
      const extId = 202763000 + m.ref;

      if (!homeTeamId || !awayTeamId) {
        this.logger.warn(`[MATOGROSSENSE-2027-SEEDER] Time não encontrado para jogo ${m.ref}: ${m.home} x ${m.away}`);
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
      } catch (_) {}
    }

    const successMsg = `Povoamento concluído: ${insertedFixtures} partidas e 10 clubes registrados para o Mato-Grossense 2027.`;
    this.logger.log(`[MATOGROSSENSE-2027-SEEDER] ${successMsg}`);
    return { success: true, fixturesCount: insertedFixtures, message: successMsg };
  }
}
