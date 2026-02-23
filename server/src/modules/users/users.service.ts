import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

export interface UserStats {
  totalGames: number;
  correctPercent: number;
  bestStreak: number;
  avgScore: number;
  activityMap: Record<string, number>;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async register(deviceId: string): Promise<User> {
    const existingUser = await this.prisma.user.findUnique({
      where: { deviceId },
    });

    if (existingUser) {
      return existingUser;
    }

    return this.prisma.user.create({
      data: { deviceId },
    });
  }

  async updateUser(userId: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const data: Record<string, unknown> = {};

    if (dto.language !== undefined) {
      data.language = dto.language;
    }
    if (dto.nickname !== undefined) {
      data.nickname = dto.nickname;
    }
    if (dto.pushToken !== undefined) {
      data.pushToken = dto.pushToken;
    }
    if (dto.pushEnabled !== undefined) {
      data.pushEnabled = dto.pushEnabled;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async getUserStats(userId: string): Promise<UserStats> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        totalGamesPlayed: true,
        bestStreak: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const totalAnswered = await this.prisma.userQuestionHistory.count({
      where: { userId },
    });

    const correctAnswered = await this.prisma.userQuestionHistory.count({
      where: { userId, result: 'correct' },
    });

    const correctPercent =
      totalAnswered > 0
        ? Math.round((correctAnswered / totalAnswered) * 100)
        : 0;

    // Average score per game from leaderboard entries
    const scoreAgg = await this.prisma.leaderboardEntry.aggregate({
      where: { userId },
      _avg: { score: true },
    });
    const avgScore = scoreAgg._avg.score ?? 0;

    // Activity map: session count per day (last 365 days)
    const yearAgo = new Date();
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);
    yearAgo.setHours(0, 0, 0, 0);

    // Get activity from leaderboard entries (daily sets)
    const leaderboardEntries = await this.prisma.leaderboardEntry.findMany({
      where: {
        userId,
        createdAt: { gte: yearAgo },
      },
      select: {
        dailySet: { select: { date: true } },
      },
    });

    // Get activity from collection progress (categories, difficulty, collections)
    const collectionProgress =
      await this.prisma.userCollectionProgress.findMany({
        where: {
          userId,
          completedAt: { gte: yearAgo },
        },
        select: { completedAt: true },
      });

    const activityMap: Record<string, number> = {};

    for (const entry of leaderboardEntries) {
      const dateStr = new Date(entry.dailySet.date)
        .toISOString()
        .split('T')[0];
      activityMap[dateStr] = (activityMap[dateStr] ?? 0) + 1;
    }

    for (const progress of collectionProgress) {
      const date = new Date(progress.completedAt);
      date.setHours(date.getHours() + 3);
      const dateStr = date.toISOString().split('T')[0];
      activityMap[dateStr] = (activityMap[dateStr] ?? 0) + 1;
    }

    return {
      totalGames: user.totalGamesPlayed,
      correctPercent,
      bestStreak: user.bestStreak,
      avgScore: Math.round(avgScore * 10) / 10,
      activityMap,
    };
  }

  async findByDeviceId(deviceId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { deviceId },
    });
  }
}
