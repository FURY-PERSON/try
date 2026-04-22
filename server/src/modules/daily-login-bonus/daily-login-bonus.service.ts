import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { DailyLoginResponseDto } from './dto/daily-login-response.dto';
import { DailyLoginStatusResponseDto } from './dto/daily-login-status-response.dto';

export interface DailyLoginRewardEntry {
  day: number;
  shields: number;
  streak: number;
}

export interface DailyLoginConfig {
  isEnabled: boolean;
  rewards: DailyLoginRewardEntry[];
  capShields: number;
  capStreak: number;
}

const DEFAULT_CAP_SHIELDS = 10;
const DEFAULT_CAP_STREAK = 10;

@Injectable()
export class DailyLoginBonusService {
  private readonly logger = new Logger(DailyLoginBonusService.name);

  constructor(private readonly prisma: PrismaService) {}

  async claim(userId: string, localDate: string): Promise<DailyLoginResponseDto> {
    const today = parseLocalDate(localDate);

    const config = await this.getConfig();

    if (!config.isEnabled) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { shields: true, currentStreak: true, loginStreak: true },
      });
      return {
        claimed: false,
        disabled: true,
        dayInStreak: user?.loginStreak ?? 0,
        loginStreak: user?.loginStreak ?? 0,
        rewardToday: { shields: 0, streak: 0 },
        rewardTomorrow: { shields: 0, streak: 0 },
        shields: user?.shields ?? 0,
        currentStreak: user?.currentStreak ?? 0,
      };
    }

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          shields: true,
          currentStreak: true,
          loginStreak: true,
          bestLoginStreak: true,
          lastLoginDate: true,
        },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const lastLogin = user.lastLoginDate;
      let newLoginStreak: number;
      let alreadyClaimed = false;

      if (lastLogin && sameDay(lastLogin, today)) {
        alreadyClaimed = true;
        newLoginStreak = user.loginStreak || 1;
      } else if (lastLogin && isConsecutiveDay(lastLogin, today)) {
        newLoginStreak = user.loginStreak + 1;
      } else {
        newLoginStreak = 1;
      }

      const rewardToday = lookupReward(config, newLoginStreak);
      const rewardTomorrow = lookupReward(config, newLoginStreak + 1);

      if (alreadyClaimed) {
        return {
          claimed: false,
          disabled: false,
          dayInStreak: newLoginStreak,
          loginStreak: newLoginStreak,
          rewardToday,
          rewardTomorrow,
          shields: user.shields,
          currentStreak: user.currentStreak,
        };
      }

      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          shields: { increment: rewardToday.shields },
          currentStreak: { increment: rewardToday.streak },
          loginStreak: newLoginStreak,
          bestLoginStreak: Math.max(user.bestLoginStreak, newLoginStreak),
          lastLoginDate: today,
          lastLoginBonusAt: new Date(),
        },
        select: { shields: true, currentStreak: true },
      });

      return {
        claimed: true,
        disabled: false,
        dayInStreak: newLoginStreak,
        loginStreak: newLoginStreak,
        rewardToday,
        rewardTomorrow,
        shields: updated.shields,
        currentStreak: updated.currentStreak,
      };
    });
  }

  async getStatus(
    userId: string,
    localDate: string,
  ): Promise<DailyLoginStatusResponseDto> {
    const today = parseLocalDate(localDate);
    const config = await this.getConfig();

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        loginStreak: true,
        bestLoginStreak: true,
        lastLoginDate: true,
      },
    });

    const loginStreak = user?.loginStreak ?? 0;
    const bestLoginStreak = user?.bestLoginStreak ?? 0;
    const lastLogin = user?.lastLoginDate ?? null;
    const claimedToday = lastLogin ? sameDay(lastLogin, today) : false;

    // "next" = день, который получит в следующий claim
    // - если сегодня уже claimed — следующий claim будет завтра, day = streak + 1
    // - если не claimed и последний заход был вчера — сегодня получит day = streak + 1
    // - иначе (пропуск или первый раз) — получит day = 1
    let nextDay: number;
    if (claimedToday) {
      nextDay = loginStreak + 1;
    } else if (lastLogin && isConsecutiveDay(lastLogin, today)) {
      nextDay = loginStreak + 1;
    } else {
      nextDay = 1;
    }

    const progression = (
      config.rewards.length > 0
        ? config.rewards
        : buildFallbackRewards(config.capShields, config.capStreak)
    ).map((r) => ({
      day: r.day,
      shields: Math.min(r.shields, config.capShields),
      streak: Math.min(r.streak, config.capStreak),
    }));

    const today_ = claimedToday
      ? { day: loginStreak, ...lookupReward(config, loginStreak) }
      : null;
    const next = { day: nextDay, ...lookupReward(config, nextDay) };

    return {
      isEnabled: config.isEnabled,
      loginStreak,
      bestLoginStreak,
      claimedToday,
      today: today_,
      next,
      progression,
      capShields: config.capShields,
      capStreak: config.capStreak,
    };
  }

  async getConfig(): Promise<DailyLoginConfig> {
    const flag = await this.prisma.featureFlag.findUnique({
      where: { key: 'daily_login_reward' },
    });

    if (!flag) {
      return {
        isEnabled: false,
        rewards: [],
        capShields: DEFAULT_CAP_SHIELDS,
        capStreak: DEFAULT_CAP_STREAK,
      };
    }

    const payload = (flag.payload as Record<string, unknown> | null) ?? {};
    const rawRewards = Array.isArray(payload.rewards) ? payload.rewards : [];
    const rewards: DailyLoginRewardEntry[] = rawRewards
      .filter(
        (r): r is DailyLoginRewardEntry =>
          typeof r === 'object' &&
          r !== null &&
          typeof (r as any).day === 'number' &&
          typeof (r as any).shields === 'number' &&
          typeof (r as any).streak === 'number',
      )
      .sort((a, b) => a.day - b.day);

    const capShields =
      typeof payload.capShields === 'number' ? payload.capShields : DEFAULT_CAP_SHIELDS;
    const capStreak =
      typeof payload.capStreak === 'number' ? payload.capStreak : DEFAULT_CAP_STREAK;

    return {
      isEnabled: flag.isEnabled,
      rewards,
      capShields,
      capStreak,
    };
  }
}

