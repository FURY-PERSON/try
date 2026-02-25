import { PrismaService } from '@/prisma/prisma.service';

const FALLBACK_ADJECTIVES_RU = [
  'Быстрый', 'Умный', 'Хитрый', 'Весёлый', 'Храбрый',
  'Ловкий', 'Мудрый', 'Дерзкий', 'Тихий', 'Яркий',
  'Смелый', 'Шустрый', 'Грозный', 'Нежный', 'Дикий',
  'Славный', 'Милый', 'Редкий', 'Гордый', 'Хмурый',
];

const FALLBACK_ADJECTIVES_EN = [
  'Swift', 'Clever', 'Sly', 'Jolly', 'Brave',
  'Nimble', 'Wise', 'Bold', 'Quiet', 'Bright',
  'Daring', 'Hasty', 'Mighty', 'Gentle', 'Wild',
  'Noble', 'Lucky', 'Rare', 'Proud', 'Keen',
];

const FALLBACK_ANIMALS: Array<{ ru: string; en: string; emoji: string }> = [
  { ru: 'Лис', en: 'Fox', emoji: '🦊' },
  { ru: 'Кот', en: 'Cat', emoji: '🐱' },
  { ru: 'Сова', en: 'Owl', emoji: '🦉' },
  { ru: 'Волк', en: 'Wolf', emoji: '🐺' },
  { ru: 'Медведь', en: 'Bear', emoji: '🐻' },
  { ru: 'Орёл', en: 'Eagle', emoji: '🦅' },
  { ru: 'Панда', en: 'Panda', emoji: '🐼' },
  { ru: 'Тигр', en: 'Tiger', emoji: '🐯' },
  { ru: 'Дельфин', en: 'Dolphin', emoji: '🐬' },
  { ru: 'Пингвин', en: 'Penguin', emoji: '🐧' },
  { ru: 'Хамелеон', en: 'Chameleon', emoji: '🦎' },
  { ru: 'Единорог', en: 'Unicorn', emoji: '🦄' },
  { ru: 'Дракон', en: 'Dragon', emoji: '🐉' },
  { ru: 'Ёж', en: 'Hedgehog', emoji: '🦔' },
  { ru: 'Лев', en: 'Lion', emoji: '🦁' },
  { ru: 'Кролик', en: 'Rabbit', emoji: '🐰' },
  { ru: 'Жираф', en: 'Giraffe', emoji: '🦒' },
  { ru: 'Осьминог', en: 'Octopus', emoji: '🐙' },
  { ru: 'Фламинго', en: 'Flamingo', emoji: '🦩' },
  { ru: 'Коала', en: 'Koala', emoji: '🐨' },
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateNicknameFromFallback(language: string = 'ru'): {
  nickname: string;
  avatarEmoji: string;
} {
  const animal = randomItem(FALLBACK_ANIMALS);
  const adjective =
    language === 'en' ? randomItem(FALLBACK_ADJECTIVES_EN) : randomItem(FALLBACK_ADJECTIVES_RU);
  const animalName = language === 'en' ? animal.en : animal.ru;

  return {
    nickname: `${adjective} ${animalName}`,
    avatarEmoji: animal.emoji,
  };
}

export async function generateNickname(
  prisma: PrismaService,
  language: string = 'ru',
): Promise<{ nickname: string; avatarEmoji: string }> {
  const adjectives = await prisma.nicknameAdjective.findMany({ where: { isActive: true } });
  const animals = await prisma.nicknameAnimal.findMany({ where: { isActive: true } });

  if (adjectives.length === 0 || animals.length === 0) {
    return generateNicknameFromFallback(language);
  }

  const adj = randomItem(adjectives);
  const animal = randomItem(animals);
  const adjText = language === 'en' ? adj.textEn : adj.textRu;
  const animalText = language === 'en' ? animal.textEn : animal.textRu;

  return {
    nickname: `${adjText} ${animalText}`,
    avatarEmoji: animal.emoji,
  };
}

export async function generateUniqueNickname(
  prisma: PrismaService,
  language: string = 'ru',
): Promise<{ nickname: string; avatarEmoji: string }> {
  const maxAttempts = 10;

  for (let i = 0; i < maxAttempts; i++) {
    const { nickname, avatarEmoji } = await generateNickname(prisma, language);
    const candidate = i === 0 ? nickname : `${nickname} ${Math.floor(10 + Math.random() * 90)}`;

    const existing = await prisma.user.findUnique({
      where: { nickname: candidate },
    });

    if (!existing) {
      return { nickname: candidate, avatarEmoji };
    }
  }

  // Fallback: add timestamp suffix
  const { nickname, avatarEmoji } = await generateNickname(prisma, language);
  return {
    nickname: `${nickname} ${Date.now() % 10000}`,
    avatarEmoji,
  };
}
