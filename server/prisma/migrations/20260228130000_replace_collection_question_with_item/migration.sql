-- CreateTable: CollectionItem (self-contained questions for collections)
CREATE TABLE "CollectionItem" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "isTrue" BOOLEAN NOT NULL,
    "explanation" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT '',
    "sourceUrl" TEXT,
    "difficulty" INTEGER NOT NULL DEFAULT 3,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "language" TEXT NOT NULL DEFAULT 'ru',

    CONSTRAINT "CollectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CollectionItem_collectionId_idx" ON "CollectionItem"("collectionId");

-- AddForeignKey
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_collectionId_fkey"
    FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropTable: CollectionQuestion (no longer needed — questions are now inline)
DROP TABLE IF EXISTS "CollectionQuestion";
