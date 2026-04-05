-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "shields" INTEGER NOT NULL DEFAULT 0;

-- Initialize existing users with 5 shields
UPDATE "User" SET "shields" = 5 WHERE "shields" = 0;
