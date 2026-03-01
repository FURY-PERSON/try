import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const nicknameAdjectives = [
  { textRu: 'Быстрый', textEn: 'Swift' },
  { textRu: 'Храбрый', textEn: 'Brave' },
  { textRu: 'Мудрый', textEn: 'Wise' },
  { textRu: 'Хитрый', textEn: 'Cunning' },
  { textRu: 'Весёлый', textEn: 'Cheerful' },
  { textRu: 'Тихий', textEn: 'Quiet' },
  { textRu: 'Яркий', textEn: 'Bright' },
  { textRu: 'Ловкий', textEn: 'Agile' },
  { textRu: 'Дерзкий', textEn: 'Bold' },
  { textRu: 'Сонный', textEn: 'Sleepy' },
  { textRu: 'Гордый', textEn: 'Proud' },
  { textRu: 'Шустрый', textEn: 'Nimble' },
  { textRu: 'Дикий', textEn: 'Wild' },
  { textRu: 'Ночной', textEn: 'Nocturnal' },
  { textRu: 'Полярный', textEn: 'Polar' },
  { textRu: 'Огненный', textEn: 'Fiery' },
  { textRu: 'Звёздный', textEn: 'Stellar' },
  { textRu: 'Тайный', textEn: 'Secret' },
  { textRu: 'Лунный', textEn: 'Lunar' },
  { textRu: 'Грозный', textEn: 'Mighty' },
];

const nicknameAnimals = [
  { textRu: 'Лис', textEn: 'Fox', emoji: '🦊' },
  { textRu: 'Волк', textEn: 'Wolf', emoji: '🐺' },
  { textRu: 'Медведь', textEn: 'Bear', emoji: '🐻' },
  { textRu: 'Сова', textEn: 'Owl', emoji: '🦉' },
  { textRu: 'Орёл', textEn: 'Eagle', emoji: '🦅' },
  { textRu: 'Тигр', textEn: 'Tiger', emoji: '🐯' },
  { textRu: 'Лев', textEn: 'Lion', emoji: '🦁' },
  { textRu: 'Панда', textEn: 'Panda', emoji: '🐼' },
  { textRu: 'Кот', textEn: 'Cat', emoji: '🐱' },
  { textRu: 'Пёс', textEn: 'Dog', emoji: '🐶' },
  { textRu: 'Дельфин', textEn: 'Dolphin', emoji: '🐬' },
  { textRu: 'Пингвин', textEn: 'Penguin', emoji: '🐧' },
  { textRu: 'Коала', textEn: 'Koala', emoji: '🐨' },
  { textRu: 'Единорог', textEn: 'Unicorn', emoji: '🦄' },
  { textRu: 'Дракон', textEn: 'Dragon', emoji: '🐉' },
  { textRu: 'Кролик', textEn: 'Rabbit', emoji: '🐰' },
  { textRu: 'Ёж', textEn: 'Hedgehog', emoji: '🦔' },
  { textRu: 'Хамелеон', textEn: 'Chameleon', emoji: '🦎' },
  { textRu: 'Фламинго', textEn: 'Flamingo', emoji: '🦩' },
  { textRu: 'Осьминог', textEn: 'Octopus', emoji: '🐙' },
];

const avatarEmojis = [
  // Animals
  { emoji: '🦊', category: 'animals' },
  { emoji: '🐱', category: 'animals' },
  { emoji: '🦉', category: 'animals' },
  { emoji: '🐺', category: 'animals' },
  { emoji: '🐻', category: 'animals' },
  { emoji: '🦅', category: 'animals' },
  { emoji: '🐼', category: 'animals' },
  { emoji: '🐯', category: 'animals' },
  { emoji: '🐬', category: 'animals' },
  { emoji: '🐧', category: 'animals' },
  { emoji: '🦎', category: 'animals' },
  { emoji: '🦄', category: 'animals' },
  { emoji: '🐉', category: 'animals' },
  { emoji: '🦔', category: 'animals' },
  { emoji: '🦁', category: 'animals' },
  { emoji: '🐰', category: 'animals' },
  { emoji: '🦒', category: 'animals' },
  { emoji: '🐙', category: 'animals' },
  { emoji: '🦩', category: 'animals' },
  { emoji: '🐨', category: 'animals' },
  // Faces
  { emoji: '😎', category: 'faces' },
  { emoji: '🤓', category: 'faces' },
  { emoji: '🧐', category: 'faces' },
  { emoji: '😈', category: 'faces' },
  { emoji: '👻', category: 'faces' },
  { emoji: '🤖', category: 'faces' },
  { emoji: '👽', category: 'faces' },
  { emoji: '🎃', category: 'faces' },
  // Nature
  { emoji: '🌸', category: 'nature' },
  { emoji: '🔥', category: 'nature' },
  { emoji: '⭐', category: 'nature' },
  { emoji: '🌈', category: 'nature' },
  { emoji: '❄️', category: 'nature' },
  { emoji: '🌊', category: 'nature' },
];

