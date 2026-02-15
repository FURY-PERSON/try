import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

export interface UserStats {
  totalGames: number;
  correctPercentage: number;
  currentStreak: number;
  longestStreak: number;
  factsLearned: number;
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
        totalCorrectAnswers: true,
        currentStreak: true,
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

    const correctPercentage =
      totalAnswered > 0
        ? Math.round((correctAnswered / totalAnswered) * 100)
        : 0;

    const factsLearned = await this.prisma.userQuestionHistory.findMany({
      where: {
        userId,
        result: 'correct',
      },
      distinct: ['questionId'],
      select: { questionId: true },
    });

    return {
      totalGames: user.totalGamesPlayed,
      correctPercentage,
      currentStreak: user.currentStreak,
      longestStreak: user.bestStreak,
      factsLearned: factsLearned.length,
    };
  }

  async findByDeviceId(deviceId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { deviceId },
    });
  }
}
