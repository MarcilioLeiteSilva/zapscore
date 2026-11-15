import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class Amazonense2027SeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(Amazonense2027SeederService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap() {
    this.logger.log('[AMAZONENSE-2027-SEEDER] Verificando integridade das partidas de 2027 no bootstrap...');
    try {
      await this.seedAmazonense2027();
    } catch (err: any) {
      this.logger.error(`[AMAZONENSE-2027-SEEDER] Falha ao verificar/popular 2027: ${err.message}`, err.stack);
    }
  }

  async seedAmazonense2027(): Promise<{ success: boolean; fixturesCount: number; message: string }> {
    // 1. Obter ou criar a liga Campeonato Amazonense (522)
    let league = await this.prisma.league.findUnique({
      where: { externalId: 522 },
    });

    if (!league) {
      league = await this.prisma.league.create({
        data: {
          externalId: 522,
          name: 'Campeonato Amazonense',
          country: 'Brazil',
          logo: 'https://media.api-sports.io/football/leagues/522.png',
          type: 'League',
          season: 2027,
        },
      });
      this.logger.log(`[AMAZONENSE-2027-SEEDER] Liga 522 criada no banco.`);
    }

    // 2. Upsert dos 8 Clubes Oficiais com Escudos Reais de Alta Resolução FAF/oGol/Wikipedia
    const TEAMS_DEF = [
      { key: 'nacional', externalId: 7578, name: 'Nacional Futebol Clube', code: 'NAC', logo: 'https://upload.wikimedia.org/wikipedia/pt/a/af/Nacional_FC_Amazonas_2021.png' },
      { key: 'amazonas', externalId: 15383, name: 'Amazonas Futebol Clube', code: 'AMA', logo: 'https://cdn-img.staticzz.com/img/logos/equipas/210178_imgbank_1711024367.png' },
      { key: 'manaus', externalId: 7566, name: 'Manaus Futebol Clube', code: 'MAN', logo: 'https://upload.wikimedia.org/wikipedia/pt/a/a3/Escudo_do_Manaus_Futebol_Clube.png' },
      { key: 'manauara', externalId: 18768, name: 'Manauara Esporte Clube', code: 'MNR', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Manauara_EC-AM_%28BRA%29_logo.png' },
      { key: 'princesa', externalId: 7579, name: 'Princesa do Solimões Esporte Clube', code: 'PRI', logo: 'https://cdn-img.staticzz.com/img/logos/equipas/3513_imgbank.png' },
      { key: 'parintins', externalId: 20120, name: 'RPE Parintins', code: 'PAR', logo: 'https://upload.wikimedia.org/wikipedia/pt/f/f9/ParintinsFC.png' },
      { key: 'itacoatiara', externalId: 243643, name: 'Itacoatiara Futebol Clube', code: 'ITA', logo: 'https://cdn-img.staticzz.com/img/logos/equipas/243643_imgbank_1784021108.png' },
      { key: 'fast', externalId: 7559, name: 'Nacional Fast Clube', code: 'FAS', logo: 'https://upload.wikimedia.org/wikipedia/commons/3/32/Fast_Clube.png' },
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
      7578: [ // Nacional FC
        { id: 757801, name: 'Robson', position: 'Goalkeeper', number: 1, age: 31, photo: '' },
        { id: 757802, name: 'Tom', position: 'Goalkeeper', number: 12, age: 25, photo: '' },
        { id: 757803, name: 'Ivan', position: 'Defender', number: 3, age: 29, photo: '' },
        { id: 757804, name: 'Davy', position: 'Defender', number: 4, age: 27, photo: '' },
        { id: 757805, name: 'Rogério', position: 'Defender', number: 2, age: 28, photo: '' },
        { id: 757806, name: 'Calebe', position: 'Midfielder', number: 8, age: 26, photo: '' },
        { id: 757807, name: 'Leo Aquino', position: 'Midfielder', number: 10, age: 28, photo: '' },
        { id: 757808, name: 'William Barbio', position: 'Attacker', number: 7, age: 31, photo: '' },
        { id: 757809, name: 'Tcharles', position: 'Attacker', number: 9, age: 30, photo: '' },
        { id: 757810, name: 'Vitinho', position: 'Attacker', number: 11, age: 24, photo: '' },
      ],
      15383: [ // Amazonas FC
        { id: 1538301, name: 'Fabian Volpi', position: 'Goalkeeper', number: 1, age: 27, photo: '' },
        { id: 1538302, name: 'Marcão', position: 'Goalkeeper', number: 12, age: 31, photo: '' },
        { id: 1538303, name: 'Miranda', position: 'Defender', number: 3, age: 25, photo: '' },
        { id: 1538304, name: 'Wellington Manzoli', position: 'Defender', number: 4, age: 28, photo: '' },
        { id: 1538305, name: 'Fabiano', position: 'Defender', number: 6, age: 33, photo: '' },
        { id: 1538306, name: 'Xavier', position: 'Midfielder', number: 5, age: 29, photo: '' },
        { id: 1538307, name: 'Rafael Tavares', position: 'Midfielder', number: 10, age: 32, photo: '' },
        { id: 1538308, name: 'Sassá', position: 'Attacker', number: 9, age: 31, photo: '' },
        { id: 1538309, name: 'Dentinho', position: 'Attacker', number: 7, age: 27, photo: '' },
        { id: 1538310, name: 'Matheus Serafim', position: 'Attacker', number: 11, age: 26, photo: '' },
      ],
      7566: [ // Manaus FC
        { id: 756601, name: 'Vinicius', position: 'Goalkeeper', number: 1, age: 29, photo: '' },
        { id: 756602, name: 'Gutierrez', position: 'Defender', number: 3, age: 28, photo: '' },
        { id: 756603, name: 'Jefferson', position: 'Defender', number: 4, age: 26, photo: '' },
        { id: 756604, name: 'Dieyson', position: 'Defender', number: 6, age: 30, photo: '' },
        { id: 756605, name: 'Felipe Tiririca', position: 'Midfielder', number: 8, age: 27, photo: '' },
        { id: 756606, name: 'Gharib', position: 'Midfielder', number: 10, age: 28, photo: '' },
        { id: 756607, name: 'Roney', position: 'Attacker', number: 7, age: 26, photo: '' },
        { id: 756608, name: 'Denis', position: 'Attacker', number: 9, age: 27, photo: '' },
      ],
      18768: [ // Manauara EC
        { id: 1876801, name: 'Jonathan', position: 'Goalkeeper', number: 1, age: 28, photo: '' },
        { id: 1876802, name: 'Paulinho', position: 'Defender', number: 2, age: 27, photo: '' },
        { id: 1876803, name: 'Tibúrcio', position: 'Defender', number: 3, age: 29, photo: '' },
        { id: 1876804, name: 'Jhonathan Moc', position: 'Defender', number: 6, age: 32, photo: '' },
        { id: 1876805, name: 'Ítalo', position: 'Midfielder', number: 5, age: 26, photo: '' },
        { id: 1876806, name: 'Wallace', position: 'Midfielder', number: 8, age: 28, photo: '' },
        { id: 1876807, name: 'Neto Oliveira', position: 'Attacker', number: 9, age: 26, photo: '' },
        { id: 1876808, name: 'Vitinho', position: 'Attacker', number: 11, age: 24, photo: '' },
      ],
      7579: [ // Princesa do Solimões
        { id: 757901, name: 'Jonathan', position: 'Goalkeeper', number: 1, age: 26, photo: '' },
        { id: 757902, name: 'Rodolfo', position: 'Defender', number: 3, age: 29, photo: '' },
        { id: 757903, name: 'Eric', position: 'Defender', number: 4, age: 27, photo: '' },
        { id: 757904, name: 'Wesley', position: 'Defender', number: 2, age: 25, photo: '' },
        { id: 757905, name: 'Koffi', position: 'Midfielder', number: 5, age: 28, photo: '' },
        { id: 757906, name: 'Léo Pará', position: 'Midfielder', number: 8, age: 27, photo: '' },
        { id: 757907, name: 'Jonas', position: 'Attacker', number: 9, age: 29, photo: '' },
        { id: 757908, name: 'Max', position: 'Attacker', number: 11, age: 25, photo: '' },
      ],
      20120: [ // RPE Parintins
        { id: 2012001, name: 'Robert', position: 'Goalkeeper', number: 1, age: 27, photo: '' },
        { id: 2012002, name: 'Állefe', position: 'Defender', number: 2, age: 26, photo: '' },
        { id: 2012003, name: 'Fernando', position: 'Defender', number: 3, age: 28, photo: '' },
        { id: 2012004, name: 'Gabriel', position: 'Defender', number: 4, age: 25, photo: '' },
        { id: 2012005, name: 'Victor Léo', position: 'Midfielder', number: 8, age: 26, photo: '' },
        { id: 2012006, name: 'Darlyson', position: 'Midfielder', number: 10, age: 24, photo: '' },
        { id: 2012007, name: 'Weverton', position: 'Attacker', number: 9, age: 28, photo: '' },
        { id: 2012008, name: 'Lucas Silva', position: 'Attacker', number: 11, age: 25, photo: '' },
      ],
      243643: [ // Itacoatiara FC
        { id: 24364301, name: 'Zé Carlos', position: 'Goalkeeper', number: 1, age: 28, photo: '' },
        { id: 24364302, name: 'Rayo', position: 'Defender', number: 3, age: 26, photo: '' },
        { id: 24364303, name: 'Felipinho', position: 'Defender', number: 2, age: 25, photo: '' },
        { id: 24364304, name: 'Marcelinho', position: 'Defender', number: 4, age: 27, photo: '' },
        { id: 24364305, name: 'Léo Barba', position: 'Midfielder', number: 5, age: 29, photo: '' },
        { id: 24364306, name: 'Thiago', position: 'Midfielder', number: 8, age: 26, photo: '' },
        { id: 24364307, name: 'Léo Pará', position: 'Attacker', number: 9, age: 28, photo: '' },
        { id: 24364308, name: 'Serginho', position: 'Attacker', number: 11, age: 24, photo: '' },
      ],
      7559: [ // Fast Clube
        { id: 755901, name: 'Valter', position: 'Goalkeeper', number: 1, age: 28, photo: '' },
        { id: 755902, name: 'Guigui', position: 'Defender', number: 2, age: 26, photo: '' },
        { id: 755903, name: 'Thiago Spice', position: 'Defender', number: 3, age: 34, photo: '' },
        { id: 755904, name: 'Bernardo', position: 'Defender', number: 4, age: 27, photo: '' },
        { id: 755905, name: 'Emerson', position: 'Midfielder', number: 5, age: 29, photo: '' },
        { id: 755906, name: 'Robinho', position: 'Midfielder', number: 10, age: 28, photo: '' },
        { id: 755907, name: 'Claudinho', position: 'Attacker', number: 7, age: 26, photo: '' },
        { id: 755908, name: 'Alex', position: 'Attacker', number: 9, age: 27, photo: '' },
      ],
    };

    try {
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "TeamSquad" (
          "id" TEXT PRIMARY KEY,
          "teamExternalId" INTEGER NOT NULL UNIQUE,
          "squadJson" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS "TeamSquad_teamExternalId_idx" ON "TeamSquad"("teamExternalId");
      `);
    } catch (tblErr: any) {
      this.logger.warn(`[AMAZONENSE-2027-SEEDER] Aviso ao garantir tabela TeamSquad: ${tblErr.message}`);
    }

    for (const [teamExtId, squadList] of Object.entries(SQUADS_DEF)) {
      const extIdNum = parseInt(teamExtId, 10);
      try {
        const existing = await (this.prisma as any).teamSquad.findUnique({
          where: { teamExternalId: extIdNum },
        });
        if (!existing) {
          await (this.prisma as any).teamSquad.create({
            data: {
              id: randomUUID(),
              teamExternalId: extIdNum,
              squadJson: JSON.stringify(squadList),
            },
          });
        } else {
          await (this.prisma as any).teamSquad.update({
            where: { teamExternalId: extIdNum },
            data: {
              squadJson: JSON.stringify(squadList),
            },
          });
        }
      } catch (squadErr: any) {
        this.logger.warn(`[AMAZONENSE-2027-SEEDER] Aviso ao registrar squad do time ${teamExtId}: ${squadErr.message}`);
      }
    }

    // 5. Tabela Completa das 28 Partidas da 1ª Fase Oficial da FAF
    const FIXTURES_DEF = [
      // 1ª Rodada (9 e 10 de Janeiro)
      { externalId: 52201, round: '1ª Rodada', date: '2027-01-09T19:30:00.000Z', home: 'nacional', away: 'fast', venue: 'Arena da Amazônia' },
      { externalId: 52202, round: '1ª Rodada', date: '2027-01-09T19:30:00.000Z', home: 'amazonas', away: 'itacoatiara', venue: 'Estádio Carlos Zamith' },
      { externalId: 52203, round: '1ª Rodada', date: '2027-01-10T19:30:00.000Z', home: 'manaus', away: 'parintins', venue: 'Arena da Amazônia' },
      { externalId: 52204, round: '1ª Rodada', date: '2027-01-10T19:30:00.000Z', home: 'manauara', away: 'princesa', venue: 'Estádio Ismael Benigno' },

      // 2ª Rodada (12 a 14 de Janeiro)
      { externalId: 52205, round: '2ª Rodada', date: '2027-01-12T19:30:00.000Z', home: 'fast', away: 'princesa', venue: 'Estádio Ismael Benigno' },
      { externalId: 52206, round: '2ª Rodada', date: '2027-01-13T19:30:00.000Z', home: 'parintins', away: 'manauara', venue: 'Estádio Francisco Garcia' },
      { externalId: 52207, round: '2ª Rodada', date: '2027-01-13T19:30:00.000Z', home: 'itacoatiara', away: 'manaus', venue: 'Estádio Floro de Mendonça' },
      { externalId: 52208, round: '2ª Rodada', date: '2027-01-14T19:30:00.000Z', home: 'nacional', away: 'amazonas', venue: 'Arena da Amazônia' },

      // 3ª Rodada (15 a 18 de Janeiro)
      { externalId: 52209, round: '3ª Rodada', date: '2027-01-15T19:30:00.000Z', home: 'amazonas', away: 'fast', venue: 'Estádio Carlos Zamith' },
      { externalId: 52210, round: '3ª Rodada', date: '2027-01-16T19:30:00.000Z', home: 'manaus', away: 'nacional', venue: 'Arena da Amazônia' },
      { externalId: 52211, round: '3ª Rodada', date: '2027-01-17T19:30:00.000Z', home: 'manauara', away: 'itacoatiara', venue: 'Estádio Ismael Benigno' },
      { externalId: 52212, round: '3ª Rodada', date: '2027-01-18T19:30:00.000Z', home: 'princesa', away: 'parintins', venue: 'Estádio Gilberto Mestrinho' },

      // 4ª Rodada (20 a 25 de Janeiro)
      { externalId: 52213, round: '4ª Rodada', date: '2027-01-20T19:30:00.000Z', home: 'fast', away: 'parintins', venue: 'Estádio Ismael Benigno' },
      { externalId: 52214, round: '4ª Rodada', date: '2027-01-23T19:30:00.000Z', home: 'itacoatiara', away: 'princesa', venue: 'Estádio Floro de Mendonça' },
      { externalId: 52215, round: '4ª Rodada', date: '2027-01-24T19:30:00.000Z', home: 'nacional', away: 'manauara', venue: 'Arena da Amazônia' },
      { externalId: 52216, round: '4ª Rodada', date: '2027-01-25T19:30:00.000Z', home: 'amazonas', away: 'manaus', venue: 'Arena da Amazônia' },

      // 5ª Rodada (28 de Janeiro a 4 de Fevereiro)
      { externalId: 52217, round: '5ª Rodada', date: '2027-01-28T19:30:00.000Z', home: 'manaus', away: 'fast', venue: 'Arena da Amazônia' },
      { externalId: 52218, round: '5ª Rodada', date: '2027-01-31T19:30:00.000Z', home: 'manauara', away: 'amazonas', venue: 'Estádio Ismael Benigno' },
      { externalId: 52219, round: '5ª Rodada', date: '2027-02-02T19:30:00.000Z', home: 'princesa', away: 'nacional', venue: 'Estádio Gilberto Mestrinho' },
      { externalId: 52220, round: '5ª Rodada', date: '2027-02-04T19:30:00.000Z', home: 'parintins', away: 'itacoatiara', venue: 'Estádio Francisco Garcia' },

      // 6ª Rodada (11 a 15 de Fevereiro)
      { externalId: 52221, round: '6ª Rodada', date: '2027-02-11T19:30:00.000Z', home: 'fast', away: 'itacoatiara', venue: 'Estádio Ismael Benigno' },
      { externalId: 52222, round: '6ª Rodada', date: '2027-02-13T19:30:00.000Z', home: 'nacional', away: 'parintins', venue: 'Arena da Amazônia' },
      { externalId: 52223, round: '6ª Rodada', date: '2027-02-14T19:30:00.000Z', home: 'amazonas', away: 'princesa', venue: 'Estádio Carlos Zamith' },
      { externalId: 52224, round: '6ª Rodada', date: '2027-02-15T19:30:00.000Z', home: 'manaus', away: 'manauara', venue: 'Arena da Amazônia' },

      // 7ª Rodada (17 a 21 de Fevereiro)
      { externalId: 52225, round: '7ª Rodada', date: '2027-02-17T19:30:00.000Z', home: 'manauara', away: 'fast', venue: 'Estádio Ismael Benigno' },
      { externalId: 52226, round: '7ª Rodada', date: '2027-02-20T19:30:00.000Z', home: 'princesa', away: 'manaus', venue: 'Estádio Gilberto Mestrinho' },
      { externalId: 52227, round: '7ª Rodada', date: '2027-02-21T19:30:00.000Z', home: 'parintins', away: 'amazonas', venue: 'Estádio Francisco Garcia' },
      { externalId: 52228, round: '7ª Rodada', date: '2027-02-21T19:30:00.000Z', home: 'itacoatiara', away: 'nacional', venue: 'Estádio Floro de Mendonça' },
    ];

    let count = 0;
    for (const f of FIXTURES_DEF) {
      const homeTeamId = teamDbMap.get(f.home);
      const awayTeamId = teamDbMap.get(f.away);

      if (!homeTeamId || !awayTeamId) {
        this.logger.error(`[AMAZONENSE-2027-SEEDER] Time não encontrado para confronto ${f.home} x ${f.away}`);
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

    this.logger.log(`[AMAZONENSE-2027-SEEDER] Concluído com sucesso! ${count} partidas registradas para o Barezão 2027.`);
    return {
      success: true,
      fixturesCount: count,
      message: `Barezão 2027 semeado com sucesso: 8 clubes oficiais e ${count} partidas da FAF gravadas.`,
    };
  }
}
