import { Prisma, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DAILY_LOGIN_CAP_SHIELDS = 10;
const DAILY_LOGIN_CAP_STREAK = 10;
const DAILY_LOGIN_MAX_DAY = 19;

function buildDefaultDailyLoginRewards() {
  const rewards: Array<{ day: number; shields: number; streak: number }> = [];
  for (let d = 1; d <= DAILY_LOGIN_MAX_DAY; d++) {
    rewards.push({
      day: d,
      shields: Math.min(Math.ceil(d / 2), DAILY_LOGIN_CAP_SHIELDS),
      streak: Math.min(Math.floor(d / 2), DAILY_LOGIN_CAP_STREAK),
    });
  }
  return rewards;
}

async function seedDailyLoginRewardFlag() {
  const payload = {
    rewards: buildDefaultDailyLoginRewards(),
    capShields: DAILY_LOGIN_CAP_SHIELDS,
    capStreak: DAILY_LOGIN_CAP_STREAK,
  } as unknown as Prisma.InputJsonValue;

  await prisma.featureFlag.upsert({
    where: { key: 'daily_login_reward' },
    update: {},
    create: {
      key: 'daily_login_reward',
      name: 'Ежедневный бонус за заход',
      description:
        'Прогрессия наград (щиты + подарок к игровому стрику) за каждодневный заход в приложение',
      isEnabled: true,
      payload,
    },
  });
  console.log('Feature flag "daily_login_reward" seeded.');
}

async function main() {
  console.log('Seeding database...');

  await seedDailyLoginRewardFlag();

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.warn('ADMIN_EMAIL or ADMIN_PASSWORD not set. Skipping admin user creation.');
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: { email: adminEmail, passwordHash },
  });

  console.log(`Admin user: ${admin.email}`);
  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
