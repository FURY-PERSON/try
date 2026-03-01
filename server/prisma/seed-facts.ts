/**
 * Seed script to populate the database with facts across all categories and difficulty levels.
 * Usage: npx ts-node --compiler-options '{"module":"commonjs"}' prisma/seed-facts.ts
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

type QuestionEntry = {
  statement: string;
  isTrue: boolean;
  explanation: string;
  source: string;
  sourceUrl: string | null;
  language: string;
  difficulty: number;
};

function loadAndMerge(files: string[]): Record<string, QuestionEntry[]> {
  const merged: Record<string, QuestionEntry[]> = {};
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const data: Record<string, QuestionEntry[]> = JSON.parse(fs.readFileSync(file, 'utf-8'));
    for (const [cat, questions] of Object.entries(data)) {
      if (!merged[cat]) merged[cat] = [];
      merged[cat].push(...questions);
    }
  }
  return merged;
}

async function main() {
  if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'stage') {
    console.log(`⛔ Seed skipped: NODE_ENV="${process.env.NODE_ENV ?? 'undefined'}" (required: development or stage)`);
    return;
  }

  const existingCount = await prisma.question.count();
  if (existingCount > 0) {
    console.log(`⛔ Seed skipped: database already contains ${existingCount} questions.`);
    return;
  }

  const data = loadAndMerge([
    path.join(__dirname, 'seed-questions.json'),
    path.join(__dirname, 'seed-questions-200.json'),
  ]);

  // Map category names to IDs
  const categories = await prisma.category.findMany({
    where: { isActive: true },
  });

  const categoryMap: Record<string, string> = {};
  for (const cat of categories) {
    categoryMap[cat.name] = cat.id;
  }

  let created = 0;
  let skipped = 0;

  for (const [categoryName, questions] of Object.entries(data)) {
    const categoryId = categoryMap[categoryName];
    if (!categoryId) {
      console.log(`⚠ Category "${categoryName}" not found, skipping ${questions.length} questions`);
      skipped += questions.length;
      continue;
    }

    console.log(`\n📂 ${categoryName} (${categoryId})`);

    for (const q of questions) {
      // Check for duplicate by statement
      const existing = await prisma.question.findFirst({
        where: { statement: q.statement },
      });

      if (existing) {
        console.log(`  ⏭ Already exists: "${q.statement.substring(0, 50)}..."`);
        skipped++;
        continue;
      }

      const question = await prisma.question.create({
        data: {
          statement: q.statement,
          isTrue: q.isTrue,
          explanation: q.explanation,
          source: q.source,
          sourceUrl: q.sourceUrl,
          language: q.language,
          categoryId: categoryId,
          difficulty: q.difficulty,
          status: 'approved',
        },
      });

      // Also create QuestionCategory entry for multi-category support
      await prisma.questionCategory.create({
        data: {
          questionId: question.id,
          categoryId: categoryId,
        },
      });

      created++;
      console.log(`  ✅ d${q.difficulty} ${q.isTrue ? '✓' : '✗'} ${q.statement.substring(0, 60)}...`);
    }
  }

  console.log(`\n========================================`);
  console.log(`Created: ${created}, Skipped: ${skipped}`);

  // Print summary
  const summary = await prisma.question.groupBy({
    by: ['difficulty'],
    where: { status: 'approved' },
    _count: true,
    orderBy: { difficulty: 'asc' },
  });
  console.log('\nDifficulty distribution:');
  for (const s of summary) {
    console.log(`  Level ${s.difficulty}: ${s._count} questions`);
  }

  const catSummary = await prisma.$queryRaw<Array<{ name: string; cnt: bigint }>>`
    SELECT c.name, count(q.id) as cnt
    FROM "Category" c
    LEFT JOIN "Question" q ON q."categoryId" = c.id AND q.status = 'approved'
    WHERE c."isActive" = true
    GROUP BY c.id, c.name
    ORDER BY c."sortOrder"
  `;
  console.log('\nCategory distribution:');
  for (const s of catSummary) {
    console.log(`  ${s.name}: ${s.cnt} questions`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
