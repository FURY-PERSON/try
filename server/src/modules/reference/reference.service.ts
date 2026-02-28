import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

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
      return { placeholder: language === 'en' ? 'Swift Fox' : 'Быстрый Лис', emoji: '🦊' };
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