export function buildFallbackRewards(
  capShields: number,
  capStreak: number,
): { day: number; shields: number; streak: number }[] {
  const out: { day: number; shields: number; streak: number }[] = [];
  const maxDay = Math.max(capShields, capStreak) * 2 + 1;
  for (let d = 1; d <= maxDay; d++) {
    out.push({
      day: d,
      shields: Math.min(Math.ceil(d / 2), capShields),
      streak: Math.min(Math.floor(d / 2), capStreak),
    });
  }
  return out;
}

export function lookupReward(
  config: DailyLoginConfig,
  day: number,
): { shields: number; streak: number } {
  if (config.rewards.length === 0) {
    return {
      shields: Math.min(Math.ceil(day / 2), config.capShields),
      streak: Math.min(Math.floor(day / 2), config.capStreak),
    };
  }
  const exact = config.rewards.find((r) => r.day === day);
  if (exact) {
    return {
      shields: Math.min(exact.shields, config.capShields),
      streak: Math.min(exact.streak, config.capStreak),
    };
  }
  const last = config.rewards[config.rewards.length - 1];
  return {
    shields: Math.min(last.shields, config.capShields),
    streak: Math.min(last.streak, config.capStreak),
  };
}

export function parseLocalDate(localDate: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(localDate);
  if (!match) {
    throw new BadRequestException('localDate must be in YYYY-MM-DD format');
  }
  const [, y, m, d] = match;
  const year = Number(y);
  const month = Number(m);
  const day = Number(d);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new BadRequestException('localDate is not a valid calendar date');
  }
  return date;
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

export function isConsecutiveDay(previous: Date, current: Date): boolean {
  const prevStart = Date.UTC(
    previous.getUTCFullYear(),
    previous.getUTCMonth(),
    previous.getUTCDate(),
  );
  const currStart = Date.UTC(
    current.getUTCFullYear(),
    current.getUTCMonth(),
    current.getUTCDate(),
  );
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  return currStart - prevStart === ONE_DAY_MS;
}
