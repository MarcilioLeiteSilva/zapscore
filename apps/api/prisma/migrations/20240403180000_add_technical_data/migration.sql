-- AlterTable
ALTER TABLE "Fixture" ADD COLUMN     "round" TEXT;

-- CreateTable
CREATE TABLE "FixtureEvent" (
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

-- CreateTable
CREATE TABLE "FixtureStat" (
    "id" TEXT NOT NULL,
    "fixtureId" TEXT NOT NULL,
    "teamId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FixtureStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FixtureLineup" (
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

-- CreateIndex
CREATE UNIQUE INDEX "FixtureStat_fixtureId_teamId_type_key" ON "FixtureStat"("fixtureId", "teamId", "type");

-- AddForeignKey
ALTER TABLE "FixtureEvent" ADD CONSTRAINT "FixtureEvent_fixtureId_fkey" FOREIGN KEY ("fixtureId") REFERENCES "Fixture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixtureStat" ADD CONSTRAINT "FixtureStat_fixtureId_fkey" FOREIGN KEY ("fixtureId") REFERENCES "Fixture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixtureLineup" ADD CONSTRAINT "FixtureLineup_fixtureId_fkey" FOREIGN KEY ("fixtureId") REFERENCES "Fixture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
