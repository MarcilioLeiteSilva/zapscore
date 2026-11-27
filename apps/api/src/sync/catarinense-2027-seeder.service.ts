import { Injectable, Logger, OnApplicationBootstrap, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class Catarinense2027SeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(Catarinense2027SeederService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly redis?: RedisService,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('[CATARINENSE-2027-SEEDER] Verificando integridade das partidas de 2027 no bootstrap...');
    try {
      await this.seedCatarinense2027();
    } catch (err: any) {
      this.logger.error(`[CATARINENSE-2027-SEEDER] Falha ao verificar/popular 2027: ${err.message}`, err.stack);
    }
  }

  async seedCatarinense2027(): Promise<{ success: boolean; fixturesCount: number; message: string }> {
    try {
      return await this._executeSeed();
    } catch (err: any) {
      this.logger.error(`[CATARINENSE-2027-SEEDER] ERRO FATAL: ${err.message}`, err.stack);
      return { success: false, fixturesCount: 0, message: `Erro: ${err.message}` };
    }
  }

  private async _executeSeed(): Promise<{ success: boolean; fixturesCount: number; message: string }> {
    // 1. Obter ou atualizar a liga Campeonato Catarinense (604)
    const league = await this.prisma.league.upsert({
      where: { externalId: 604 },
      update: {
        name: 'Campeonato Catarinense',
        country: 'Brasil',
        logo: 'https://wsrv.nl/?url=media.api-sports.io/football/leagues/604.png',
        season: 2027,
      },
      create: {
        externalId: 604,
        name: 'Campeonato Catarinense',
        country: 'Brasil',
        logo: 'https://wsrv.nl/?url=media.api-sports.io/football/leagues/604.png',
        type: 'League',
        season: 2027,
      },
    });

    // 2. Os 10 clubes oficiais da FCF Série A para 2027
    const TEAMS_DEF = [
      { key: 'avai', externalId: 145, name: 'Avaí', code: 'AVA', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/145.png' },
      { key: 'barra', externalId: 18271, name: 'Barra', code: 'BAR', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/18271.png' },
      { key: 'brusque', externalId: 1211, name: 'Brusque', code: 'BRU', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/1211.png' },
      { key: 'camboriu', externalId: 18272, name: 'Camboriú', code: 'CAM', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/18272.png' },
      { key: 'chapecoense', externalId: 132, name: 'Chapecoense', code: 'CHA', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/132.png' },
      { key: 'concordia', externalId: 12300, name: 'Concórdia', code: 'CON', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/12300.png' },
      { key: 'criciuma', externalId: 140, name: 'Criciúma', code: 'CRI', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/140.png' },
      { key: 'hercilio_luz', externalId: 7828, name: 'Hercílio Luz', code: 'HER', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/7828.png' },
      { key: 'marcilio_dias', externalId: 10677, name: 'Marcílio Dias', code: 'MDI', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/10677.png' },
      { key: 'santa_catarina', externalId: 21207, name: 'Santa Catarina', code: 'STC', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/21207.png' },
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

    // 3. Tabela zerada de classificação (Turno Único, 10 clubes)
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

    this.logger.log('[CATARINENSE-2027-SEEDER] Populando 45 jogos oficiais da FCF 2027...');

    // 4. As 45 partidas oficiais da 1ª Fase (Turno Único) publicadas pela FCF
    const scheduleFCF = [
      { ref: 1, rod: '1ª Rodada', data: '2027-01-09T19:00:00Z', home: 'santa_catarina', away: 'brusque', estadio: 'Alfredo João Krieck', cidade: 'Rio do Sul' },
      { ref: 2, rod: '1ª Rodada', data: '2027-01-09T20:00:00Z', home: 'camboriu', away: 'hercilio_luz', estadio: 'Orlando Scarpelli', cidade: 'Florianópolis' },
      { ref: 3, rod: '1ª Rodada', data: '2027-01-10T19:00:00Z', home: 'barra', away: 'avai', estadio: 'Arena Barra FC', cidade: 'Itajaí' },
      { ref: 4, rod: '1ª Rodada', data: '2027-01-10T21:00:00Z', home: 'criciuma', away: 'concordia', estadio: 'Heriberto Hülse', cidade: 'Criciúma' },
      { ref: 5, rod: '1ª Rodada', data: '2027-01-10T22:00:00Z', home: 'chapecoense', away: 'marcilio_dias', estadio: 'Arena Condá', cidade: 'Chapecó' },
      { ref: 6, rod: '2ª Rodada', data: '2027-01-13T22:00:00Z', home: 'hercilio_luz', away: 'barra', estadio: 'Aníbal Torres Costa', cidade: 'Tubarão' },
      { ref: 7, rod: '2ª Rodada', data: '2027-01-13T22:00:00Z', home: 'concordia', away: 'santa_catarina', estadio: 'Domingos Machado de Lima', cidade: 'Concórdia' },
      { ref: 8, rod: '2ª Rodada', data: '2027-01-13T23:00:00Z', home: 'avai', away: 'chapecoense', estadio: 'Dr. Aderbal Ramos da Silva', cidade: 'Florianópolis' },
      { ref: 9, rod: '2ª Rodada', data: '2027-01-14T22:30:00Z', home: 'brusque', away: 'criciuma', estadio: 'Arena Simon', cidade: 'Brusque' },
      { ref: 10, rod: '2ª Rodada', data: '2027-01-14T23:30:00Z', home: 'marcilio_dias', away: 'camboriu', estadio: 'Dr. Hercílio Luz', cidade: 'Itajaí' },
      { ref: 11, rod: '3ª Rodada', data: '2027-01-17T20:00:00Z', home: 'marcilio_dias', away: 'concordia', estadio: 'Dr. Hercílio Luz', cidade: 'Itajaí' },
      { ref: 12, rod: '3ª Rodada', data: '2027-01-17T20:00:00Z', home: 'chapecoense', away: 'brusque', estadio: 'Arena Condá', cidade: 'Chapecó' },
      { ref: 13, rod: '3ª Rodada', data: '2027-01-17T20:00:00Z', home: 'criciuma', away: 'santa_catarina', estadio: 'Heriberto Hülse', cidade: 'Criciúma' },
      { ref: 14, rod: '3ª Rodada', data: '2027-01-17T20:00:00Z', home: 'avai', away: 'hercilio_luz', estadio: 'Dr. Aderbal Ramos da Silva', cidade: 'Florianópolis' },
      { ref: 15, rod: '3ª Rodada', data: '2027-01-17T20:00:00Z', home: 'barra', away: 'camboriu', estadio: 'Arena Barra FC', cidade: 'Itajaí' },
      { ref: 16, rod: '4ª Rodada', data: '2027-01-20T23:00:00Z', home: 'concordia', away: 'avai', estadio: 'Domingos Machado de Lima', cidade: 'Concórdia' },
      { ref: 17, rod: '4ª Rodada', data: '2027-01-20T23:00:00Z', home: 'santa_catarina', away: 'barra', estadio: 'Alfredo João Krieck', cidade: 'Rio do Sul' },
      { ref: 18, rod: '4ª Rodada', data: '2027-01-20T23:00:00Z', home: 'brusque', away: 'marcilio_dias', estadio: 'Arena Simon', cidade: 'Brusque' },
      { ref: 19, rod: '4ª Rodada', data: '2027-01-20T23:00:00Z', home: 'camboriu', away: 'chapecoense', estadio: 'Orlando Scarpelli', cidade: 'Florianópolis' },
      { ref: 20, rod: '4ª Rodada', data: '2027-01-20T23:00:00Z', home: 'criciuma', away: 'hercilio_luz', estadio: 'Heriberto Hülse', cidade: 'Criciúma' },
      { ref: 21, rod: '5ª Rodada', data: '2027-01-24T20:00:00Z', home: 'hercilio_luz', away: 'brusque', estadio: 'Aníbal Torres Costa', cidade: 'Tubarão' },
      { ref: 22, rod: '5ª Rodada', data: '2027-01-24T20:00:00Z', home: 'chapecoense', away: 'criciuma', estadio: 'Arena Condá', cidade: 'Chapecó' },
      { ref: 23, rod: '5ª Rodada', data: '2027-01-24T20:00:00Z', home: 'avai', away: 'marcilio_dias', estadio: 'Dr. Aderbal Ramos da Silva', cidade: 'Florianópolis' },
      { ref: 24, rod: '5ª Rodada', data: '2027-01-24T20:00:00Z', home: 'barra', away: 'concordia', estadio: 'Arena Barra FC', cidade: 'Itajaí' },
      { ref: 25, rod: '5ª Rodada', data: '2027-01-24T20:00:00Z', home: 'camboriu', away: 'santa_catarina', estadio: 'Orlando Scarpelli', cidade: 'Florianópolis' },
      { ref: 26, rod: '6ª Rodada', data: '2027-01-31T20:00:00Z', home: 'concordia', away: 'hercilio_luz', estadio: 'Domingos Machado de Lima', cidade: 'Concórdia' },
      { ref: 27, rod: '6ª Rodada', data: '2027-01-31T20:00:00Z', home: 'criciuma', away: 'camboriu', estadio: 'Heriberto Hülse', cidade: 'Criciúma' },
      { ref: 28, rod: '6ª Rodada', data: '2027-01-31T20:00:00Z', home: 'avai', away: 'brusque', estadio: 'Dr. Aderbal Ramos da Silva', cidade: 'Florianópolis' },
      { ref: 29, rod: '6ª Rodada', data: '2027-01-31T20:00:00Z', home: 'marcilio_dias', away: 'santa_catarina', estadio: 'Dr. Hercílio Luz', cidade: 'Itajaí' },
      { ref: 30, rod: '6ª Rodada', data: '2027-01-31T20:00:00Z', home: 'chapecoense', away: 'barra', estadio: 'Arena Condá', cidade: 'Chapecó' },
      { ref: 31, rod: '7ª Rodada', data: '2027-02-06T20:00:00Z', home: 'hercilio_luz', away: 'marcilio_dias', estadio: 'Aníbal Torres Costa', cidade: 'Tubarão' },
      { ref: 32, rod: '7ª Rodada', data: '2027-02-06T20:00:00Z', home: 'barra', away: 'criciuma', estadio: 'Arena Barra FC', cidade: 'Itajaí' },
      { ref: 33, rod: '7ª Rodada', data: '2027-02-06T20:00:00Z', home: 'brusque', away: 'concordia', estadio: 'Arena Simon', cidade: 'Brusque' },
      { ref: 34, rod: '7ª Rodada', data: '2027-02-06T20:00:00Z', home: 'santa_catarina', away: 'chapecoense', estadio: 'Alfredo João Krieck', cidade: 'Rio do Sul' },
      { ref: 35, rod: '7ª Rodada', data: '2027-02-06T20:00:00Z', home: 'camboriu', away: 'avai', estadio: 'Orlando Scarpelli', cidade: 'Florianópolis' },
      { ref: 36, rod: '8ª Rodada', data: '2027-02-14T20:00:00Z', home: 'barra', away: 'marcilio_dias', estadio: 'Arena Barra FC', cidade: 'Itajaí' },
      { ref: 37, rod: '8ª Rodada', data: '2027-02-14T20:00:00Z', home: 'camboriu', away: 'brusque', estadio: 'Orlando Scarpelli', cidade: 'Florianópolis' },
      { ref: 38, rod: '8ª Rodada', data: '2027-02-14T20:00:00Z', home: 'chapecoense', away: 'concordia', estadio: 'Arena Condá', cidade: 'Chapecó' },
      { ref: 39, rod: '8ª Rodada', data: '2027-02-14T20:00:00Z', home: 'santa_catarina', away: 'hercilio_luz', estadio: 'Alfredo João Krieck', cidade: 'Rio do Sul' },
      { ref: 40, rod: '8ª Rodada', data: '2027-02-14T20:00:00Z', home: 'criciuma', away: 'avai', estadio: 'Heriberto Hülse', cidade: 'Criciúma' },
      { ref: 41, rod: '9ª Rodada', data: '2027-02-21T20:00:00Z', home: 'brusque', away: 'barra', estadio: 'Arena Simon', cidade: 'Brusque' },
      { ref: 42, rod: '9ª Rodada', data: '2027-02-21T20:00:00Z', home: 'concordia', away: 'camboriu', estadio: 'Domingos Machado de Lima', cidade: 'Concórdia' },
      { ref: 43, rod: '9ª Rodada', data: '2027-02-21T20:00:00Z', home: 'hercilio_luz', away: 'chapecoense', estadio: 'Aníbal Torres Costa', cidade: 'Tubarão' },
      { ref: 44, rod: '9ª Rodada', data: '2027-02-21T20:00:00Z', home: 'avai', away: 'santa_catarina', estadio: 'Dr. Aderbal Ramos da Silva', cidade: 'Florianópolis' },
      { ref: 45, rod: '9ª Rodada', data: '2027-02-21T20:00:00Z', home: 'marcilio_dias', away: 'criciuma', estadio: 'Dr. Hercílio Luz', cidade: 'Itajaí' },
    ];

    let insertedFixtures = 0;
    for (const m of scheduleFCF) {
      const homeTeamId = teamDbMap.get(m.home);
      const awayTeamId = teamDbMap.get(m.away);
      const extId = 202760400 + m.ref;

      if (!homeTeamId || !awayTeamId) {
        this.logger.warn(`[CATARINENSE-2027-SEEDER] Time não encontrado para jogo ${m.ref}: ${m.home} x ${m.away}`);
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

    const successMsg = `Povoamento concluído: ${insertedFixtures} partidas e 10 clubes registrados para o Catarinense 2027.`;
    this.logger.log(`[CATARINENSE-2027-SEEDER] ${successMsg}`);
    return { success: true, fixturesCount: insertedFixtures, message: successMsg };
  }
}
