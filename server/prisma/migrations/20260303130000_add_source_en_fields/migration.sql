-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "sourceEn" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "sourceUrlEn" TEXT;

-- AlterTable
ALTER TABLE "CollectionItem" ADD COLUMN     "sourceEn" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "sourceUrlEn" TEXT;
