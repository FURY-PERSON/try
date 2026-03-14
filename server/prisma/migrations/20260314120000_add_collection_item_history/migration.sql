-- CreateTable
CREATE TABLE "UserCollectionItemHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserCollectionItemHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserCollectionItemHistory_userId_collectionId_questionId_key" ON "UserCollectionItemHistory"("userId", "collectionId", "questionId");

-- CreateIndex
CREATE INDEX "UserCollectionItemHistory_userId_collectionId_idx" ON "UserCollectionItemHistory"("userId", "collectionId");

-- AddForeignKey
ALTER TABLE "UserCollectionItemHistory" ADD CONSTRAINT "UserCollectionItemHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
