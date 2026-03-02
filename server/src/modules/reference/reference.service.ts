import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

const FALLBACK_ADJECTIVES: Record<string, string[]> = {
  ru: [
    'Быстрый', 'Умный', 'Хитрый', 'Весёлый', 'Храбрый',
    'Ловкий', 'Мудрый', 'Дерзкий', 'Тихий', 'Яркий',
    'Смелый', 'Шустрый', 'Грозный', 'Нежный', 'Дикий',
    'Славный', 'Милый', 'Редкий', 'Гордый', 'Хмурый',
  ],
  en: [
    'Swift', 'Clever', 'Sly', 'Jolly', 'Brave',
    'Nimble', 'Wise', 'Bold', 'Quiet', 'Bright',
    'Daring', 'Hasty', 'Mighty', 'Gentle', 'Wild',
    'Noble', 'Lucky', 'Rare', 'Proud', 'Keen',
  ],
};

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

@Injectable()
export class ReferenceService {
  constructor(private readonly prisma: PrismaService) {}

  async getNicknameOptions(language: string = 'ru') {
    const [adjectives, animals, emojis] = await Promise.all([
      this.prisma.nicknameAdjective.findMany({
        where: { isActive: true },
      }),
      this.prisma.nicknameAnimal.findMany({
        where: { isActive: true },
      }),
      this.prisma.avatarEmoji.findMany({
        where: { isActive: true },
      }),
    ]);

    if (adjectives.length === 0 || animals.length === 0) {
      const animal = randomItem(FALLBACK_ANIMALS);
      const adjective = randomItem(FALLBACK_ADJECTIVES[language] ?? FALLBACK_ADJECTIVES.ru);
      const animalName = language === 'en' ? animal.en : animal.ru;
      return { placeholder: `${adjective} ${animalName}`, emoji: animal.emoji };
    }

    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const animal = animals[Math.floor(Math.random() * animals.length)];
    const adjText = language === 'en' ? adj.textEn : adj.textRu;
    const animalText = language === 'en' ? animal.textEn : animal.textRu;

    const randomEmoji = emojis.length > 0
      ? emojis[Math.floor(Math.random() * emojis.length)].emoji
      : animal.emoji;

    return {
      placeholder: `${adjText} ${animalText}`,
      emoji: randomEmoji,
    };
  }

  async getAvatarEmojis() {
    const emojis = await this.prisma.avatarEmoji.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
      select: { id: true, emoji: true, category: true },
    });

    // Group by category
    const grouped: Record<string, string[]> = {};
    for (const e of emojis) {
      if (!grouped[e.category]) grouped[e.category] = [];
      grouped[e.category].push(e.emoji);
    }

    return grouped;
  }
}
