/**
 * Creates a daily set for today using existing approved questions.
 * Usage: npx ts-node --compiler-options '{"module":"commonjs"}' prisma/seed-daily.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Check if daily set already exists for today
  const existing = await prisma.dailySet.findUnique({
    where: { date: today },
    include: { questions: true },
  });

  if (existing) {
    console.log(`Daily set already exists for ${today.toISOString().split('T')[0]}`);
    console.log(`  Status: ${existing.status}`);
    console.log(`  Questions: ${existing.questions.length}`);

    // Make sure it's published
    if (existing.status !== 'published') {
      await prisma.dailySet.update({
        where: { id: existing.id },
        data: { status: 'published' },
      });
      console.log('  → Updated status to published');
    }
    return;
  }

  // Get approved questions
  const questions = await prisma.question.findMany({
    where: { status: 'approved' },
    take: 15,
    orderBy: { createdAt: 'asc' },
  });

  if (questions.length === 0) {
    console.error('No approved questions found! Run seed first.');
    process.exit(1);
  }

  console.log(`Found ${questions.length} approved questions`);

  // Create daily set
  const dailySet = await prisma.dailySet.create({
    data: {
      date: today,
      theme: 'Факты и мифы',
      themeEn: 'Facts and Myths',
      status: 'published',
      questions: {
        create: questions.map((q, i) => ({
          questionId: q.id,
          sortOrder: i + 1,
        })),
      },
    },
    include: { questions: true },
  });

  console.log(`Created daily set for ${today.toISOString().split('T')[0]}`);
  console.log(`  ID: ${dailySet.id}`);
  console.log(`  Theme: ${dailySet.theme}`);
  console.log(`  Status: ${dailySet.status}`);
  console.log(`  Questions: ${dailySet.questions.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
