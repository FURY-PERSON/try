import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { generateUniqueNickname } from '@/utils/generate-nickname';

export interface UserStats {
  totalScore: number;
  totalCorrectAnswers: number;
  factsLearned: number;
  currentStreak: number;
  bestStreak: number;
  totalGames: number;
  correctPercent: number;
  avgScore: number;
  activityMap: Record<string, number>;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async register(deviceId: string, language?: string): Promise<User> {
    const existingUser = await this.prisma.user.findUnique({
      where: { deviceId },
    });

    if (existingUser) {
      return existingUser;
    }

    const { nickname, avatarEmoji } = await generateUniqueNickname(
      this.prisma,
      language ?? 'ru',
    );

    return this.prisma.user.create({
      data: { deviceId, nickname, avatarEmoji },
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
    if (dto.avatarEmoji !== undefined) {
      data.avatarEmoji = dto.avatarEmoji;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async getUserStats(userId: string): Promise<UserStats> {
    const yearAgo = new Date();
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);
    yearAgo.setHours(0, 0, 0, 0);

    // Run all independent queries in parallel
    const [user, factsLearned, scoreAgg, leaderboardEntries, collectionProgress] =
      await Promise.all([
        this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            totalGamesPlayed: true,
            totalCorrectAnswers: true,
            totalScore: true,
            currentAnswerStreak: true,
            bestAnswerStreak: true,
          },
        }),
        this.prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(DISTINCT "questionId")::bigint AS count
          FROM "UserQuestionHistory"
          WHERE "userId" = ${userId}
        `.then((rows) => Number(rows[0]?.count ?? 0)),
        this.prisma.leaderboardEntry.aggregate({
          where: { userId },
          _avg: { score: true },
        }),
        this.prisma.leaderboardEntry.findMany({
          where: { userId, createdAt: { gte: yearAgo } },
          select: { dailySet: { select: { date: true } } },
        }),
        this.prisma.userCollectionProgress.findMany({
          where: { userId, completedAt: { gte: yearAgo } },
          select: { completedAt: true },
        }),
      ]);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const correctPercent =
      factsLearned > 0
        ? Math.round((user.totalCorrectAnswers / factsLearned) * 100)
        : 0;

    const avgScore = scoreAgg._avg.score ?? 0;

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
      totalScore: user.totalScore,
      totalCorrectAnswers: user.totalCorrectAnswers,
      factsLearned,
      currentStreak: user.currentAnswerStreak,
      bestStreak: user.bestAnswerStreak,
      totalGames: user.totalGamesPlayed,
      correctPercent,
      avgScore: Math.round(avgScore * 10) / 10,
      activityMap,
    };
  }

  async regenerateNickname(userId: string, language: string = 'ru'): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const { nickname, avatarEmoji } = await generateUniqueNickname(this.prisma, language);
    return this.prisma.user.update({
      where: { id: userId },
      data: { nickname, avatarEmoji },
    });
  }

  async findByDeviceId(deviceId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { deviceId },
    });
  }
}
