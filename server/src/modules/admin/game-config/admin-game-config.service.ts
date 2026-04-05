import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateStreakBonusDto } from './dto/update-streak-bonus.dto';

@Injectable()
export class AdminGameConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async getStreakBonus() {
    const flag = await this.prisma.featureFlag.findUnique({
      where: { key: 'streak_bonus' },
    });

    if (!flag) {
      return { enabled: false, tiers: [] };
    }

    const payload = flag.payload as Record<string, unknown> | null;
    return {
      enabled: flag.isEnabled,
      tiers: (payload?.tiers as Array<{ minStreak: number; bonusPercent: number }>) ?? [],
    };
  }

  async updateStreakBonus(dto: UpdateStreakBonusDto) {
    const payload = { tiers: dto.tiers } as unknown as Prisma.InputJsonValue;

    await this.prisma.featureFlag.upsert({
      where: { key: 'streak_bonus' },
      update: {
        isEnabled: dto.enabled,
        payload,
      },
      create: {
        key: 'streak_bonus',
        name: 'Streak Bonus',
        description: 'Streak bonus multiplier tiers for score calculation',
        isEnabled: dto.enabled,
        payload,
      },
    });

    return this.getStreakBonus();
  }
}
