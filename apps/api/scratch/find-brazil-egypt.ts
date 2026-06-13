import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const teams = await prisma.team.findMany({
    where: { name: { contains: 'Brazil', mode: 'insensitive' } }
  });

  const egy = await prisma.team.findMany({
    where: { name: { contains: 'Egypt', mode: 'insensitive' } }
  });

  const teamIds = [...teams.map(t => t.id), ...egy.map(t => t.id)];

  if (teamIds.length > 0) {
    const fixtures = await prisma.fixture.findMany({
      where: {
        OR: [
          { homeTeamId: { in: teamIds } },
          { awayTeamId: { in: teamIds } }
        ]
      },
      include: {
        homeTeam: true,
        awayTeam: true
      },
      orderBy: { date: 'desc' },
      take: 5
    });

    console.log('Recent Fixtures:', fixtures.map(f => ({
      id: f.id,
      externalId: f.externalId,
      leagueId: f.leagueId,
      date: f.date,
      home: f.homeTeam?.name,
      away: f.awayTeam?.name
    })));
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