const categories = [
  { name: 'Наука', nameEn: 'Science', slug: 'science', icon: '🧪', sortOrder: 1 },
  { name: 'История', nameEn: 'History', slug: 'history', icon: '📜', sortOrder: 2 },
  { name: 'География', nameEn: 'Geography', slug: 'geography', icon: '🌍', sortOrder: 3 },
  { name: 'Языки', nameEn: 'Languages', slug: 'languages', icon: '📖', sortOrder: 4 },
  { name: 'Природа', nameEn: 'Nature', slug: 'nature', icon: '🌿', sortOrder: 5 },
  { name: 'Космос', nameEn: 'Space', slug: 'space', icon: '🚀', sortOrder: 6 },
  { name: 'Культура', nameEn: 'Culture', slug: 'culture', icon: '🎨', sortOrder: 7 },
  { name: 'Технологии', nameEn: 'Technology', slug: 'technology', icon: '💻', sortOrder: 8 },
  { name: 'Спорт', nameEn: 'Sport', slug: 'sport', icon: '🏆', color: '#FF9500', sortOrder: 9 },
  { name: 'Здоровье', nameEn: 'Health', slug: 'health', icon: '🏥', color: '#FF2D55', sortOrder: 10 },
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

  // Seed 200 questions from JSON (status: moderation — not approved)
  const questionsJsonPath = path.join(__dirname, 'seed-questions-200.json');
  if (fs.existsSync(questionsJsonPath)) {
    const questionsJson: Record<string, Array<{
      statement: string;
      isTrue: boolean;
      explanation: string;
      source: string;
      sourceUrl: string | null;
      language: string;
      difficulty: number;
    }>> = JSON.parse(fs.readFileSync(questionsJsonPath, 'utf-8'));

    const categorySlugMap: Record<string, string> = {
      'Наука': 'science',
      'История': 'history',
      'География': 'geography',
      'Языки': 'languages',
      'Природа': 'nature',
      'Космос': 'space',
      'Культура': 'culture',
      'Технологии': 'technology',
      'Спорт': 'sport',
      'Здоровье': 'health',
    };

    let seeded200 = 0;
    for (const [categoryName, questions] of Object.entries(questionsJson)) {
      const slug = categorySlugMap[categoryName];
      const category = slug ? await prisma.category.findUnique({ where: { slug } }) : null;

      for (const q of questions) {
        const existing = await prisma.question.findFirst({ where: { statement: q.statement } });
        if (!existing) {
          await prisma.question.create({
            data: {
              statement: q.statement,
              isTrue: q.isTrue,
              explanation: q.explanation,
              source: q.source ?? '',
              sourceUrl: q.sourceUrl ?? null,
              language: q.language ?? 'ru',
              difficulty: q.difficulty ?? 2,
              status: 'moderation',
              categoryId: category?.id ?? null,
            },
          });
          seeded200++;
        }
      }
    }
    console.log(`Questions from seed-questions-200.json: ${seeded200} added (status: moderation)`);
  }

  // Seed nickname adjectives
  for (const adj of nicknameAdjectives) {
    const existing = await prisma.nicknameAdjective.findFirst({
      where: { textRu: adj.textRu, textEn: adj.textEn },
    });
    if (!existing) {
      await prisma.nicknameAdjective.create({ data: adj });
    }
  }
  console.log(`Nickname adjectives: ${nicknameAdjectives.length} entries`);

  // Seed nickname animals
  for (const animal of nicknameAnimals) {
    const existing = await prisma.nicknameAnimal.findFirst({
      where: { textRu: animal.textRu, textEn: animal.textEn },
    });
    if (!existing) {
      await prisma.nicknameAnimal.create({ data: animal });
    }
  }
  console.log(`Nickname animals: ${nicknameAnimals.length} entries`);

  // Seed avatar emojis
  for (const ae of avatarEmojis) {
    const existing = await prisma.avatarEmoji.findFirst({
      where: { emoji: ae.emoji },
    });
    if (!existing) {
      await prisma.avatarEmoji.create({ data: ae });
    }
  }
  console.log(`Avatar emojis: ${avatarEmojis.length} entries`);

  // Seed collections (questions are standalone CollectionItems, not from the shared Question pool)
  const scienceCollectionExists = await prisma.collection.findFirst({ where: { title: 'Удивительная наука' } });
  if (!scienceCollectionExists) {
    await prisma.collection.create({
      data: {
        title: 'Удивительная наука',
        titleEn: 'Amazing Science',
        description: 'Факты и мифы из мира науки, которые вас удивят',
        descriptionEn: 'Science facts and myths that will surprise you',
        icon: '🔬',
        type: 'featured',
        status: 'draft',
        sortOrder: 1,
        questions: {
          create: [
            { statement: 'Молния никогда не ударяет в одно место дважды', isTrue: false, explanation: 'Молния часто ударяет в одно место несколько раз — особенно в высокие объекты вроде башен и деревьев.', source: '', difficulty: 2, sortOrder: 1 },
            { statement: 'Стекло — это очень медленно текущая жидкость', isTrue: false, explanation: 'Стекло является аморфным твёрдым телом. Неравномерная толщина старинных стёкол — результат технологии производства, а не течения.', source: '', difficulty: 3, sortOrder: 2 },
            { statement: 'Вода проводит электричество', isTrue: false, explanation: 'Чистая дистиллированная вода — диэлектрик. Электрический ток проводят растворённые в воде соли и минералы.', source: '', difficulty: 3, sortOrder: 3 },
          ],
        },
      },
    });
    console.log('Collection: "Удивительная наука" created (draft, fill via admin panel)');
  }

  const geoCollectionExists = await prisma.collection.findFirst({ where: { title: 'Вокруг света' } });
  if (!geoCollectionExists) {
    await prisma.collection.create({
      data: {
        title: 'Вокруг света',
        titleEn: 'Around the World',
        description: 'Проверьте свои знания о странах, городах и культурах',
        descriptionEn: 'Test your knowledge about countries, cities and cultures',
        icon: '🌍',
        type: 'featured',
        status: 'draft',
        sortOrder: 2,
        questions: {
          create: [
            { statement: 'Австралия — самый маленький континент', isTrue: true, explanation: 'Австралия является одновременно страной и континентом, и это наименьший континент на Земле.', source: '', difficulty: 1, sortOrder: 1 },
            { statement: 'Великая Китайская стена видна из космоса невооружённым глазом', isTrue: false, explanation: 'Стена слишком узкая (~5–9 метров), чтобы её можно было различить с орбиты. Этот миф опроверг даже первый китайский космонавт Ян Ливэй.', source: '', difficulty: 2, sortOrder: 2 },
            { statement: 'Египетские пирамиды строили рабы', isTrue: false, explanation: 'Современные археологические данные показывают, что строители пирамид были квалифицированными оплачиваемыми рабочими, получавшими еду и медицинскую помощь.', source: '', difficulty: 3, sortOrder: 3 },
          ],
        },
      },
    });
    console.log('Collection: "Вокруг света" created (draft, fill via admin panel)');
  }

  // Seed test users, daily set, and leaderboard entries for testing
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingDailySet = await prisma.dailySet.findUnique({ where: { date: today } });
  let dailySet: any = existingDailySet;

  if (!dailySet) {
    // Create a daily set for today with available questions
    const allApproved = await prisma.question.findMany({
      where: { status: 'approved' },
      take: 15,
      select: { id: true },
    });

    if (allApproved.length >= 5) {
      dailySet = await prisma.dailySet.create({
        data: {
          date: today,
          theme: 'Микс дня',
          themeEn: 'Daily Mix',
          status: 'published',
        },
      });

      for (let i = 0; i < allApproved.length; i++) {
        await prisma.dailySetQuestion.create({
          data: {
            dailySetId: dailySet.id,
            questionId: allApproved[i].id,
            sortOrder: i + 1,
          },
        });
      }
      console.log(`Daily set created for today with ${allApproved.length} questions`);
    }
  }

  // Re-fetch daily set with questions for history records
  if (dailySet) {
    dailySet = await prisma.dailySet.findUnique({
      where: { id: dailySet.id },
      include: { questions: { orderBy: { sortOrder: 'asc' } } },
    }) as any;
  }

  if (dailySet) {
    // Create test users with leaderboard entries
    // Score formula: 1 + floor(streak / 5) per correct answer
    const testUsers = [
      { deviceId: 'seed-device-alpha', nickname: 'MudrayaSova', avatarEmoji: '🦉', bestStreak: 12, currentStreak: 5, bestAnswerStreak: 18, currentAnswerStreak: 7, correct: 12, time: 120 },
      { deviceId: 'seed-device-beta', nickname: 'BystryLis', avatarEmoji: '🦊', bestStreak: 8, currentStreak: 3, bestAnswerStreak: 12, currentAnswerStreak: 4, correct: 10, time: 135 },
      { deviceId: 'seed-device-gamma', nickname: 'KhrabryVolk', avatarEmoji: '🐺', bestStreak: 15, currentStreak: 0, bestAnswerStreak: 25, currentAnswerStreak: 0, correct: 9, time: 150 },
      { deviceId: 'seed-device-delta', nickname: 'TikhiyMedved', avatarEmoji: '🐻', bestStreak: 6, currentStreak: 6, bestAnswerStreak: 9, currentAnswerStreak: 9, correct: 8, time: 165 },
      { deviceId: 'seed-device-epsilon', nickname: 'YarkiyOryol', avatarEmoji: '🦅', bestStreak: 20, currentStreak: 10, bestAnswerStreak: 32, currentAnswerStreak: 15, correct: 14, time: 100 },
    ];

    // Get daily set questions for history records
    const dsQuestions = dailySet.questions || [];

    for (const tu of testUsers) {
      // Calculate score using new formula: simulate streak-based scoring
      // For seed, assume all correct answers are consecutive (best case)
      let totalScore = 0;
      const totalCorrect = tu.correct * 5;
      for (let i = 1; i <= totalCorrect; i++) {
        totalScore += 1 + Math.floor(i / 5);
      }

      const user = await prisma.user.upsert({
        where: { deviceId: tu.deviceId },
        update: {
          bestStreak: tu.bestStreak,
          currentStreak: tu.currentStreak,
          bestAnswerStreak: tu.bestAnswerStreak,
          currentAnswerStreak: tu.currentAnswerStreak,
          totalGamesPlayed: 5,
          totalCorrectAnswers: totalCorrect,
          totalScore,
        },
        create: {
          deviceId: tu.deviceId,
          nickname: tu.nickname,
          avatarEmoji: tu.avatarEmoji,
          bestStreak: tu.bestStreak,
          currentStreak: tu.currentStreak,
          bestAnswerStreak: tu.bestAnswerStreak,
          currentAnswerStreak: tu.currentAnswerStreak,
          totalGamesPlayed: 5,
          totalCorrectAnswers: totalCorrect,
          totalScore,
        },
      });

      // Create leaderboard entry for today's daily set
      const dsScore = tu.correct; // 1 point per correct (no streak bonus in daily set seed)
      await prisma.leaderboardEntry.upsert({
        where: {
          userId_dailySetId: {
            userId: user.id,
            dailySetId: dailySet.id,
          },
        },
        update: {
          score: dsScore,
          correctAnswers: tu.correct,
          totalTimeSeconds: tu.time,
        },
        create: {
          userId: user.id,
          dailySetId: dailySet.id,
          score: dsScore,
          correctAnswers: tu.correct,
          totalTimeSeconds: tu.time,
        },
      });

      // Create UserQuestionHistory records from daily set questions
      if (dsQuestions.length > 0) {
        const historyRecords = dsQuestions.slice(0, 15).map((dsq: any, idx: number) => {
          const isCorrect = idx < tu.correct;
          const streak = isCorrect ? idx + 1 : 0;
          const answerScore = isCorrect ? 1 + Math.floor(streak / 5) : 0;
          return {
            userId: user.id,
            questionId: dsq.questionId,
            result: isCorrect ? 'correct' : 'incorrect',
            timeSpentSeconds: Math.floor(tu.time / 15),
            score: answerScore,
          };
        });
        // Delete old history for this user to avoid duplicates on re-seed
        await prisma.userQuestionHistory.deleteMany({ where: { userId: user.id } });
        await prisma.userQuestionHistory.createMany({ data: historyRecords });
      }

      console.log(`Test user: ${tu.nickname} (streak: ${tu.bestAnswerStreak}, correct: ${totalCorrect}, score: ${totalScore})`);
    }
    console.log('Leaderboard entries seeded for today\'s daily set');
  }

  // Feature flags
  const defaultFlags = [
    {
      key: 'show_ads',
      name: 'Показ рекламы',
      description: 'Глобальное управление показом рекламы в приложении',
      isEnabled: true,
    },
    {
      key: 'maintenance_mode',
      name: 'Режим обслуживания',
      description: 'Показывает заглушку вместо контента во время технических работ',
      isEnabled: false,
    },
  ];

  for (const flag of defaultFlags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: {},
      create: flag,
    });
  }
  console.log(`Feature flags seeded: ${defaultFlags.length}`);

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
