-- AlterTable: add daily-login bonus tracking fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "loginStreak" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bestLoginStreak" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginDate" DATE;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginBonusAt" TIMESTAMP(3);

-- Index to speed up daily-login lookups / admin analytics
CREATE INDEX IF NOT EXISTS "User_lastLoginDate_idx" ON "User"("lastLoginDate");
