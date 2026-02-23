-- AlterTable: Extend Category with new fields
ALTER TABLE "Category" ADD COLUMN "color" TEXT NOT NULL DEFAULT '#34C759';
ALTER TABLE "Category" ADD COLUMN "description" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Category" ADD COLUMN "descriptionEn" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Category" ADD COLUMN "imageUrl" TEXT;

-- CreateTable: Collection
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "descriptionEn" TEXT NOT NULL DEFAULT '',
    "icon" TEXT NOT NULL DEFAULT '📚',
    "imageUrl" TEXT,
    "type" TEXT NOT NULL DEFAULT 'thematic',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "startDate" DATE,
    "endDate" DATE,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CollectionQuestion
CREATE TABLE "CollectionQuestion" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "CollectionQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable: UserCollectionProgress
CREATE TABLE "UserCollectionProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "collectionType" TEXT NOT NULL,
    "referenceId" TEXT,
    "difficulty" TEXT,
    "correctAnswers" INTEGER NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserCollectionProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CollectionQuestion_collectionId_questionId_key" ON "CollectionQuestion"("collectionId", "questionId");

-- CreateIndex
CREATE INDEX "UserCollectionProgress_userId_collectionType_idx" ON "UserCollectionProgress"("userId", "collectionType");

-- CreateIndex
CREATE INDEX "UserCollectionProgress_userId_referenceId_idx" ON "UserCollectionProgress"("userId", "referenceId");

-- AddForeignKey
ALTER TABLE "CollectionQuestion" ADD CONSTRAINT "CollectionQuestion_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionQuestion" ADD CONSTRAINT "CollectionQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCollectionProgress" ADD CONSTRAINT "UserCollectionProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
