import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const categories = [
  { name: 'Наука', nameEn: 'Science', slug: 'science', icon: 'flask', sortOrder: 1 },
  { name: 'История', nameEn: 'History', slug: 'history', icon: 'scroll', sortOrder: 2 },
  { name: 'География', nameEn: 'Geography', slug: 'geography', icon: 'globe', sortOrder: 3 },
  { name: 'Языки', nameEn: 'Languages', slug: 'languages', icon: 'book', sortOrder: 4 },
  { name: 'Природа', nameEn: 'Nature', slug: 'nature', icon: 'leaf', sortOrder: 5 },
  { name: 'Космос', nameEn: 'Space', slug: 'space', icon: 'rocket', sortOrder: 6 },
  { name: 'Культура', nameEn: 'Culture', slug: 'culture', icon: 'palette', sortOrder: 7 },
  { name: 'Технологии', nameEn: 'Technology', slug: 'technology', icon: 'cpu', sortOrder: 8 },
];

async function main() {
  console.log('Seeding database...');

  // Upsert categories
  for (const category of categories) {
    const created = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        nameEn: category.nameEn,
        icon: category.icon,
        sortOrder: category.sortOrder,
      },
      create: category,
    });
    console.log(`Category: ${created.nameEn} (${created.name})`);
  }

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

  // Seed example statements (facts and fakes)
  const scienceCategory = await prisma.category.findUnique({ where: { slug: 'science' } });
  const historyCategory = await prisma.category.findUnique({ where: { slug: 'history' } });
  const spaceCategory = await prisma.category.findUnique({ where: { slug: 'space' } });
  const natureCategory = await prisma.category.findUnique({ where: { slug: 'nature' } });
  const technologyCategory = await prisma.category.findUnique({ where: { slug: 'technology' } });

  if (scienceCategory && historyCategory && spaceCategory && natureCategory && technologyCategory) {
    const statements = [
      {
        statement: 'Великая Китайская стена видна из космоса невооружённым глазом',
        isTrue: false,
        explanation: 'Это распространённый миф. Астронавты подтвердили, что Великую Китайскую стену невозможно увидеть из космоса без специального оборудования. Она слишком узкая.',
        source: 'NASA',
        sourceUrl: 'https://www.nasa.gov/vision/space/workinginspace/great_wall.html',
        categoryId: spaceCategory.id,
        difficulty: 2,
        language: 'ru',
        status: 'approved',
      },
      {
        statement: 'Осьминоги имеют три сердца',
        isTrue: true,
        explanation: 'У осьминога действительно три сердца: два жаберных перекачивают кровь через жабры, а одно системное — по всему телу.',
        source: 'Smithsonian Ocean',
        sourceUrl: 'https://ocean.si.edu/ocean-life/invertebrates/octopus',
        categoryId: natureCategory.id,
        difficulty: 2,
        language: 'ru',
        status: 'approved',
      },
      {
        statement: 'Молния никогда не бьёт в одно и то же место дважды',
        isTrue: false,
        explanation: 'Молния часто бьёт в одно и то же место. Например, в Эмпайр-стейт-билдинг молния попадает около 20–25 раз в год.',
        source: 'NOAA',
        sourceUrl: 'https://www.weather.gov/safety/lightning-myths',
        categoryId: scienceCategory.id,
        difficulty: 1,
        language: 'ru',
        status: 'approved',
      },
      {
        statement: 'Банан — это ягода, а клубника — нет',
        isTrue: true,
        explanation: 'С ботанической точки зрения банан является ягодой (плод из одной завязи), а клубника — ложной ягодой (разросшееся цветоложе).',
        source: 'Stanford Magazine',
        categoryId: natureCategory.id,
        difficulty: 3,
        language: 'ru',
        status: 'approved',
      },
      {
        statement: 'Наполеон был ниже среднего роста для своего времени',
        isTrue: false,
        explanation: 'Рост Наполеона составлял около 170 см, что было выше среднего для француза начала XIX века. Миф возник из-за путаницы между французскими и английскими дюймами.',
        source: 'Encyclopaedia Britannica',
        categoryId: historyCategory.id,
        difficulty: 2,
        language: 'ru',
        status: 'approved',
      },
      {
        statement: 'Первый компьютерный баг был настоящим насекомым',
        isTrue: true,
        explanation: 'В 1947 году инженеры Гарварда нашли мотылька, застрявшего в реле компьютера Mark II. Его приклеили в журнал с подписью «First actual case of bug being found».',
        source: 'Smithsonian National Museum of American History',
        categoryId: technologyCategory.id,
        difficulty: 2,
        language: 'ru',
        status: 'approved',
      },
      {
        statement: 'Золотые рыбки имеют память всего 3 секунды',
        isTrue: false,
        explanation: 'Исследования показали, что золотые рыбки могут помнить информацию до 5 месяцев и способны обучаться выполнению трюков.',
        source: 'University of Plymouth',
        categoryId: natureCategory.id,
        difficulty: 1,
        language: 'ru',
        status: 'approved',
      },
      {
        statement: 'На Венере сутки длиннее, чем год',
        isTrue: true,
        explanation: 'Венера вращается вокруг своей оси за 243 земных дня, а оборот вокруг Солнца совершает за 225 земных дней.',
        source: 'NASA Solar System',
        sourceUrl: 'https://solarsystem.nasa.gov/planets/venus/overview/',
        categoryId: spaceCategory.id,
        difficulty: 3,
        language: 'ru',
        status: 'approved',
      },
      {
        statement: 'Эйфелева башня может стать на 15 см выше летом',
        isTrue: true,
        explanation: 'Из-за теплового расширения металла в жаркую погоду Эйфелева башня может вырасти на 15–17 см.',
        source: 'Tour Eiffel Official',
        sourceUrl: 'https://www.toureiffel.paris',
        categoryId: scienceCategory.id,
        difficulty: 3,
        language: 'ru',
        status: 'approved',
      },
      {
        statement: 'Люди используют только 10% своего мозга',
        isTrue: false,
        explanation: 'Нейровизуализация показывает, что мы используем практически все области мозга, и большая часть мозга активна почти всё время.',
        source: 'Scientific American',
        categoryId: scienceCategory.id,
        difficulty: 1,
        language: 'ru',
        status: 'approved',
      },
      {
        statement: 'Мёд никогда не портится',
        isTrue: true,
        explanation: 'Благодаря низкому содержанию влаги и высокой кислотности, мёд может храниться тысячелетиями. Археологи находили съедобный мёд в египетских гробницах.',
        source: 'Smithsonian Magazine',
        categoryId: scienceCategory.id,
        difficulty: 2,
        language: 'ru',
        status: 'approved',
      },
      {
        statement: 'В Средневековье люди думали, что Земля плоская',
        isTrue: false,
        explanation: 'Образованные люди со времён Древней Греции знали, что Земля круглая. Миф о «плоской Земле в Средневековье» появился в XIX веке.',
        source: 'American Historical Association',
        categoryId: historyCategory.id,
        difficulty: 2,
        language: 'ru',
        status: 'approved',
      },
      {
        statement: 'Кислород бесцветен, но в жидком состоянии он голубого цвета',
        isTrue: true,
        explanation: 'Жидкий кислород имеет бледно-голубой цвет из-за поглощения красного света молекулами O₂.',
        source: 'Royal Society of Chemistry',
        categoryId: scienceCategory.id,
        difficulty: 4,
        language: 'ru',
        status: 'approved',
      },
      {
        statement: 'Чарльз Дарвин был первым, кто предложил теорию эволюции',
        isTrue: false,
        explanation: 'До Дарвина теории эволюции предлагали Жан-Батист Ламарк, Эразм Дарвин (дед Чарльза) и другие. Дарвин предложил механизм — естественный отбор.',
        source: 'University of Cambridge',
        categoryId: scienceCategory.id,
        difficulty: 3,
        language: 'ru',
        status: 'approved',
      },
      {
        statement: 'WiFi расшифровывается как Wireless Fidelity',
        isTrue: false,
        explanation: 'WiFi — это торговая марка, которая ничего не расшифровывает. Термин был придуман маркетинговой компанией Interbrand по аналогии с Hi-Fi.',
        source: 'Wi-Fi Alliance',
        categoryId: technologyCategory.id,
        difficulty: 3,
        language: 'ru',
        status: 'approved',
      },
    ];

    for (const stmt of statements) {
      const existing = await prisma.question.findFirst({
        where: { statement: stmt.statement },
      });
      if (!existing) {
        await prisma.question.create({ data: stmt });
        console.log(`Statement: "${stmt.statement.substring(0, 50)}..." (${stmt.isTrue ? 'ФАКТ' : 'ФЕЙК'})`);
      }
    }
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
