import { Injectable, Logger, OnApplicationBootstrap, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class Paraense2027SeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(Paraense2027SeederService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly redis?: RedisService,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('[PARAENSE-2027-SEEDER] Verificando integridade das partidas de 2027 no bootstrap...');
    try {
      await this.seedParaense2027();
    } catch (err: any) {
      this.logger.error(`[PARAENSE-2027-SEEDER] Falha ao verificar/popular 2027: ${err.message}`, err.stack);
    }
  }

  async seedParaense2027(): Promise<{ success: boolean; fixturesCount: number; message: string }> {
    // 1. Obter ou atualizar a liga Campeonato Paraense Série A1 (627)
    const league = await this.prisma.league.upsert({
      where: { externalId: 627 },
      update: {
        name: 'Campeonato Paraense',
        country: 'Brasil',
        logo: 'https://wsrv.nl/?url=media.api-sports.io/football/leagues/627.png',
        season: 2027,
      },
      create: {
        externalId: 627,
        name: 'Campeonato Paraense',
        country: 'Brasil',
        logo: 'https://wsrv.nl/?url=media.api-sports.io/football/leagues/627.png',
        type: 'League',
        season: 2027,
      },
    });

    if (this.redis) {
      await this.redis.delPattern('leagues*');
    }
    this.logger.log('[PARAENSE-2027-SEEDER] Liga 627 sincronizada (Campeonato Paraense / Brasil).');

    // 2. Upsert dos 12 Clubes Oficiais FPF-PA 2027 (Grupo A e Grupo B)
    const TEAMS_DEF = [
      // Grupo A
      { key: 'paysandu', externalId: 149, name: 'Paysandu', code: 'PAY', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/149.png' },
      { key: 'tuna_luso', externalId: 15611, name: 'Tuna Luso', code: 'TUN', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/15611.png' },
      { key: 'castanhal', externalId: 13124, name: 'Castanhal', code: 'CAS', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/13124.png' },
      { key: 'aguia', externalId: 7879, name: 'Águia de Marabá', code: 'AGU', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/7879.png' },
      { key: 'urumajo', externalId: 26078, name: 'Urumajó', code: 'URU', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/26078.png' },
      { key: 'sao_raimundo_pa', externalId: 2223, name: 'São Raimundo-PA', code: 'SRA', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/2223.png' },
      // Grupo B
      { key: 'remo', externalId: 1198, name: 'Remo', code: 'REM', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/1198.png' },
      { key: 'capitao_poco', externalId: 24999, name: 'Capitão Poço', code: 'CAP', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/24999.png' },
      { key: 'izabelense', externalId: 25000, name: 'Izabelense', code: 'IZA', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/25000.png' },
      { key: 'cameta', externalId: 20723, name: 'Cametá', code: 'CAM', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/20723.png' },
      { key: 'santa_rosa', externalId: 22873, name: 'Santa Rosa', code: 'SRO', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/22873.png' },
      { key: 'amazonia', externalId: 18376, name: 'Amazônia Independente', code: 'AMA', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/18376.png' },
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

    // 3. Upsert da Classificação Inicial (12 clubes zerados)
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

    // 4. Invalida cache de standings no Redis se disponível
    if (this.redis) {
      try {
        await this.redis.delPattern('standings:*');
        this.logger.log('[PARAENSE-2027-SEEDER] Cache de standings invalidado no Redis.');
      } catch (err: any) {
        this.logger.warn(`[PARAENSE-2027-SEEDER] Erro ao limpar cache Redis: ${err.message}`);
      }
    }

    // 5. Verificar se os 36 jogos da 1ª Fase já existem
    const existingCount = await this.prisma.fixture.count({
      where: { leagueId: league.id, season: 2027 },
    });

    if (existingCount >= 36) {
      const msg = `Paraense 2027 já possui ${existingCount} partidas e 12 clubes na tabela. Nenhuma ação pendente.`;
      this.logger.log(`[PARAENSE-2027-SEEDER] ${msg}`);
      return { success: true, fixturesCount: existingCount, message: msg };
    }

    this.logger.log('[PARAENSE-2027-SEEDER] Populando 36 jogos oficiais da FPF-PA 2027...');

    // 6. As 36 Partidas Oficiais da 1ª Fase FPF-PA 2027 (6 Rodadas x 6 Jogos Intergrupos A x B)
    const MATCHES_SCHEDULE = [
      // 1ª Rodada (09/01 e 10/01/2027 - Horário de Belém UTC-3)
      { ref: 1, rod: '1ª Rodada', data: '2027-01-10T20:00:00Z', home: 'paysandu', away: 'capitao_poco', estadio: 'Mangueirão', cidade: 'Belém' },
      { ref: 2, rod: '1ª Rodada', data: '2027-01-10T19:00:00Z', home: 'amazonia', away: 'tuna_luso', estadio: 'A Definir', cidade: 'Belterra ou Santarém' },
      { ref: 3, rod: '1ª Rodada', data: '2027-01-10T20:00:00Z', home: 'cameta', away: 'castanhal', estadio: 'Parque do Bacurau', cidade: 'Cametá' },
      { ref: 4, rod: '1ª Rodada', data: '2027-01-10T13:00:00Z', home: 'santa_rosa', away: 'aguia', estadio: 'Diogão', cidade: 'Bragança' },
      { ref: 5, rod: '1ª Rodada', data: '2027-01-09T18:30:00Z', home: 'izabelense', away: 'urumajo', estadio: 'Modelão', cidade: 'Castanhal' },
      { ref: 6, rod: '1ª Rodada', data: '2027-01-09T21:00:00Z', home: 'remo', away: 'sao_raimundo_pa', estadio: 'Mangueirão', cidade: 'Belém' },

      // 2ª Rodada (16/01 e 17/01/2027)
      { ref: 7, rod: '2ª Rodada', data: '2027-01-17T20:00:00Z', home: 'remo', away: 'paysandu', estadio: 'Mangueirão', cidade: 'Belém' },
      { ref: 8, rod: '2ª Rodada', data: '2027-01-17T13:00:00Z', home: 'tuna_luso', away: 'santa_rosa', estadio: 'Souza', cidade: 'Belém' },
      { ref: 9, rod: '2ª Rodada', data: '2027-01-16T22:00:00Z', home: 'castanhal', away: 'amazonia', estadio: 'Modelão', cidade: 'Castanhal' },
      { ref: 10, rod: '2ª Rodada', data: '2027-01-16T21:00:00Z', home: 'aguia', away: 'izabelense', estadio: 'Zinho Oliveira', cidade: 'Marabá' },
      { ref: 11, rod: '2ª Rodada', data: '2027-01-16T18:30:00Z', home: 'urumajo', away: 'cameta', estadio: 'Estrelão', cidade: 'Augusto Corrêa' },
      { ref: 12, rod: '2ª Rodada', data: '2027-01-16T19:00:00Z', home: 'sao_raimundo_pa', away: 'capitao_poco', estadio: 'Panterão', cidade: 'Santarém' },

      // 3ª Rodada (20/01 e 21/01/2027)
      { ref: 13, rod: '3ª Rodada', data: '2027-01-21T23:00:00Z', home: 'cameta', away: 'paysandu', estadio: 'Parque do Bacurau', cidade: 'Cametá' },
      { ref: 14, rod: '3ª Rodada', data: '2027-01-20T13:00:00Z', home: 'capitao_poco', away: 'tuna_luso', estadio: 'Rufinão', cidade: 'Capitão Poço' },
      { ref: 15, rod: '3ª Rodada', data: '2027-01-20T18:30:00Z', home: 'santa_rosa', away: 'castanhal', estadio: 'Diogão', cidade: 'Bragança' },
      { ref: 16, rod: '3ª Rodada', data: '2027-01-20T19:00:00Z', home: 'amazonia', away: 'aguia', estadio: 'A Definir', cidade: 'Belterra ou Santarém' },
      { ref: 17, rod: '3ª Rodada', data: '2027-01-20T18:30:00Z', home: 'urumajo', away: 'remo', estadio: 'Estrelão', cidade: 'Augusto Corrêa' },
      { ref: 18, rod: '3ª Rodada', data: '2027-01-20T21:00:00Z', home: 'izabelense', away: 'sao_raimundo_pa', estadio: 'Modelão', cidade: 'Castanhal' },

      // 4ª Rodada (23/01 e 24/01/2027)
      { ref: 19, rod: '4ª Rodada', data: '2027-01-24T20:00:00Z', home: 'paysandu', away: 'izabelense', estadio: 'Mangueirão', cidade: 'Belém' },
      { ref: 20, rod: '4ª Rodada', data: '2027-01-24T13:00:00Z', home: 'tuna_luso', away: 'remo', estadio: 'Souza', cidade: 'Belém' },
      { ref: 21, rod: '4ª Rodada', data: '2027-01-24T22:00:00Z', home: 'castanhal', away: 'capitao_poco', estadio: 'Modelão', cidade: 'Castanhal' },
      { ref: 22, rod: '4ª Rodada', data: '2027-01-24T20:00:00Z', home: 'aguia', away: 'cameta', estadio: 'Zinho Oliveira', cidade: 'Marabá' },
      { ref: 23, rod: '4ª Rodada', data: '2027-01-23T19:00:00Z', home: 'amazonia', away: 'urumajo', estadio: 'A Definir', cidade: 'Belterra ou Santarém' },
      { ref: 24, rod: '4ª Rodada', data: '2027-01-24T19:00:00Z', home: 'sao_raimundo_pa', away: 'santa_rosa', estadio: 'Panterão', cidade: 'Santarém' },

      // 5ª Rodada (29/01, 30/01 e 31/01/2027)
      { ref: 25, rod: '5ª Rodada', data: '2027-01-29T23:00:00Z', home: 'paysandu', away: 'amazonia', estadio: 'Mangueirão', cidade: 'Belém' },
      { ref: 26, rod: '5ª Rodada', data: '2027-01-30T19:00:00Z', home: 'izabelense', away: 'tuna_luso', estadio: 'Modelão', cidade: 'Castanhal' },
      { ref: 27, rod: '5ª Rodada', data: '2027-01-30T21:00:00Z', home: 'remo', away: 'castanhal', estadio: 'Mangueirão', cidade: 'Belém' },
      { ref: 28, rod: '5ª Rodada', data: '2027-01-31T13:00:00Z', home: 'capitao_poco', away: 'aguia', estadio: 'Rufinão', cidade: 'Capitão Poço' },
      { ref: 29, rod: '5ª Rodada', data: '2027-01-30T18:30:00Z', home: 'urumajo', away: 'santa_rosa', estadio: 'Estrelão', cidade: 'Augusto Corrêa' },
      { ref: 30, rod: '5ª Rodada', data: '2027-01-31T20:00:00Z', home: 'cameta', away: 'sao_raimundo_pa', estadio: 'Parque do Bacurau', cidade: 'Cametá' },

      // 6ª Rodada (14/02/2027 às 15h30 BRT = 18h30 UTC)
      { ref: 31, rod: '6ª Rodada', data: '2027-02-14T18:30:00Z', home: 'santa_rosa', away: 'paysandu', estadio: 'Diogão', cidade: 'Bragança' },
      { ref: 32, rod: '6ª Rodada', data: '2027-02-14T18:30:00Z', home: 'tuna_luso', away: 'cameta', estadio: 'Souza', cidade: 'Belém' },
      { ref: 33, rod: '6ª Rodada', data: '2027-02-14T18:30:00Z', home: 'castanhal', away: 'izabelense', estadio: 'Modelão', cidade: 'Castanhal' },
      { ref: 34, rod: '6ª Rodada', data: '2027-02-14T18:30:00Z', home: 'aguia', away: 'remo', estadio: 'Zinho Oliveira', cidade: 'Marabá' },
      { ref: 35, rod: '6ª Rodada', data: '2027-02-14T18:30:00Z', home: 'capitao_poco', away: 'urumajo', estadio: 'Rufinão', cidade: 'Capitão Poço' },
      { ref: 36, rod: '6ª Rodada', data: '2027-02-14T18:30:00Z', home: 'sao_raimundo_pa', away: 'amazonia', estadio: 'Panterão', cidade: 'Santarém' },
    ];

    let insertedFixtures = 0;

    for (const m of MATCHES_SCHEDULE) {
      const extId = 202762700 + m.ref;
      const homeTeamId = teamDbMap.get(m.home);
      const awayTeamId = teamDbMap.get(m.away);

      if (!homeTeamId || !awayTeamId) {
        this.logger.warn(`[PARAENSE-2027-SEEDER] Time não encontrado para jogo ${m.ref}: ${m.home} x ${m.away}`);
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

    const successMsg = `Povoamento concluído: ${insertedFixtures} partidas e 12 clubes registrados para o Paraense 2027.`;
    this.logger.log(`[PARAENSE-2027-SEEDER] ${successMsg}`);
    return { success: true, fixturesCount: insertedFixtures, message: successMsg };
  }
}
