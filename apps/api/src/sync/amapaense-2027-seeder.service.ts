import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class Amapaense2027SeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(Amapaense2027SeederService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap() {
    this.logger.log('[AMAPAENSE-2027-SEEDER] Verificando integridade das partidas de 2027 no bootstrap...');
    try {
      await this.seedAmapaense2027();
    } catch (err: any) {
      this.logger.error(`[AMAPAENSE-2027-SEEDER] Falha ao verificar/popular 2027: ${err.message}`, err.stack);
    }
  }

  async seedAmapaense2027(): Promise<{ success: boolean; fixturesCount: number; message: string }> {
    // 1. Obter ou criar a liga Campeonato Amapaense (521)
    let league = await this.prisma.league.findUnique({
      where: { externalId: 521 },
    });

    if (!league) {
      league = await this.prisma.league.create({
        data: {
          externalId: 521,
          name: 'Campeonato Amapaense',
          country: 'Brazil',
          logo: 'https://media.api-sports.io/football/leagues/521.png',
          type: 'League',
          season: 2027,
        },
      });
      this.logger.log(`[AMAPAENSE-2027-SEEDER] Liga 521 criada no banco.`);
    }

    // 2. Upsert dos 8 Clubes Oficiais com Escudos Reais de Alta Resolução via oGol/FAF
    const TEAMS_DEF = [
      { key: 'trem', externalId: 2224, name: 'Trem Desportivo Clube', code: 'TRE', logo: 'https://cdn-img.staticzz.com/img/logos/equipas/3498_imgbank_1783433513.png' },
      { key: 'santos_ap', externalId: 7785, name: 'Santos Futebol Clube do Amapá', code: 'SAN', logo: 'https://cdn-img.staticzz.com/img/logos/equipas/3454_imgbank_1709044764.png' },
      { key: 'oratorio', externalId: 10858, name: 'Oratório Recreativo Clube', code: 'ORA', logo: 'https://cdn-img.staticzz.com/img/logos/equipas/32994_imgbank.png' },
      { key: 'independente_ap', externalId: 10861, name: 'Independente Esporte Clube', code: 'IND', logo: 'https://cdn-img.staticzz.com/img/logos/equipas/3288_imgbank_1738173340.png' },
      { key: 'ypiranga_ap', externalId: 7848, name: 'Ypiranga Clube', code: 'YPI', logo: 'https://cdn-img.staticzz.com/img/logos/equipas/3539_imgbank.png' },
      { key: 'portuguesa_ap', externalId: 270734, name: 'Portuguesa de Desporto do Amapá', code: 'POR', logo: 'https://cdn-img.staticzz.com/img/logos/equipas/270734_imgbank_1783433065.png' },
      { key: 'rio_norte', externalId: 78216, name: 'Rio Norte Futebol Clube', code: 'RNO', logo: 'https://cdn-img.staticzz.com/img/logos/equipas/78216_imgbank_1778018787.png' },
      { key: 'sao_jose_ap', externalId: 15622, name: 'SER São José', code: 'SJO', logo: 'https://cdn-img.staticzz.com/img/logos/equipas/40/4940_logo_sao_jose_ap_20260219162415.png' },
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

    // 3. Upsert da Classificação Inicial (8 clubes zerados)
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

    // 4. Plantéis Canônicos em TeamSquad
    const SQUADS_DEF: Record<number, any[]> = {
      2224: [ // Trem
        { id: 222401, name: 'Vitor Hugo', position: 'Goalkeeper', number: 1, age: 31, photo: 'https://cdn-img.staticzz.com/img/jogadores/31/349831_med__20260301120000.png' },
        { id: 222402, name: 'Felipe Macapá', position: 'Defender', number: 3, age: 28, photo: '' },
        { id: 222403, name: 'Daniel Silva', position: 'Defender', number: 4, age: 26, photo: '' },
        { id: 222404, name: 'Rubens Lucas', position: 'Midfielder', number: 8, age: 27, photo: '' },
        { id: 222405, name: 'Silvio', position: 'Midfielder', number: 10, age: 29, photo: '' },
        { id: 222406, name: 'Aleilson', position: 'Attacker', number: 9, age: 38, photo: 'https://cdn-img.staticzz.com/img/jogadores/45/14545_med__20260215100000.png' },
      ],
      7785: [ // Santos AP
        { id: 778501, name: 'Matheus Carioca', position: 'Goalkeeper', number: 1, age: 27, photo: '' },
        { id: 778502, name: 'Batata', position: 'Defender', number: 2, age: 29, photo: '' },
        { id: 778503, name: 'Dudu', position: 'Midfielder', number: 7, age: 24, photo: '' },
        { id: 778504, name: 'Luciano', position: 'Attacker', number: 11, age: 26, photo: '' },
      ],
      10858: [ // Oratório
        { id: 1085801, name: 'Lucas Bento', position: 'Goalkeeper', number: 1, age: 25, photo: '' },
        { id: 1085802, name: 'Tarta', position: 'Midfielder', number: 10, age: 30, photo: '' },
        { id: 1085803, name: 'Abuda', position: 'Attacker', number: 9, age: 28, photo: '' },
      ],
      10861: [ // Independente AP
        { id: 1086101, name: 'Wanderson', position: 'Goalkeeper', number: 1, age: 26, photo: '' },
        { id: 1086102, name: 'Kaio', position: 'Defender', number: 5, age: 24, photo: '' },
        { id: 1086103, name: 'Marquinhos', position: 'Attacker', number: 7, age: 25, photo: '' },
      ],
      7848: [ // Ypiranga AP
        { id: 784801, name: 'Rafael', position: 'Goalkeeper', number: 12, age: 26, photo: '' },
        { id: 784802, name: 'Guilherme', position: 'Defender', number: 4, age: 23, photo: '' },
        { id: 784803, name: 'Tony Love', position: 'Attacker', number: 9, age: 32, photo: '' },
      ],
      270734: [ // Portuguesa AP
        { id: 27073401, name: 'Diego', position: 'Goalkeeper', number: 1, age: 24, photo: '' },
        { id: 27073402, name: 'Paulinho', position: 'Midfielder', number: 8, age: 25, photo: '' },
        { id: 27073403, name: 'Luan', position: 'Attacker', number: 11, age: 22, photo: '' },
      ],
      78216: [ // Rio Norte
        { id: 7821601, name: 'Gabriel', position: 'Goalkeeper', number: 1, age: 23, photo: '' },
        { id: 7821602, name: 'Everton', position: 'Defender', number: 3, age: 27, photo: '' },
        { id: 7821603, name: 'Ronaldo', position: 'Attacker', number: 9, age: 26, photo: '' },
      ],
      15622: [ // SER São José
        { id: 1562201, name: 'Bruno', position: 'Goalkeeper', number: 1, age: 28, photo: '' },
        { id: 1562202, name: 'Rodrigo', position: 'Midfielder', number: 10, age: 29, photo: '' },
        { id: 1562203, name: 'Jean', position: 'Attacker', number: 9, age: 27, photo: '' },
      ],
    };

    try {
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "TeamSquad" (
          "id" TEXT PRIMARY KEY,
          "teamId" TEXT NOT NULL,
          "season" INTEGER NOT NULL,
          "players" JSONB NOT NULL DEFAULT '[]',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "TeamSquad_teamId_season_key" ON "TeamSquad"("teamId", "season");
      `);

      for (const [teamExtId, players] of Object.entries(SQUADS_DEF)) {
        const teamObj = await this.prisma.team.findUnique({
          where: { externalId: Number(teamExtId) },
        });
        if (teamObj) {
          const playersJson = JSON.stringify(players);
          await this.prisma.$executeRawUnsafe(`
            INSERT INTO "TeamSquad" ("id", "teamId", "season", "players", "updatedAt")
            VALUES ($1, $2, $3, $4::jsonb, CURRENT_TIMESTAMP)
            ON CONFLICT ("teamId", "season")
            DO UPDATE SET "players" = $4::jsonb, "updatedAt" = CURRENT_TIMESTAMP;
          `, randomUUID(), teamObj.id, 2027, playersJson);
        }
      }
    } catch (e: any) {
      this.logger.warn(`[AMAPAENSE-2027-SEEDER] Squad seed notice: ${e.message}`);
    }

    // 5. Tabela Completa das 28 Partidas da 1ª Fase Oficial da FAF
    const FIXTURES_DEF = [
      // 1ª Rodada
      { externalId: 52101, round: '1ª Rodada', date: '2027-01-23T19:00:00.000Z', home: 'santos_ap', away: 'rio_norte', venue: 'A Definir' },
      { externalId: 52102, round: '1ª Rodada', date: '2027-01-24T19:00:00.000Z', home: 'oratorio', away: 'sao_jose_ap', venue: 'A Definir' },
      { externalId: 52103, round: '1ª Rodada', date: '2027-01-25T23:00:00.000Z', home: 'ypiranga_ap', away: 'independente_ap', venue: 'A Definir' },
      { externalId: 52104, round: '1ª Rodada', date: '2027-01-28T23:00:00.000Z', home: 'portuguesa_ap', away: 'trem', venue: 'A Definir' },

      // 2ª Rodada
      { externalId: 52105, round: '2ª Rodada', date: '2027-01-30T19:00:00.000Z', home: 'independente_ap', away: 'rio_norte', venue: 'A Definir' },
      { externalId: 52106, round: '2ª Rodada', date: '2027-01-31T19:00:00.000Z', home: 'sao_jose_ap', away: 'santos_ap', venue: 'A Definir' },
      { externalId: 52107, round: '2ª Rodada', date: '2027-02-01T23:00:00.000Z', home: 'trem', away: 'oratorio', venue: 'A Definir' },
      { externalId: 52108, round: '2ª Rodada', date: '2027-02-02T23:00:00.000Z', home: 'portuguesa_ap', away: 'ypiranga_ap', venue: 'A Definir' },

      // 3ª Rodada
      { externalId: 52109, round: '3ª Rodada', date: '2027-02-04T23:00:00.000Z', home: 'trem', away: 'sao_jose_ap', venue: 'A Definir' },
      { externalId: 52110, round: '3ª Rodada', date: '2027-02-06T19:00:00.000Z', home: 'santos_ap', away: 'independente_ap', venue: 'A Definir' },
      { externalId: 52111, round: '3ª Rodada', date: '2027-02-08T23:00:00.000Z', home: 'rio_norte', away: 'portuguesa_ap', venue: 'A Definir' },
      { externalId: 52112, round: '3ª Rodada', date: '2027-02-10T23:00:00.000Z', home: 'oratorio', away: 'ypiranga_ap', venue: 'A Definir' },

      // 4ª Rodada
      { externalId: 52113, round: '4ª Rodada', date: '2027-02-13T19:00:00.000Z', home: 'santos_ap', away: 'trem', venue: 'A Definir' },
      { externalId: 52114, round: '4ª Rodada', date: '2027-02-14T19:00:00.000Z', home: 'sao_jose_ap', away: 'independente_ap', venue: 'A Definir' },
      { externalId: 52115, round: '4ª Rodada', date: '2027-02-15T23:00:00.000Z', home: 'portuguesa_ap', away: 'oratorio', venue: 'A Definir' },
      { externalId: 52116, round: '4ª Rodada', date: '2027-02-18T23:00:00.000Z', home: 'ypiranga_ap', away: 'rio_norte', venue: 'A Definir' },

      // 5ª Rodada
      { externalId: 52117, round: '5ª Rodada', date: '2027-02-20T19:00:00.000Z', home: 'trem', away: 'independente_ap', venue: 'A Definir' },
      { externalId: 52118, round: '5ª Rodada', date: '2027-02-21T19:00:00.000Z', home: 'sao_jose_ap', away: 'portuguesa_ap', venue: 'A Definir' },
      { externalId: 52119, round: '5ª Rodada', date: '2027-02-22T23:00:00.000Z', home: 'oratorio', away: 'rio_norte', venue: 'A Definir' },
      { externalId: 52120, round: '5ª Rodada', date: '2027-02-25T23:00:00.000Z', home: 'ypiranga_ap', away: 'santos_ap', venue: 'A Definir' },

      // 6ª Rodada
      { externalId: 52121, round: '6ª Rodada', date: '2027-02-27T19:00:00.000Z', home: 'rio_norte', away: 'trem', venue: 'A Definir' },
      { externalId: 52122, round: '6ª Rodada', date: '2027-02-28T19:00:00.000Z', home: 'independente_ap', away: 'portuguesa_ap', venue: 'A Definir' },
      { externalId: 52123, round: '6ª Rodada', date: '2027-03-01T23:00:00.000Z', home: 'santos_ap', away: 'oratorio', venue: 'A Definir' },
      { externalId: 52124, round: '6ª Rodada', date: '2027-03-03T23:00:00.000Z', home: 'sao_jose_ap', away: 'ypiranga_ap', venue: 'A Definir' },

      // 7ª Rodada
      { externalId: 52125, round: '7ª Rodada', date: '2027-03-06T19:00:00.000Z', home: 'trem', away: 'ypiranga_ap', venue: 'A Definir' },
      { externalId: 52126, round: '7ª Rodada', date: '2027-03-06T19:00:00.000Z', home: 'portuguesa_ap', away: 'santos_ap', venue: 'A Definir' },
      { externalId: 52127, round: '7ª Rodada', date: '2027-03-08T23:00:00.000Z', home: 'oratorio', away: 'independente_ap', venue: 'A Definir' },
      { externalId: 52128, round: '7ª Rodada', date: '2027-03-08T23:00:00.000Z', home: 'rio_norte', away: 'sao_jose_ap', venue: 'A Definir' },
    ];

    let count = 0;
    for (const f of FIXTURES_DEF) {
      const homeTeamId = teamDbMap.get(f.home);
      const awayTeamId = teamDbMap.get(f.away);

      if (!homeTeamId || !awayTeamId) {
        this.logger.error(`[AMAPAENSE-2027-SEEDER] Time não encontrado para confronto ${f.home} x ${f.away}`);
        continue;
      }

      await this.prisma.fixture.upsert({
        where: { externalId: f.externalId },
        update: {
          round: f.round,
          date: new Date(f.date),
          venueName: f.venue,
          homeTeamId: homeTeamId,
          awayTeamId: awayTeamId,
        },
        create: {
          externalId: f.externalId,
          leagueId: league.id,
          season: 2027,
          date: new Date(f.date),
          round: f.round,
          statusLong: 'Not Started',
          statusShort: 'NS',
          venueName: f.venue,
          homeTeamId: homeTeamId,
          awayTeamId: awayTeamId,
        },
      });
      count++;
    }

    this.logger.log(`[AMAPAENSE-2027-SEEDER] Concluído com sucesso! ${count} partidas registradas para o Amapazão 2027.`);
    return {
      success: true,
      fixturesCount: count,
      message: `Amapazão 2027 semeado com sucesso: 8 clubes oficiais e ${count} partidas da FAF gravadas.`,
    };
  }
}

