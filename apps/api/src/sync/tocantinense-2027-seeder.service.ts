import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class Tocantinense2027SeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(Tocantinense2027SeederService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap() {
    this.logger.log('[TOCANTINENSE-2027-SEEDER] Verificando integridade das partidas de 2027 no bootstrap...');
    try {
      await this.seedTocantinense2027();
    } catch (err: any) {
      this.logger.error(`[TOCANTINENSE-2027-SEEDER] Falha ao verificar/popular 2027: ${err.message}`, err.stack);
    }
  }

  async seedTocantinense2027(): Promise<{ success: boolean; fixturesCount: number; message: string }> {
    // 1. Obter ou criar a liga Campeonato Tocantinense (631)
    let league = await this.prisma.league.findUnique({
      where: { externalId: 631 },
    });

    if (!league) {
      league = await this.prisma.league.create({
        data: {
          externalId: 631,
          name: 'Campeonato Tocantinense',
          country: 'Brazil',
          logo: 'https://media.api-sports.io/football/leagues/631.png',
          type: 'League',
          season: 2027,
        },
      });
      this.logger.log(`[TOCANTINENSE-2027-SEEDER] Liga 631 criada no banco.`);
    }

    // 2. Upsert dos 8 Clubes Oficiais com Escudos Reais de Alta Resolução via oGol/FTF
    const TEAMS_DEF = [
      { key: 'araguaina', externalId: 7806, name: 'Araguaína FR', code: 'ARA', logo: 'https://cdn-img.staticzz.com/img/logos/equipas/3112_imgbank_1720088924.png' },
      { key: 'batalhao', externalId: 21977, name: 'Batalhão FC', code: 'BAT', logo: 'https://cdn-img.staticzz.com/img/logos/equipas/222466_imgbank_1720088805.png' },
      { key: 'bela_vista', externalId: 19139, name: 'Bela Vista FC', code: 'BVI', logo: 'https://cdn-img.staticzz.com/img/logos/equipas/267801_imgbank.png' },
      { key: 'capital', externalId: 7807, name: 'Capital FC', code: 'CAP', logo: 'https://cdn-img.staticzz.com/img/logos/equipas/85267_imgbank_1772736182.jpg' },
      { key: 'guarai', externalId: 7808, name: 'Guaraí EC', code: 'GUA', logo: 'https://cdn-img.staticzz.com/img/logos/equipas/81/34981_logo_guarai_20260219164753.png' },
      { key: 'gurupi', externalId: 7809, name: 'Gurupi EC', code: 'GUR', logo: 'https://cdn-img.staticzz.com/img/logos/equipas/3282_imgbank_1675770002.png' },
      { key: 'tocantinopolis', externalId: 7810, name: 'Tocantinópolis EC', code: 'TEC', logo: 'https://cdn-img.staticzz.com/img/logos/equipas/3494_imgbank_1683708367.png' },
      { key: 'uniao', externalId: 16401, name: 'União Atlético Carmolandense', code: 'UAC', logo: 'https://cdn-img.staticzz.com/img/logos/equipas/276477_imgbank_1675770299.png' },
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

    // 4. Plantéis Canônicos em TeamSquad (para alimentar listagem de jogadores e fotos)
    const SQUADS_DEF: Record<number, any[]> = {
      7810: [
        { id: 781001, name: 'Johnathan', number: 1, position: 'Goalkeeper', age: 31, photo: null },
        { id: 781002, name: 'Anderson', number: 12, position: 'Goalkeeper', age: 26, photo: null },
        { id: 781003, name: 'Paulinho', number: 2, position: 'Defender', age: 29, photo: null },
        { id: 781004, name: 'Da Silva', number: 3, position: 'Defender', age: 27, photo: null },
        { id: 781005, name: 'Pedro Afonso', number: 4, position: 'Defender', age: 25, photo: null },
        { id: 781006, name: 'Robinho', number: 6, position: 'Defender', age: 28, photo: null },
        { id: 781007, name: 'Marcinho', number: 13, position: 'Defender', age: 24, photo: null },
        { id: 781008, name: 'Bideli', number: 5, position: 'Midfielder', age: 30, photo: null },
        { id: 781009, name: 'Gustavo Gomes', number: 8, position: 'Midfielder', age: 26, photo: null },
        { id: 781010, name: 'Gabriel Caju', number: 10, position: 'Midfielder', age: 27, photo: null },
        { id: 781011, name: 'Hiltinho', number: 15, position: 'Midfielder', age: 29, photo: null },
        { id: 781012, name: 'Daniel Cruz', number: 18, position: 'Midfielder', age: 23, photo: null },
        { id: 781013, name: 'William', number: 9, position: 'Attacker', age: 32, photo: null },
        { id: 781014, name: 'Bilau', number: 7, position: 'Attacker', age: 28, photo: null },
        { id: 781015, name: 'Joel', number: 11, position: 'Attacker', age: 26, photo: null },
        { id: 781016, name: 'Everson', number: 19, position: 'Attacker', age: 24, photo: null },
      ],
      7807: [
        { id: 780701, name: 'Guilherme', number: 1, position: 'Goalkeeper', age: 28, photo: null },
        { id: 780702, name: 'Prezzi', number: 12, position: 'Goalkeeper', age: 25, photo: null },
        { id: 780703, name: 'Patryck Annes', number: 2, position: 'Defender', age: 27, photo: null },
        { id: 780704, name: 'Washington', number: 3, position: 'Defender', age: 30, photo: null },
        { id: 780705, name: 'Leozão', number: 4, position: 'Defender', age: 29, photo: null },
        { id: 780706, name: 'Giancarlo', number: 6, position: 'Defender', age: 26, photo: null },
        { id: 780707, name: 'Arthur', number: 5, position: 'Midfielder', age: 25, photo: null },
        { id: 780708, name: 'Romário', number: 8, position: 'Midfielder', age: 27, photo: null },
        { id: 780709, name: 'Zé Elias', number: 10, position: 'Midfielder', age: 28, photo: null },
        { id: 780710, name: 'Theo', number: 16, position: 'Midfielder', age: 22, photo: null },
        { id: 780711, name: 'Weslley', number: 9, position: 'Attacker', age: 27, photo: null },
        { id: 780712, name: 'Juninho', number: 11, position: 'Attacker', age: 24, photo: null },
        { id: 780713, name: 'Kariri', number: 7, position: 'Attacker', age: 29, photo: null },
        { id: 780714, name: 'Mailson', number: 17, position: 'Attacker', age: 26, photo: null },
      ],
      7806: [
        { id: 780601, name: 'Mateus', number: 1, position: 'Goalkeeper', age: 27, photo: null },
        { id: 780602, name: 'Felipe', number: 12, position: 'Goalkeeper', age: 24, photo: null },
        { id: 780603, name: 'Renan', number: 2, position: 'Defender', age: 26, photo: null },
        { id: 780604, name: 'Dedé', number: 3, position: 'Defender', age: 31, photo: null },
        { id: 780605, name: 'Wanderson', number: 4, position: 'Defender', age: 28, photo: null },
        { id: 780606, name: 'Bruno', number: 6, position: 'Defender', age: 25, photo: null },
        { id: 780607, name: 'Paulo Roberto', number: 5, position: 'Midfielder', age: 29, photo: null },
        { id: 780608, name: 'Renatinho', number: 8, position: 'Midfielder', age: 27, photo: null },
        { id: 780609, name: 'Igor Pato', number: 10, position: 'Midfielder', age: 26, photo: null },
        { id: 780610, name: 'Juninho Araguaína', number: 15, position: 'Midfielder', age: 23, photo: null },
        { id: 780611, name: 'Maranhão', number: 9, position: 'Attacker', age: 30, photo: null },
        { id: 780612, name: 'Henrique', number: 11, position: 'Attacker', age: 25, photo: null },
        { id: 780613, name: 'Dieguinho', number: 7, position: 'Attacker', age: 28, photo: null },
      ],
      16401: [
        { id: 1640101, name: 'Luiz Daniel', number: 1, position: 'Goalkeeper', age: 30, photo: null },
        { id: 1640102, name: 'Igor', number: 12, position: 'Goalkeeper', age: 23, photo: null },
        { id: 1640103, name: 'Jean', number: 2, position: 'Defender', age: 28, photo: null },
        { id: 1640104, name: 'Vitão', number: 3, position: 'Defender', age: 29, photo: null },
        { id: 1640105, name: 'Bruno Morais', number: 4, position: 'Defender', age: 27, photo: null },
        { id: 1640106, name: 'Rafael', number: 6, position: 'Defender', age: 26, photo: null },
        { id: 1640107, name: 'Alê', number: 5, position: 'Midfielder', age: 28, photo: null },
        { id: 1640108, name: 'Sandro', number: 8, position: 'Midfielder', age: 30, photo: null },
        { id: 1640109, name: 'Erick', number: 10, position: 'Midfielder', age: 25, photo: null },
        { id: 1640110, name: 'Frank', number: 16, position: 'Midfielder', age: 24, photo: null },
        { id: 1640111, name: 'Arnaldo', number: 9, position: 'Attacker', age: 29, photo: null },
        { id: 1640112, name: 'Luan', number: 11, position: 'Attacker', age: 26, photo: null },
        { id: 1640113, name: 'Gabriel Maranhão', number: 7, position: 'Attacker', age: 25, photo: null },
      ],
      7809: [
        { id: 780901, name: 'Matheus Santos', number: 1, position: 'Goalkeeper', age: 28, photo: null },
        { id: 780902, name: 'Rafael', number: 12, position: 'Goalkeeper', age: 24, photo: null },
        { id: 780903, name: 'Gilberto', number: 2, position: 'Defender', age: 27, photo: null },
        { id: 780904, name: 'Vinicius', number: 3, position: 'Defender', age: 26, photo: null },
        { id: 780905, name: 'Daniel', number: 4, position: 'Defender', age: 29, photo: null },
        { id: 780906, name: 'Caio', number: 6, position: 'Defender', age: 25, photo: null },
        { id: 780907, name: 'João Pedro', number: 5, position: 'Midfielder', age: 24, photo: null },
        { id: 780908, name: 'Felipe Silva', number: 8, position: 'Midfielder', age: 27, photo: null },
        { id: 780909, name: 'Wellington', number: 10, position: 'Midfielder', age: 28, photo: null },
        { id: 780910, name: 'Lucas', number: 14, position: 'Midfielder', age: 23, photo: null },
        { id: 780911, name: 'Bruno Recife', number: 9, position: 'Attacker', age: 31, photo: null },
        { id: 780912, name: 'Tozim', number: 11, position: 'Attacker', age: 33, photo: null },
        { id: 780913, name: 'Romário', number: 7, position: 'Attacker', age: 26, photo: null },
      ],
      7808: [
        { id: 780801, name: 'Dida', number: 1, position: 'Goalkeeper', age: 29, photo: null },
        { id: 780802, name: 'Marcelo', number: 12, position: 'Goalkeeper', age: 23, photo: null },
        { id: 780803, name: 'Alan', number: 2, position: 'Defender', age: 26, photo: null },
        { id: 780804, name: 'Rodrigo', number: 3, position: 'Defender', age: 28, photo: null },
        { id: 780805, name: 'Tiago', number: 4, position: 'Defender', age: 27, photo: null },
        { id: 780806, name: 'Cleiton', number: 6, position: 'Defender', age: 25, photo: null },
        { id: 780807, name: 'Paulinho', number: 5, position: 'Midfielder', age: 28, photo: null },
        { id: 780808, name: 'Gean', number: 8, position: 'Midfielder', age: 26, photo: null },
        { id: 780809, name: 'Marquinhos', number: 10, position: 'Midfielder', age: 27, photo: null },
        { id: 780810, name: 'Denis', number: 15, position: 'Midfielder', age: 24, photo: null },
        { id: 780811, name: 'Pedro Júnior', number: 9, position: 'Attacker', age: 30, photo: null },
        { id: 780812, name: 'Tallyson', number: 11, position: 'Attacker', age: 25, photo: null },
        { id: 780813, name: 'Dudu', number: 7, position: 'Attacker', age: 24, photo: null },
      ],
      19139: [
        { id: 1913901, name: 'André', number: 1, position: 'Goalkeeper', age: 28, photo: null },
        { id: 1913902, name: 'Danilo', number: 12, position: 'Goalkeeper', age: 25, photo: null },
        { id: 1913903, name: 'Lucas Bahia', number: 2, position: 'Defender', age: 27, photo: null },
        { id: 1913904, name: 'Jefferson', number: 3, position: 'Defender', age: 29, photo: null },
        { id: 1913905, name: 'Emerson', number: 4, position: 'Defender', age: 28, photo: null },
        { id: 1913906, name: 'Renan', number: 6, position: 'Defender', age: 26, photo: null },
        { id: 1913907, name: 'Alexandre', number: 5, position: 'Midfielder', age: 26, photo: null },
        { id: 1913908, name: 'Michel', number: 8, position: 'Midfielder', age: 28, photo: null },
        { id: 1913909, name: 'Edinho', number: 10, position: 'Midfielder', age: 30, photo: null },
        { id: 1913910, name: 'Fabinho', number: 16, position: 'Midfielder', age: 25, photo: null },
        { id: 1913911, name: 'Vitinho', number: 9, position: 'Attacker', age: 25, photo: null },
        { id: 1913912, name: 'Douglas', number: 11, position: 'Attacker', age: 27, photo: null },
        { id: 1913913, name: 'Riquelme', number: 7, position: 'Attacker', age: 23, photo: null },
      ],
      21977: [
        { id: 2197701, name: 'Victor Hugo', number: 1, position: 'Goalkeeper', age: 26, photo: null },
        { id: 2197702, name: 'Gabriel', number: 12, position: 'Goalkeeper', age: 22, photo: null },
        { id: 2197703, name: 'Samuel', number: 2, position: 'Defender', age: 25, photo: null },
        { id: 2197704, name: 'Arthur', number: 3, position: 'Defender', age: 27, photo: null },
        { id: 2197705, name: 'Douglas Silva', number: 4, position: 'Defender', age: 28, photo: null },
        { id: 2197706, name: 'Kaique', number: 6, position: 'Defender', age: 24, photo: null },
        { id: 2197707, name: 'Luiz Henrique', number: 5, position: 'Midfielder', age: 26, photo: null },
        { id: 2197708, name: 'Carlos Alberto', number: 8, position: 'Midfielder', age: 28, photo: null },
        { id: 2197709, name: 'Yuri', number: 10, position: 'Midfielder', age: 25, photo: null },
        { id: 2197710, name: 'Nathan', number: 14, position: 'Midfielder', age: 23, photo: null },
        { id: 2197711, name: 'Murilo', number: 9, position: 'Attacker', age: 26, photo: null },
        { id: 2197712, name: 'Kauê', number: 11, position: 'Attacker', age: 24, photo: null },
        { id: 2197713, name: 'Ryan', number: 7, position: 'Attacker', age: 22, photo: null },
      ],
    };

    for (const [teamExtId, squadList] of Object.entries(SQUADS_DEF)) {
      const extIdNum = parseInt(teamExtId, 10);
      try {
        const existing = await (this.prisma as any).teamSquad.findUnique({
          where: { teamExternalId: extIdNum },
        });
        if (!existing) {
          await (this.prisma as any).teamSquad.create({
            data: {
              teamExternalId: extIdNum,
              squadJson: JSON.stringify(squadList),
            },
          });
        }
      } catch (squadErr: any) {
        this.logger.warn(`[TOCANTINENSE-2027-SEEDER] Aviso ao registrar squad do time ${teamExtId}: ${squadErr.message}`);
      }
    }

    // 5. As 28 Partidas Oficiais da Tabela FTF 2027 (Taça Otoniel Andrade)
    const MATCHES_SCHEDULE = [
      // 1ª Rodada - 16/01/2027 (Sáb) 16:00
      { ref: 1, rod: 'Rodada 1', data: '2027-01-16T19:00:00Z', home: 'araguaina', away: 'gurupi', estadio: 'Estádio Mirandão', cidade: 'Araguaína' },
      { ref: 2, rod: 'Rodada 1', data: '2027-01-16T19:00:00Z', home: 'capital', away: 'batalhao', estadio: 'Estádio Nilton Santos', cidade: 'Palmas' },
      { ref: 3, rod: 'Rodada 1', data: '2027-01-16T19:00:00Z', home: 'tocantinopolis', away: 'uniao', estadio: 'Estádio Ribeirão', cidade: 'Tocantinópolis' },
      { ref: 4, rod: 'Rodada 1', data: '2027-01-16T19:00:00Z', home: 'bela_vista', away: 'guarai', estadio: 'Estádio Jorge Filho', cidade: 'Angico' },

      // 2ª Rodada - 23/01/2027 (Sáb) 16:00
      { ref: 5, rod: 'Rodada 2', data: '2027-01-23T19:00:00Z', home: 'gurupi', away: 'bela_vista', estadio: 'Estádio Rezendão', cidade: 'Gurupi' },
      { ref: 6, rod: 'Rodada 2', data: '2027-01-23T19:00:00Z', home: 'uniao', away: 'capital', estadio: 'Estádio Mirandão', cidade: 'Araguaína' },
      { ref: 7, rod: 'Rodada 2', data: '2027-01-23T19:00:00Z', home: 'batalhao', away: 'araguaina', estadio: 'Estádio Nilton Santos', cidade: 'Palmas' },
      { ref: 8, rod: 'Rodada 2', data: '2027-01-23T19:00:00Z', home: 'guarai', away: 'tocantinopolis', estadio: 'Estádio Delfinão', cidade: 'Guaraí' },

      // 3ª Rodada - 30/01/2027 (Sáb) 16:00
      { ref: 9, rod: 'Rodada 3', data: '2027-01-30T19:00:00Z', home: 'gurupi', away: 'guarai', estadio: 'Estádio Rezendão', cidade: 'Gurupi' },
      { ref: 10, rod: 'Rodada 3', data: '2027-01-30T19:00:00Z', home: 'tocantinopolis', away: 'bela_vista', estadio: 'Estádio Ribeirão', cidade: 'Tocantinópolis' },
      { ref: 11, rod: 'Rodada 3', data: '2027-01-30T19:00:00Z', home: 'uniao', away: 'batalhao', estadio: 'Estádio Mirandão', cidade: 'Araguaína' },
      { ref: 12, rod: 'Rodada 3', data: '2027-01-30T19:00:00Z', home: 'capital', away: 'araguaina', estadio: 'Estádio Nilton Santos', cidade: 'Palmas' },

      // 4ª Rodada - 06/02/2027 (Sáb) 16:00
      { ref: 13, rod: 'Rodada 4', data: '2027-02-06T19:00:00Z', home: 'uniao', away: 'gurupi', estadio: 'Estádio Mirandão', cidade: 'Araguaína' },
      { ref: 14, rod: 'Rodada 4', data: '2027-02-06T19:00:00Z', home: 'batalhao', away: 'guarai', estadio: 'Estádio Nilton Santos', cidade: 'Palmas' },
      { ref: 15, rod: 'Rodada 4', data: '2027-02-06T19:00:00Z', home: 'tocantinopolis', away: 'capital', estadio: 'Estádio Ribeirão', cidade: 'Tocantinópolis' },
      { ref: 16, rod: 'Rodada 4', data: '2027-02-06T19:00:00Z', home: 'bela_vista', away: 'araguaina', estadio: 'Estádio Jorge Filho', cidade: 'Angico' },

      // 5ª Rodada - 09/02/2027 (Ter) 16:00
      { ref: 17, rod: 'Rodada 5', data: '2027-02-09T19:00:00Z', home: 'capital', away: 'bela_vista', estadio: 'Estádio Nilton Santos', cidade: 'Palmas' },
      { ref: 18, rod: 'Rodada 5', data: '2027-02-09T19:00:00Z', home: 'guarai', away: 'uniao', estadio: 'Estádio Delfinão', cidade: 'Guaraí' },
      { ref: 19, rod: 'Rodada 5', data: '2027-02-09T19:00:00Z', home: 'araguaina', away: 'tocantinopolis', estadio: 'Estádio Mirandão', cidade: 'Araguaína' },
      { ref: 20, rod: 'Rodada 5', data: '2027-02-09T19:00:00Z', home: 'gurupi', away: 'batalhao', estadio: 'Estádio Rezendão', cidade: 'Gurupi' },

      // 6ª Rodada - 13/02/2027 (Sáb) 16:00
      { ref: 21, rod: 'Rodada 6', data: '2027-02-13T19:00:00Z', home: 'tocantinopolis', away: 'batalhao', estadio: 'Estádio Ribeirão', cidade: 'Tocantinópolis' },
      { ref: 22, rod: 'Rodada 6', data: '2027-02-13T19:00:00Z', home: 'capital', away: 'gurupi', estadio: 'Estádio Nilton Santos', cidade: 'Palmas' },
      { ref: 23, rod: 'Rodada 6', data: '2027-02-13T19:00:00Z', home: 'araguaina', away: 'guarai', estadio: 'Estádio Mirandão', cidade: 'Araguaína' },
      { ref: 24, rod: 'Rodada 6', data: '2027-02-13T19:00:00Z', home: 'bela_vista', away: 'uniao', estadio: 'Estádio Jorge Filho', cidade: 'Angico' },

      // 7ª Rodada - 20/02/2027 (Sáb) 16:00
      { ref: 25, rod: 'Rodada 7', data: '2027-02-20T19:00:00Z', home: 'gurupi', away: 'tocantinopolis', estadio: 'Estádio Rezendão', cidade: 'Gurupi' },
      { ref: 26, rod: 'Rodada 7', data: '2027-02-20T19:00:00Z', home: 'guarai', away: 'capital', estadio: 'Estádio Delfinão', cidade: 'Guaraí' },
      { ref: 27, rod: 'Rodada 7', data: '2027-02-20T19:00:00Z', home: 'batalhao', away: 'bela_vista', estadio: 'Estádio Nilton Santos', cidade: 'Palmas' },
      { ref: 28, rod: 'Rodada 7', data: '2027-02-20T19:00:00Z', home: 'uniao', away: 'araguaina', estadio: 'Estádio Mirandão', cidade: 'Araguaína' },
    ];

    let insertedFixtures = 0;

    for (const m of MATCHES_SCHEDULE) {
      const extId = 631000 + m.ref;
      const homeTeamId = teamDbMap.get(m.home);
      const awayTeamId = teamDbMap.get(m.away);

      if (!homeTeamId || !awayTeamId) {
        this.logger.warn(`[TOCANTINENSE-2027-SEEDER] Time não encontrado para jogo ${m.ref}: ${m.home} x ${m.away}`);
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
          homeTeamId: homeTeamId,
          awayTeamId: awayTeamId,
        },
      });
      insertedFixtures++;
    }

    const msg = `Tocantinense 2027 semeado com sucesso: 8 clubes oficiais e ${insertedFixtures} partidas da FTF gravadas.`;
    this.logger.log(`[TOCANTINENSE-2027-SEEDER] ${msg}`);
    return { success: true, fixturesCount: insertedFixtures, message: msg };
  }
}

