import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

export interface UserStats {
  totalGames: number;
  correctPercent: number;
  bestStreak: number;
  avgScore: number;
  activityMap: Record<string, boolean>;
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

    // Activity map: dates when the user played (last 365 days)
    const yearAgo = new Date();
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);
    yearAgo.setHours(0, 0, 0, 0);

    const entries = await this.prisma.leaderboardEntry.findMany({
      where: {
        userId,
        createdAt: { gte: yearAgo },
      },
      select: { createdAt: true },
    });

    const activityMap: Record<string, boolean> = {};
    for (const entry of entries) {
      const dateStr = entry.createdAt.toISOString().split('T')[0];
      activityMap[dateStr] = true;
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
