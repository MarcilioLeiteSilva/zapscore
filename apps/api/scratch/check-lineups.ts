import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const fixtures = await prisma.fixture.findMany({
    where: {
      leagueId: 612,
      statusShort: { in: ['LIVE', '1H', '2H', 'HT', 'NS', 'TBD', 'FT', 'PEN'] }
    },
    include: {
      homeTeam: true,
      awayTeam: true,
      lineups: true
    },
    orderBy: { date: 'desc' },
    take: 1
  });
  if (fixtures.length === 0) {
    console.log('No fixtures found');
  } else {
    console.log('Match: ' + fixtures[0].homeTeam.name + ' vs ' + fixtures[0].awayTeam.name);
    console.log('Status: ' + fixtures[0].statusShort);
    console.log('Lineups in DB: ' + (fixtures[0].lineups.length > 0 ? 'Yes (' + fixtures[0].lineups.length + ' players)' : 'No'));
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
