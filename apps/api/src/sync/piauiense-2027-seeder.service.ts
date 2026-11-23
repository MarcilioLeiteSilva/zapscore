import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class Piauiense2027SeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(Piauiense2027SeederService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap() {
    this.logger.log('[PIAUIENSE-2027-SEEDER] Verificando integridade das partidas de 2027 no bootstrap...');
    try {
      await this.seedPiauiense2027();
    } catch (err: any) {
      this.logger.error(`[PIAUIENSE-2027-SEEDER] Falha ao verificar/popular 2027: ${err.message}`, err.stack);
    }
  }

  async seedPiauiense2027(): Promise<{ success: boolean; fixturesCount: number; message: string }> {
    // 1. Obter ou criar a liga Campeonato Piauiense (621)
    let league = await this.prisma.league.findUnique({
      where: { externalId: 621 },
    });

    if (!league) {
      league = await this.prisma.league.create({
        data: {
          externalId: 621,
          name: 'Campeonato Piauiense',
          country: 'Brazil',
          logo: 'https://media.api-sports.io/football/leagues/621.png',
          type: 'League',
          season: 2027,
        },
      });
      this.logger.log('[PIAUIENSE-2027-SEEDER] Liga 621 criada no banco.');
    }

    this.logger.log('[PIAUIENSE-2027-SEEDER] Atualizando 8 clubes oficiais da FFP 2027 com escudos transparentes...');

    // 2. Upsert dos 8 Clubes Oficiais com Escudos Oficiais FFP Transparentes
    const TEAMS_DEF = [
      { key: 'altos', externalId: 7820, name: 'Altos', code: 'ALT', logo: 'https://blogger.googleusercontent.com/img/a/AVvXsEgb2KOHUi1r4Sqw_lRQlKC4dPBk9sCOzPUx0UN-porMuEi420JrE9ZtRp3XVe-3jdFsgwufQT6X_JoS0YdBV-ISFfffWmJun-jHgcSRl7UVw9f1uo_9StT5bPHJ-rKtVSKDo_VT5-C8Rfx9raMWdMCIuwfNUbA6YrvChLFfMAuXYMRB81GykhHC1qGC8zU' },
      { key: 'atletico_pi', externalId: 65174, name: 'Atlético Piauiense', code: 'CAP', logo: 'https://blogger.googleusercontent.com/img/a/AVvXsEhGeJZNIdGGDGk2UFMQxgkrV7DwyTDFnKxXnkwKkU4yf_h1sP1Vwe7GHNMEPUAGc8i1O-mUvO8DYRsCr6XFgzh5qzgElRTAFNd0VV3W9jK8OA3Q2TKG4gxT10svjQhy2aP3vAn0Vq9IP7jurH9vzP_TYsyPnCNdlicstVoTHaQo3keLet3ex5ZkoCoeP38' },
      { key: 'flamengo_pi', externalId: 7828, name: 'Flamengo-PI', code: 'FLA', logo: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgLD5fB6-UoRllRdtRw1TTUEiLaR3pu_UCCnPoJ0zlS9l-ajU6ZvzM7pcvfxIJPNuhXtIslZWpA4PF3xiLJpsbGut6en3oP94-EIqrM7nsT9odSWwk2llDdgqje8096wTDW8nUT5_y1zOQ/s800/Esporte+Clube+Flamengo+-+Teresina-PI.png' },
      { key: 'fluminense_pi', externalId: 10425, name: 'Fluminense-PI', code: 'FLU', logo: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhXbC49YzlaqHi2gbDw8wheodB_qLTIE_p7kUoqZnkvUQ9fFRItLYnW8VHIsz3nk4XB-V7_TYQxDJDRxuhY-f9JovQaAcA5ojbRi9DcNWme7ove0ZOI9kBmK2f0TDLeIkIm2_epNs_eMek/s1600/1673118036155566-2.png' },
      { key: 'oeirense', externalId: 15624, name: 'Oeirense', code: 'OEI', logo: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgcLfbW5rFvoi_cUAQdQpeBgc68eQzX0YSJn5P57KtESmPENeJQeB-E6M0Kst7gkAccZsiYQSjdt2EnX8m2CZct6uh6Y7Pu06UC67sL4JIRrw2ReEWDiMDZlXjqjf5BomVDD-vfIgN7hYs/s783/Associa%25C3%25A7%25C3%25A3o+Atl%25C3%25A9tica+Oeirense+-+Oeiras-PI.png' },
      { key: 'piaui', externalId: 7827, name: 'Piauí', code: 'PIA', logo: 'https://blogger.googleusercontent.com/img/a/AVvXsEi_d7x_t-MYPtji62BVJpa1WHLC_44cbBdPzZepQW2FSyolip0JYGPXhtIU1SCA-iD5QlCFBTomiAd2AoOJzW0MoscD9BH2vYxXpyDyutFHaCFKIvgmmye9x2fMl2Bc5b8BfL2v08nEV27WNigeERiVaaw70VKEx6YXnQojztfpCwiE_qwP0e6slPPmd6w' },
      { key: 'river', externalId: 2218, name: 'River', code: 'RIV', logo: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh_vpyOcw4DHkGfnB9EtVFQUfSYAjw175mN9xLf7rTWN6h9Vaz3O_3_iDyXRCPY1PmqNH6oFd4YAeviT1ThyphenhyphenaI3GsKKJcx5Ok1sWJbCEFZVXAlufzvFrv-4H4uyF4_z1uVrw0wr6477U0w/s800/River+Atl%25C3%25A9tico+Clube+-+Teresina-PI.png' },
      { key: 'teresina', externalId: 54232, name: 'Teresina', code: 'TEC', logo: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEikT3HXKMGL-SJdcNAKTM5oUqozRLZ34Nr0hGlLdxFzITgjSLPuD6Zq3LMsIIo_9rTyrpQ9p4Rcf8FOWpE8f95xtCdO_bMNBNePXxbMPywZFfbdr88h5vzoZoxyOhizWOaL8z6Yd6TSgykgLIfJjoqnjBqHwWKkUxCuEW86YitKTMtnFj6s3VfFPaCSkEs/s1515/Teresina%20Esporte%20Clube%20de%20Teresina-PI.png' },
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

    // 3. Upsert da Classificação Inicial (8 clubes)
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

    // 4. Verificar se os 28 jogos já existem
    const existingCount = await this.prisma.fixture.count({
      where: { leagueId: league.id, season: 2027 },
    });

    if (existingCount >= 28) {
      const msg = `Piauiense 2027 clubes atualizados com sucesso e já possui ${existingCount} partidas cadastradas.`;
      this.logger.log(`[PIAUIENSE-2027-SEEDER] ${msg}`);
      return { success: true, fixturesCount: existingCount, message: msg };
    }

    // 5. As 28 Partidas Oficiais da Tabela FFP 2027 (1ª Fase - Turno Único)
    const MATCHES_SCHEDULE = [
      // 1ª Rodada
      { ref: 1, rod: '1ª Rodada', data: '2027-01-09T18:45:00Z', home: 'oeirense', away: 'river', estadio: 'Gerson Campos', cidade: 'Oeiras' },
      { ref: 2, rod: '1ª Rodada', data: '2027-01-09T19:00:00Z', home: 'piaui', away: 'teresina', estadio: 'Lindolfo Monteiro', cidade: 'Teresina' },
      { ref: 3, rod: '1ª Rodada', data: '2027-01-10T19:00:00Z', home: 'flamengo_pi', away: 'altos', estadio: 'Lindolfo Monteiro', cidade: 'Teresina' },
      { ref: 4, rod: '1ª Rodada', data: '2027-01-13T22:00:00Z', home: 'fluminense_pi', away: 'atletico_pi', estadio: 'Lindolfo Monteiro', cidade: 'Teresina' },

      // 2ª Rodada
      { ref: 5, rod: '2ª Rodada', data: '2027-01-16T18:45:00Z', home: 'oeirense', away: 'flamengo_pi', estadio: 'Gerson Campos', cidade: 'Oeiras' },
      { ref: 6, rod: '2ª Rodada', data: '2027-01-16T19:00:00Z', home: 'atletico_pi', away: 'piaui', estadio: 'Lindolfo Monteiro', cidade: 'Teresina' },
      { ref: 7, rod: '2ª Rodada', data: '2027-01-17T19:00:00Z', home: 'river', away: 'teresina', estadio: 'Lindolfo Monteiro', cidade: 'Teresina' },
      { ref: 8, rod: '2ª Rodada', data: '2027-01-20T22:00:00Z', home: 'fluminense_pi', away: 'altos', estadio: 'Lindolfo Monteiro', cidade: 'Teresina' },

      // 3ª Rodada
      { ref: 9, rod: '3ª Rodada', data: '2027-01-23T19:00:00Z', home: 'river', away: 'fluminense_pi', estadio: 'Lindolfo Monteiro', cidade: 'Teresina' },
      { ref: 10, rod: '3ª Rodada', data: '2027-01-24T19:00:00Z', home: 'piaui', away: 'flamengo_pi', estadio: 'Lindolfo Monteiro', cidade: 'Teresina' },
      { ref: 11, rod: '3ª Rodada', data: '2027-01-26T22:00:00Z', home: 'altos', away: 'oeirense', estadio: 'Lindolfo Monteiro', cidade: 'Teresina' },
      { ref: 12, rod: '3ª Rodada', data: '2027-01-27T22:00:00Z', home: 'teresina', away: 'atletico_pi', estadio: 'Lindolfo Monteiro', cidade: 'Teresina' },

      // 4ª Rodada
      { ref: 13, rod: '4ª Rodada', data: '2027-01-30T18:45:00Z', home: 'oeirense', away: 'fluminense_pi', estadio: 'Gerson Campos', cidade: 'Oeiras' },
      { ref: 14, rod: '4ª Rodada', data: '2027-01-30T19:00:00Z', home: 'atletico_pi', away: 'river', estadio: 'Lindolfo Monteiro', cidade: 'Teresina' },
      { ref: 15, rod: '4ª Rodada', data: '2027-01-31T19:00:00Z', home: 'flamengo_pi', away: 'teresina', estadio: 'Lindolfo Monteiro', cidade: 'Teresina' },
      { ref: 16, rod: '4ª Rodada', data: '2027-02-03T22:00:00Z', home: 'altos', away: 'piaui', estadio: 'Lindolfo Monteiro', cidade: 'Teresina' },

      // 5ª Rodada
      { ref: 17, rod: '5ª Rodada', data: '2027-02-06T18:45:00Z', home: 'oeirense', away: 'piaui', estadio: 'Gerson Campos', cidade: 'Oeiras' },
      { ref: 18, rod: '5ª Rodada', data: '2027-02-06T19:00:00Z', home: 'atletico_pi', away: 'altos', estadio: 'Lindolfo Monteiro', cidade: 'Teresina' },
      { ref: 19, rod: '5ª Rodada', data: '2027-02-10T22:00:00Z', home: 'flamengo_pi', away: 'river', estadio: 'Lindolfo Monteiro', cidade: 'Teresina' },
      { ref: 20, rod: '5ª Rodada', data: '2027-02-11T22:00:00Z', home: 'fluminense_pi', away: 'teresina', estadio: 'Lindolfo Monteiro', cidade: 'Teresina' },

      // 6ª Rodada
      { ref: 21, rod: '6ª Rodada', data: '2027-02-13T19:00:00Z', home: 'altos', away: 'river', estadio: 'Lindolfo Monteiro', cidade: 'Teresina' },
      { ref: 22, rod: '6ª Rodada', data: '2027-02-14T19:00:00Z', home: 'atletico_pi', away: 'flamengo_pi', estadio: 'Lindolfo Monteiro', cidade: 'Teresina' },
      { ref: 23, rod: '6ª Rodada', data: '2027-02-16T22:00:00Z', home: 'teresina', away: 'oeirense', estadio: 'Lindolfo Monteiro', cidade: 'Teresina' },
      { ref: 24, rod: '6ª Rodada', data: '2027-02-17T22:00:00Z', home: 'piaui', away: 'fluminense_pi', estadio: 'Lindolfo Monteiro', cidade: 'Teresina' },

      // 7ª Rodada
      { ref: 25, rod: '7ª Rodada', data: '2027-02-20T22:00:00Z', home: 'oeirense', away: 'atletico_pi', estadio: 'Gerson Campos', cidade: 'Oeiras' },
      { ref: 26, rod: '7ª Rodada', data: '2027-02-20T22:00:00Z', home: 'fluminense_pi', away: 'flamengo_pi', estadio: 'Lindolfo Monteiro', cidade: 'Teresina' },
      { ref: 27, rod: '7ª Rodada', data: '2027-02-20T22:00:00Z', home: 'river', away: 'piaui', estadio: 'Albertão', cidade: 'Teresina' },
      { ref: 28, rod: '7ª Rodada', data: '2027-02-20T22:00:00Z', home: 'teresina', away: 'altos', estadio: 'Lindolfo Monteiro', cidade: 'Teresina' },
    ];

    let insertedFixtures = 0;

    for (const m of MATCHES_SCHEDULE) {
      const extId = 202762100 + m.ref;
      const homeTeamId = teamDbMap.get(m.home);
      const awayTeamId = teamDbMap.get(m.away);

      if (!homeTeamId || !awayTeamId) {
        this.logger.warn(`[PIAUIENSE-2027-SEEDER] Time não encontrado para jogo ${m.ref}: ${m.home} x ${m.away}`);
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

    const successMsg = `Povoamento concluído: ${insertedFixtures} partidas e 8 clubes registrados para o Piauiense 2027.`;
    this.logger.log(`[PIAUIENSE-2027-SEEDER] ${successMsg}`);
    return { success: true, fixturesCount: insertedFixtures, message: successMsg };
  }
}
