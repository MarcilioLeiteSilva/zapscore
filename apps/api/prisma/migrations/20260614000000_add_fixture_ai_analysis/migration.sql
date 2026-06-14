-- CreateTable
CREATE TABLE "fixture_ai_analysis" (
    "id" TEXT NOT NULL,
    "fixtureId" TEXT NOT NULL,
    "probHome" INTEGER NOT NULL,
    "probAway" INTEGER NOT NULL,
    "probDraw" INTEGER NOT NULL,
    "predictionSummary" TEXT NOT NULL,
    "tips" TEXT[],
    "commentary" TEXT NOT NULL,
    "lineupsFactored" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fixture_ai_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fixture_ai_analysis_fixtureId_key" ON "fixture_ai_analysis"("fixtureId");

-- AddForeignKey
ALTER TABLE "fixture_ai_analysis" ADD CONSTRAINT "fixture_ai_analysis_fixtureId_fkey" FOREIGN KEY ("fixtureId") REFERENCES "Fixture"("id") ON DELETE CASCADE ON UPDATE CASCADE;
