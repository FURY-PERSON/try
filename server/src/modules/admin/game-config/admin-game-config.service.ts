import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateStreakBonusDto } from './dto/update-streak-bonus.dto';
import { UpdateDailyLoginRewardDto } from './dto/update-daily-login-reward.dto';

const DAILY_LOGIN_KEY = 'daily_login_reward';

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

  async getDailyLoginReward() {
    const flag = await this.prisma.featureFlag.findUnique({
      where: { key: DAILY_LOGIN_KEY },
    });

    if (!flag) {
      return {
        isEnabled: false,
        capShields: 10,
        capStreak: 10,
        rewards: [],
      };
    }

    const payload = (flag.payload as Record<string, unknown> | null) ?? {};
    const rawRewards = Array.isArray(payload.rewards) ? payload.rewards : [];
    const rewards = rawRewards
      .filter(
        (r): r is { day: number; shields: number; streak: number } =>
          typeof r === 'object' &&
          r !== null &&
          typeof (r as any).day === 'number' &&
          typeof (r as any).shields === 'number' &&
          typeof (r as any).streak === 'number',
      )
      .sort((a, b) => a.day - b.day);

    return {
      isEnabled: flag.isEnabled,
      capShields:
        typeof payload.capShields === 'number' ? payload.capShields : 10,
      capStreak:
        typeof payload.capStreak === 'number' ? payload.capStreak : 10,
      rewards,
    };
  }

  async updateDailyLoginReward(dto: UpdateDailyLoginRewardDto) {
    const sorted = [...dto.rewards].sort((a, b) => a.day - b.day);

    for (let i = 0; i < sorted.length; i++) {
      const entry = sorted[i];
      if (entry.day !== i + 1) {
        throw new BadRequestException(
          `Дни должны идти подряд начиная с 1 без пропусков (найден разрыв на дне ${entry.day})`,
        );
      }
      if (entry.shields > dto.capShields) {
        throw new BadRequestException(
          `День ${entry.day}: щиты (${entry.shields}) превышают capShields (${dto.capShields})`,
        );
      }
      if (entry.streak > dto.capStreak) {
        throw new BadRequestException(
          `День ${entry.day}: streak (${entry.streak}) превышает capStreak (${dto.capStreak})`,
        );
      }
    }

    const payload = {
      rewards: sorted,
      capShields: dto.capShields,
      capStreak: dto.capStreak,
    } as unknown as Prisma.InputJsonValue;

    await this.prisma.featureFlag.upsert({
      where: { key: DAILY_LOGIN_KEY },
      update: {
        isEnabled: dto.isEnabled,
        payload,
      },
      create: {
        key: DAILY_LOGIN_KEY,
        name: 'Ежедневный бонус за заход',
        description:
          'Прогрессия наград (щиты + подарок к игровому стрику) за каждодневный заход в приложение',
        isEnabled: dto.isEnabled,
        payload,
      },
    });

    return this.getDailyLoginReward();
  }
}
