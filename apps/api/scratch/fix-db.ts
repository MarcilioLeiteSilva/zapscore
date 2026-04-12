import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('Trying to add "round" column to "Fixture" table...');
    await prisma.$executeRawUnsafe('ALTER TABLE "Fixture" ADD COLUMN IF NOT EXISTS "round" TEXT;');
    console.log('Column "round" added successfully.');
    
    console.log('Creating "FixtureEvent" table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "FixtureEvent" (
          "id" TEXT NOT NULL,
          "fixtureId" TEXT NOT NULL,
          "time" INTEGER NOT NULL,
          "teamId" INTEGER NOT NULL,
          "player" TEXT,
          "assist" TEXT,
          "type" TEXT NOT NULL,
          "detail" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "FixtureEvent_pkey" PRIMARY KEY ("id")
      );
    `);
    
    console.log('Creating "FixtureStat" table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "FixtureStat" (
          "id" TEXT NOT NULL,
          "fixtureId" TEXT NOT NULL,
          "teamId" INTEGER NOT NULL,
          "type" TEXT NOT NULL,
          "value" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "FixtureStat_pkey" PRIMARY KEY ("id")
      );
    `);

    console.log('Creating "FixtureLineup" table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "FixtureLineup" (
          "id" TEXT NOT NULL,
          "fixtureId" TEXT NOT NULL,
          "teamId" INTEGER NOT NULL,
          "player" TEXT NOT NULL,
          "number" INTEGER,
          "pos" TEXT,
          "grid" TEXT,
          "isStart" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "FixtureLineup_pkey" PRIMARY KEY ("id")
      );
    `);

    console.log('Database schema updated successfully.');
  } catch (error) {
    console.error('Error updating database schema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
