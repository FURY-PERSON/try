import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByDeviceId(deviceId: string) {
    return this.prisma.user.findUnique({
      where: { deviceId },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async create(data: { deviceId: string; language?: string }) {
    return this.prisma.user.create({
      data: {
        deviceId: data.deviceId,
        language: data.language ?? 'both',
      },
    });
  }

  async update(id: string, data: Partial<{ nickname: string; language: string; pushToken: string; pushEnabled: boolean }>) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async updateStreak(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return null;
    }

    const newStreak = user.currentStreak + 1;
    const newBestStreak = Math.max(newStreak, user.bestStreak);

    return this.prisma.user.update({
      where: { id },
      data: {
        currentStreak: newStreak,
        bestStreak: newBestStreak,
        lastPlayedDate: new Date(),
      },
    });
  }

  async resetStreak(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        currentStreak: 0,
      },
    });
  }

  async getStats(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        currentStreak: true,
        bestStreak: true,
        lastPlayedDate: true,
        totalGamesPlayed: true,
        totalCorrectAnswers: true,
      },
    });

    if (!user) {
      return null;
    }

    const correctAnswersCount = await this.prisma.userQuestionHistory.count({
      where: {
        userId: id,
        result: 'correct',
      },
    });

    return {
      ...user,
      correctAnswersCount,
    };
  }

  async countDistinctCorrectQuestions(userId: string): Promise<number> {
    const distinctQuestions = await this.prisma.userQuestionHistory.findMany({
      where: {
        userId,
        result: 'correct',
      },
      distinct: ['questionId'],
      select: {
        questionId: true,
      },
    });

    return distinctQuestions.length;
  }
}
