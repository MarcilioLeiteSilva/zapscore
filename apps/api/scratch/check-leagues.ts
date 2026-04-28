import { PrismaClient } from '@prisma/client';

async function checkLeagues() {
  const prisma = new PrismaClient();
  const leagues = await prisma.league.findMany({
    select: { id: true, name: true, country: true }
  });
  console.log('Monitored Leagues:');
  console.table(leagues);
  await prisma.$disconnect();
}

checkLeagues();
