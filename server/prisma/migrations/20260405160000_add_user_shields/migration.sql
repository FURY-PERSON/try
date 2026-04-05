-- AlterTable
ALTER TABLE "User" ADD COLUMN "shields" INTEGER NOT NULL DEFAULT 0;

-- Initialize existing users with 5 shields
UPDATE "User" SET "shields" = 5;
