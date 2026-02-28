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

// In-memory cache for nickname data (loaded once, refreshed every hour)
interface NicknameCache {
  adjectives: { textRu: string; textEn: string }[];
  animals: { textRu: string; textEn: string; emoji: string }[];
  loadedAt: number;
}

let nicknameCache: NicknameCache | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

async function loadNicknameData(prisma: PrismaService): Promise<NicknameCache> {
  const now = Date.now();
  if (nicknameCache && now - nicknameCache.loadedAt < CACHE_TTL_MS) {
    return nicknameCache;
  }

  const [adjectives, animals] = await Promise.all([
    prisma.nicknameAdjective.findMany({ where: { isActive: true } }),
    prisma.nicknameAnimal.findMany({ where: { isActive: true } }),
  ]);

  nicknameCache = { adjectives, animals, loadedAt: now };
  return nicknameCache;
}

function generateNicknameFromData(
  adjectives: { textRu: string; textEn: string }[],
  animals: { textRu: string; textEn: string; emoji: string }[],
  language: string,
): { nickname: string; avatarEmoji: string } {
  if (adjectives.length === 0 || animals.length === 0) {
    // Fallback to built-in data
    const animal = randomItem(FALLBACK_ANIMALS);
    const adjective = language === 'en'
      ? randomItem(FALLBACK_ADJECTIVES_EN)
      : randomItem(FALLBACK_ADJECTIVES_RU);
    const animalName = language === 'en' ? animal.en : animal.ru;
    return { nickname: `${adjective} ${animalName}`, avatarEmoji: animal.emoji };
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
  // Load data once (cached)
  const data = await loadNicknameData(prisma);
  const maxAttempts = 10;

  // Generate all candidates at once
  const candidates: { nickname: string; avatarEmoji: string }[] = [];
  for (let i = 0; i < maxAttempts; i++) {
    const { nickname, avatarEmoji } = generateNicknameFromData(
      data.adjectives,
      data.animals,
      language,
    );
    const candidate = i === 0 ? nickname : `${nickname} ${Math.floor(10 + Math.random() * 90)}`;
    candidates.push({ nickname: candidate, avatarEmoji });
  }

  // Batch check uniqueness — 1 query instead of up to 10
  const existingNicknames = await prisma.user.findMany({
    where: { nickname: { in: candidates.map((c) => c.nickname) } },
    select: { nickname: true },
  });
  const takenSet = new Set(existingNicknames.map((u) => u.nickname));

  for (const candidate of candidates) {
    if (!takenSet.has(candidate.nickname)) {
      return candidate;
    }
  }

  // Fallback: add timestamp suffix (guaranteed unique)
  const { nickname, avatarEmoji } = generateNicknameFromData(
    data.adjectives,
    data.animals,
    language,
  );
  return {
    nickname: `${nickname} ${Date.now() % 10000}`,
    avatarEmoji,
  };
}
