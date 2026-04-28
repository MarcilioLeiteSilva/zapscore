import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const liveFixtures = await prisma.fixture.findMany({
    where: {
      statusShort: {
        in: ['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE']
      }
    },
    include: {
      league: true,
      homeTeam: true,
      awayTeam: true
    }
  });

  if (liveFixtures.length === 0) {
    console.log('Nenhum jogo ao vivo no momento nas competições monitoradas.');
  } else {
    console.log(`Encontrados ${liveFixtures.length} jogos ao vivo:\n`);
    liveFixtures.forEach(f => {
      console.log(`[${f.league.name}] ${f.homeTeam.name} ${f.homeGoals ?? 0} x ${f.awayGoals ?? 0} ${f.awayTeam.name} (${f.elapsed}') - Status: ${f.statusShort}`);
    });
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
