-- AlterTable
ALTER TABLE "fixture_ai_analysis" ADD COLUMN "predictedResult" TEXT,
ADD COLUMN "isHit" BOOLEAN,
ADD COLUMN "tipsStatus" JSONB;
