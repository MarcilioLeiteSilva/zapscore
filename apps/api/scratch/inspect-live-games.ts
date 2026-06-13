import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const total = await prisma.fixture.count();
    console.log(`Total fixtures in DB: ${total}`);

    // Query live fixtures
    const liveFixtures = await prisma.fixture.findMany({
      where: {
        statusShort: {
          in: ['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE']
        }
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        league: true
      },
      orderBy: { date: 'asc' }
    });

    console.log(`\n--- JOGOS AO VIVO (${liveFixtures.length}) ---`);
    for (const f of liveFixtures) {
      console.log(`[ID: ${f.externalId}] [${f.league.name}] ${f.homeTeam.name} ${f.homeGoals ?? 0} - ${f.awayGoals ?? 0} ${f.awayTeam.name} (Tempo: ${f.elapsed}', Status: ${f.statusShort})`);
    }

    // Query all today's fixtures (June 13, 2026 UTC, or around today)
    const todayStart = new Date('2026-06-13T00:00:00.000Z');
    const todayEnd = new Date('2026-06-13T23:59:59.999Z');
    const todayFixtures = await prisma.fixture.findMany({
      where: {
        date: {
          gte: todayStart,
          lte: todayEnd
        }
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        league: true
      },
      orderBy: { date: 'asc' }
    });

    console.log(`\n--- TODOS OS JOGOS DE HOJE (13/06/2026) NO BANCO (${todayFixtures.length}) ---`);
    for (const f of todayFixtures) {
      console.log(`[ID: ${f.externalId}] [${f.league.name}] ${f.homeTeam.name} ${f.homeGoals ?? 0} - ${f.awayGoals ?? 0} ${f.awayTeam.name} (Status: ${f.statusShort}, Hora: ${f.date.toISOString()})`);
    }

  } catch (err) {
    console.error('Error querying fixtures:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
