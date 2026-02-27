-- AlterTable
ALTER TABLE "User" ADD COLUMN "totalScore" INTEGER NOT NULL DEFAULT 0;

-- Backfill totalScore from existing LeaderboardEntry records
UPDATE "User" SET "totalScore" = COALESCE(
  (SELECT SUM("score") FROM "LeaderboardEntry" WHERE "LeaderboardEntry"."userId" = "User"."id"),
  0
);
