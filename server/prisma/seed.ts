import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default admin user
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.warn(
      'ADMIN_EMAIL or ADMIN_PASSWORD not set in environment. Skipping admin user creation.',
    );
  } else {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

    const admin = await prisma.adminUser.upsert({
      where: { email: adminEmail },
      update: { passwordHash },
      create: {
        email: adminEmail,
        passwordHash,
      },
    });
    console.log(`Admin user: ${admin.email}`);
  }

  // Seed feature flags for ads
  const adsFeatureFlags = [
    {
      key: 'ads_enable',
      name: 'Реклама (глобальный)',
      description: 'Глобальное включение/отключение всей рекламы',
      isEnabled: true,
      payload: null,
    },
    {
      key: 'unity_ads',
      name: 'Unity Ads',
      description: 'Включить рекламу Unity для остальных стран',
      isEnabled: true,
      payload: null,
    },
    {
      key: 'ad_banner_home',
      name: 'Баннер: Главная',
      description: 'Баннер внизу главного экрана',
      isEnabled: true,
      payload: null,
    },
    {
      key: 'ad_banner_leaderboard',
      name: 'Баннер: Рейтинг',
      description: 'Баннер внизу экрана рейтинга',
      isEnabled: true,
      payload: null,
    },
    {
      key: 'ad_banner_profile',
      name: 'Баннер: Профиль',
      description: 'Баннер внизу экрана профиля',
      isEnabled: true,
      payload: null,
    },
    {
      key: 'ad_banner_category',
      name: 'Баннер: Категория',
      description: 'Баннер на экране информации о категории',
      isEnabled: true,
      payload: null,
    },
    {
      key: 'ad_banner_game',
      name: 'Баннер: Игра',
      description: 'Баннер внизу экрана игры',
      isEnabled: true,
      payload: null,
    },
    {
      key: 'ad_banner_results',
      name: 'Баннер: Результаты',
      description: 'Баннер на экране завершения игры',
      isEnabled: true,
      payload: null,
    },
    {
      key: 'ad_interstitial_game',
      name: 'Полноэкранная реклама',
      description: 'Полноэкранная реклама перед началом игры. Payload: { factsThreshold: number }',
      isEnabled: true,
      payload: { factsThreshold: 26 },
    },
    {
      key: 'ad_rewarded_video',
      name: 'Видео реклама (отключение рекламы)',
      description: 'Видео для отключения рекламы. Payload: { adFreeMinutes: number, requiredViews: number }',
      isEnabled: true,
      payload: { adFreeMinutes: 30, requiredViews: 2 },
    },
  ];

  for (const flag of adsFeatureFlags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: {},
      create: flag,
    });
    console.log(`Feature flag: ${flag.key}`);
  }

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
