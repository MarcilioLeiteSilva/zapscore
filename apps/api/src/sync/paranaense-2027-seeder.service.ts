import { Injectable, Logger, OnApplicationBootstrap, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class Paranaense2027SeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(Paranaense2027SeederService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly redis?: RedisService,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('[PARANAENSE-2027-SEEDER] Verificando integridade das partidas de 2027 no bootstrap...');
    try {
      await this.seedParanaense2027();
    } catch (err: any) {
      this.logger.error(`[PARANAENSE-2027-SEEDER] Falha ao verificar/popular 2027: ${err.message}`, err.stack);
    }
  }

  async seedParanaense2027(): Promise<{ success: boolean; fixturesCount: number; message: string }> {
    // 1. Obter ou criar a liga Campeonato Paranaense 1ª Divisão (606)
    const league = await this.prisma.league.upsert({
      where: { externalId: 606 },
      update: {
        name: 'Campeonato Paranaense - 1',
        country: 'Brasil',
        season: 2027,
      },
      create: {
        externalId: 606,
        name: 'Campeonato Paranaense - 1',
        country: 'Brasil',
        logo: 'https://media.api-sports.io/football/leagues/606.png',
        type: 'League',
        season: 2027,
      },
    });
    if (this.redis) {
      await this.redis.delPattern('leagues*');
    }
    this.logger.log('[PARANAENSE-2027-SEEDER] Liga 606 atualizada para Campeonato Paranaense / Brasil.');

    this.logger.log('[PARANAENSE-2027-SEEDER] Sincronizando 12 clubes oficiais e classificação...');

    // 2. Upsert dos 12 Clubes Oficiais (Grupo A e Grupo B — FPF 2027)
    const TEAMS_DEF = [
      // Grupo A
      { key: 'coritiba', externalId: 132, name: 'Coritiba', code: 'CFC', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/132.png' },
      { key: 'operario_pr', externalId: 1195, name: 'Operário-PR', code: 'OPE', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/1195.png' },
      { key: 'cascavel', externalId: 7857, name: 'FC Cascavel', code: 'CAS', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/7857.png' },
      { key: 'azuriz', externalId: 16104, name: 'Azuriz', code: 'AZU', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/16104.png' },
      { key: 'foz', externalId: 1188, name: 'Foz do Iguaçu', code: 'FOZ', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/1188.png' },
      { key: 'paranavai', externalId: 606012, name: 'Paranavaí', code: 'ACP', logo: 'https://wsrv.nl/?url=https%3A%2F%2Fthumb.wikimedia.org%2Fwikipedia%2Fcommons%2Fthumb%2F5%2F58%2FACParanava%25C3%25AD.svg%2F330px-ACParanava%25C3%25AD.svg.png' },
      // Grupo B
      { key: 'athletico_pr', externalId: 134, name: 'Athletico-PR', code: 'CAP', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/134.png' },
      { key: 'maringa', externalId: 1187, name: 'Maringá', code: 'MFC', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/1187.png' },
      { key: 'londrina', externalId: 144, name: 'Londrina', code: 'LEC', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/144.png' },
      { key: 'cianorte', externalId: 1186, name: 'Cianorte', code: 'CIA', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/1186.png' },
      { key: 'parana', externalId: 140, name: 'Paraná Clube', code: 'PAR', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/140.png' },
      { key: 'sao_joseense', externalId: 18342, name: 'São Joseense', code: 'SJE', logo: 'https://wsrv.nl/?url=media.api-sports.io/football/teams/18342.png' },
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
        this.logger.log('[PARANAENSE-2027-SEEDER] Cache de standings invalidado no Redis.');
      } catch (err: any) {
        this.logger.warn(`[PARANAENSE-2027-SEEDER] Erro ao limpar cache Redis: ${err.message}`);
      }
    }

    // 5. Verificar se os 36 jogos da 1ª Fase já existem
    const existingCount = await this.prisma.fixture.count({
      where: { leagueId: league.id, season: 2027 },
    });

    if (existingCount >= 36) {
      const msg = `Paranaense 2027 já possui ${existingCount} partidas e 12 clubes na tabela. Nenhuma ação pendente.`;
      this.logger.log(`[PARANAENSE-2027-SEEDER] ${msg}`);
      return { success: true, fixturesCount: existingCount, message: msg };
    }

    this.logger.log('[PARANAENSE-2027-SEEDER] Populando 36 jogos da FPF 2027...');

    // 6. As 36 Partidas Oficiais da Fase Classificatória FPF 2027 (6 Rodadas x 6 Jogos)
    const MATCHES_SCHEDULE = [
      // 1ª Rodada (Quarta-feira, 06/01/2027 às 20h00 BRT = 23h00 UTC)
      { ref: 1, rod: '1ª Rodada', data: '2027-01-06T23:00:00Z', home: 'coritiba', away: 'cianorte', estadio: 'Couto Pereira', cidade: 'Curitiba' },
      { ref: 2, rod: '1ª Rodada', data: '2027-01-06T23:00:00Z', home: 'operario_pr', away: 'maringa', estadio: 'Germano Kruger', cidade: 'Ponta Grossa' },
      { ref: 3, rod: '1ª Rodada', data: '2027-01-06T23:00:00Z', home: 'foz', away: 'londrina', estadio: 'Estádio ABC', cidade: 'Foz do Iguaçu' },
      { ref: 4, rod: '1ª Rodada', data: '2027-01-06T23:00:00Z', home: 'sao_joseense', away: 'cascavel', estadio: 'Estádio do Pinhão', cidade: 'São José dos Pinhais' },
      { ref: 5, rod: '1ª Rodada', data: '2027-01-06T23:00:00Z', home: 'parana', away: 'paranavai', estadio: 'Vila Capanema', cidade: 'Curitiba' },
      { ref: 6, rod: '1ª Rodada', data: '2027-01-06T23:00:00Z', home: 'athletico_pr', away: 'azuriz', estadio: 'Arena da Baixada', cidade: 'Curitiba' },

      // 2ª Rodada (Sábado, 09/01/2027 às 16h00 BRT = 19h00 UTC)
      { ref: 7, rod: '2ª Rodada', data: '2027-01-09T19:00:00Z', home: 'cascavel', away: 'cianorte', estadio: 'Estádio Olímpico', cidade: 'Cascavel' },
      { ref: 8, rod: '2ª Rodada', data: '2027-01-09T19:00:00Z', home: 'maringa', away: 'azuriz', estadio: 'Willie Davids', cidade: 'Maringá' },
      { ref: 9, rod: '2ª Rodada', data: '2027-01-09T19:00:00Z', home: 'londrina', away: 'coritiba', estadio: 'VGD', cidade: 'Londrina' },
      { ref: 10, rod: '2ª Rodada', data: '2027-01-09T19:00:00Z', home: 'parana', away: 'foz', estadio: 'Vila Capanema', cidade: 'Curitiba' },
      { ref: 11, rod: '2ª Rodada', data: '2027-01-09T19:00:00Z', home: 'sao_joseense', away: 'operario_pr', estadio: 'Estádio do Pinhão', cidade: 'São José dos Pinhais' },
      { ref: 12, rod: '2ª Rodada', data: '2027-01-09T19:00:00Z', home: 'athletico_pr', away: 'paranavai', estadio: 'Arena da Baixada', cidade: 'Curitiba' },

      // 3ª Rodada (Quarta-feira, 13/01/2027 às 20h00 BRT = 23h00 UTC)
      { ref: 13, rod: '3ª Rodada', data: '2027-01-13T23:00:00Z', home: 'coritiba', away: 'parana', estadio: 'Couto Pereira', cidade: 'Curitiba' },
      { ref: 14, rod: '3ª Rodada', data: '2027-01-13T23:00:00Z', home: 'paranavai', away: 'maringa', estadio: 'Waldemiro Wagner', cidade: 'Paranavaí' },
      { ref: 15, rod: '3ª Rodada', data: '2027-01-13T23:00:00Z', home: 'cianorte', away: 'operario_pr', estadio: 'Albino Turbay', cidade: 'Cianorte' },
      { ref: 16, rod: '3ª Rodada', data: '2027-01-13T23:00:00Z', home: 'londrina', away: 'cascavel', estadio: 'VGD', cidade: 'Londrina' },
      { ref: 17, rod: '3ª Rodada', data: '2027-01-13T23:00:00Z', home: 'foz', away: 'athletico_pr', estadio: 'Estádio ABC', cidade: 'Foz do Iguaçu' },
      { ref: 18, rod: '3ª Rodada', data: '2027-01-13T23:00:00Z', home: 'azuriz', away: 'sao_joseense', estadio: 'Os Pioneiros', cidade: 'Pato Branco' },

      // 4ª Rodada (Sábado, 16/01/2027 às 16h00 BRT = 19h00 UTC)
      { ref: 19, rod: '4ª Rodada', data: '2027-01-16T19:00:00Z', home: 'paranavai', away: 'sao_joseense', estadio: 'Waldemiro Wagner', cidade: 'Paranavaí' },
      { ref: 20, rod: '4ª Rodada', data: '2027-01-16T19:00:00Z', home: 'operario_pr', away: 'londrina', estadio: 'Germano Kruger', cidade: 'Ponta Grossa' },
      { ref: 21, rod: '4ª Rodada', data: '2027-01-16T19:00:00Z', home: 'cascavel', away: 'parana', estadio: 'Estádio Olímpico', cidade: 'Cascavel' },
      { ref: 22, rod: '4ª Rodada', data: '2027-01-16T19:00:00Z', home: 'athletico_pr', away: 'coritiba', estadio: 'Arena da Baixada', cidade: 'Curitiba' },
      { ref: 23, rod: '4ª Rodada', data: '2027-01-16T19:00:00Z', home: 'foz', away: 'maringa', estadio: 'Estádio ABC', cidade: 'Foz do Iguaçu' },
      { ref: 24, rod: '4ª Rodada', data: '2027-01-16T19:00:00Z', home: 'azuriz', away: 'cianorte', estadio: 'Os Pioneiros', cidade: 'Pato Branco' },

      // 5ª Rodada (Quarta-feira, 20/01/2027 às 20h00 BRT = 23h00 UTC)
      { ref: 25, rod: '5ª Rodada', data: '2027-01-20T23:00:00Z', home: 'parana', away: 'operario_pr', estadio: 'Vila Capanema', cidade: 'Curitiba' },
      { ref: 26, rod: '5ª Rodada', data: '2027-01-20T23:00:00Z', home: 'cascavel', away: 'athletico_pr', estadio: 'Estádio Olímpico', cidade: 'Cascavel' },
      { ref: 27, rod: '5ª Rodada', data: '2027-01-20T23:00:00Z', home: 'maringa', away: 'coritiba', estadio: 'Willie Davids', cidade: 'Maringá' },
      { ref: 28, rod: '5ª Rodada', data: '2027-01-20T23:00:00Z', home: 'sao_joseense', away: 'foz', estadio: 'Estádio do Pinhão', cidade: 'São José dos Pinhais' },
      { ref: 29, rod: '5ª Rodada', data: '2027-01-20T23:00:00Z', home: 'cianorte', away: 'paranavai', estadio: 'Albino Turbay', cidade: 'Cianorte' },
      { ref: 30, rod: '5ª Rodada', data: '2027-01-20T23:00:00Z', home: 'londrina', away: 'azuriz', estadio: 'VGD', cidade: 'Londrina' },

      // 6ª Rodada (Sábado, 23/01/2027 às 16h00 BRT = 19h00 UTC)
      { ref: 31, rod: '6ª Rodada', data: '2027-01-23T19:00:00Z', home: 'azuriz', away: 'parana', estadio: 'Os Pioneiros', cidade: 'Pato Branco' },
      { ref: 32, rod: '6ª Rodada', data: '2027-01-23T19:00:00Z', home: 'operario_pr', away: 'athletico_pr', estadio: 'Germano Kruger', cidade: 'Ponta Grossa' },
      { ref: 33, rod: '6ª Rodada', data: '2027-01-23T19:00:00Z', home: 'maringa', away: 'cascavel', estadio: 'Willie Davids', cidade: 'Maringá' },
      { ref: 34, rod: '6ª Rodada', data: '2027-01-23T19:00:00Z', home: 'coritiba', away: 'sao_joseense', estadio: 'Couto Pereira', cidade: 'Curitiba' },
      { ref: 35, rod: '6ª Rodada', data: '2027-01-23T19:00:00Z', home: 'cianorte', away: 'foz', estadio: 'Albino Turbay', cidade: 'Cianorte' },
      { ref: 36, rod: '6ª Rodada', data: '2027-01-23T19:00:00Z', home: 'paranavai', away: 'londrina', estadio: 'Waldemiro Wagner', cidade: 'Paranavaí' },
    ];

    let insertedFixtures = 0;

    for (const m of MATCHES_SCHEDULE) {
      const extId = 202760600 + m.ref;
      const homeTeamId = teamDbMap.get(m.home);
      const awayTeamId = teamDbMap.get(m.away);

      if (!homeTeamId || !awayTeamId) {
        this.logger.warn(`[PARANAENSE-2027-SEEDER] Time não encontrado para jogo ${m.ref}: ${m.home} x ${m.away}`);
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

    const successMsg = `Povoamento concluído: ${insertedFixtures} partidas e 12 clubes registrados para o Paranaense 2027.`;
    this.logger.log(`[PARANAENSE-2027-SEEDER] ${successMsg}`);
    return { success: true, fixturesCount: insertedFixtures, message: successMsg };
  }
}
