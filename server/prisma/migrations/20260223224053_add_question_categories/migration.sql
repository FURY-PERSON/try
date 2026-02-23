-- CreateTable
CREATE TABLE "QuestionCategory" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "QuestionCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuestionCategory_categoryId_idx" ON "QuestionCategory"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionCategory_questionId_categoryId_key" ON "QuestionCategory"("questionId", "categoryId");

-- CreateIndex (performance for anti-repeat)
CREATE INDEX "UserQuestionHistory_userId_answeredAt_idx" ON "UserQuestionHistory"("userId", "answeredAt");

-- AddForeignKey
ALTER TABLE "QuestionCategory" ADD CONSTRAINT "QuestionCategory_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionCategory" ADD CONSTRAINT "QuestionCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: copy existing categoryId into QuestionCategory for every question
INSERT INTO "QuestionCategory" ("id", "questionId", "categoryId")
SELECT gen_random_uuid()::text, "id", "categoryId"
FROM "Question"
ON CONFLICT ("questionId", "categoryId") DO NOTHING;
