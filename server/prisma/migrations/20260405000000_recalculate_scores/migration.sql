-- Recalculate UserQuestionHistory.score using the formula:
-- base(1) + difficultyBonus(floor(difficulty / 2)) + timeBonus(floor(max(0, 60 - timeSpentSeconds) / 20))
-- Previously stored 0/1 instead of the calculated score.

UPDATE "UserQuestionHistory" uqh
SET "score" = CASE
  WHEN uqh."result" = 'correct' THEN
    1 + FLOOR(q."difficulty" / 2) + FLOOR(GREATEST(0, 60 - uqh."timeSpentSeconds") / 20)
  ELSE 0
END
FROM "Question" q
WHERE uqh."questionId" = q."id";

-- Recalculate User.totalScore as the sum of real scores
UPDATE "User" u
SET "totalScore" = COALESCE(sub.total, 0)
FROM (
  SELECT "userId", SUM("score") AS total
  FROM "UserQuestionHistory"
  GROUP BY "userId"
) sub
WHERE u."id" = sub."userId";

-- Reset totalScore to 0 for users with no history
UPDATE "User"
SET "totalScore" = 0
WHERE "id" NOT IN (
  SELECT DISTINCT "userId" FROM "UserQuestionHistory"
) AND "totalScore" != 0;
