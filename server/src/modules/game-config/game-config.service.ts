import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

export interface StreakBonusTier {
  minStreak: number;
  bonusPercent: number;
}

interface StreakBonusPayload {
  tiers: StreakBonusTier[];
}

@Injectable()
export class GameConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async getStreakBonusConfig(): Promise<{
    enabled: boolean;
    tiers: StreakBonusTier[];
  }> {
    const flag = await this.prisma.featureFlag.findUnique({
      where: { key: 'streak_bonus' },
    });

    if (!flag || !flag.isEnabled) {
      return { enabled: false, tiers: [] };
    }

    const payload = flag.payload as unknown as StreakBonusPayload | null;
    if (!payload || !Array.isArray(payload.tiers)) {
      return { enabled: false, tiers: [] };
    }

    return {
      enabled: true,
      tiers: payload.tiers.sort((a, b) => a.minStreak - b.minStreak),
    };
  }

  async getStreakBonusPercent(currentStreak: number): Promise<number> {
    const config = await this.getStreakBonusConfig();

    if (!config.enabled || config.tiers.length === 0) {
      return 0;
    }

    let bonusPercent = 0;
    for (const tier of config.tiers) {
      if (currentStreak >= tier.minStreak) {
        bonusPercent = tier.bonusPercent;
      }
    }

    return bonusPercent;
  }
}
