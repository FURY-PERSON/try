-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "statementEn" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "explanationEn" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "CollectionItem" ADD COLUMN     "statementEn" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "explanationEn" TEXT NOT NULL DEFAULT '';
