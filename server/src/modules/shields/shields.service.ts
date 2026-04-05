import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

const SHIELD_REWARDS: Record<string, number> = {
  rewarded_video: 2,
  daily_set_bonus: 3,
  streak_milestone: 1,
  initial: 5,
};

@Injectable()
export class ShieldsService {
  constructor(private readonly prisma: PrismaService) {}

  async getBalance(userId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { shields: true },
    });
    return user?.shields ?? 0;
  }

  /**
   * Atomically deduct one shield. Returns remaining balance.
   * Throws BadRequestException if balance is 0.
   */
  async useShield(userId: string): Promise<number> {
    const result = await this.prisma.$executeRaw`
      UPDATE "User"
      SET "shields" = "shields" - 1, "updatedAt" = NOW()
      WHERE "id" = ${userId} AND "shields" > 0
    `;

    if (result === 0) {
      throw new BadRequestException('Not enough shields');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { shields: true },
    });

    return user?.shields ?? 0;
  }

  /**
   * Atomically deduct one shield within a transaction.
   * Returns true if shield was used, false if balance was 0.
   */
  async useShieldInTransaction(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    userId: string,
  ): Promise<boolean> {
    const result = await tx.$executeRaw`
      UPDATE "User"
      SET "shields" = "shields" - 1, "updatedAt" = NOW()
      WHERE "id" = ${userId} AND "shields" > 0
    `;
    return result > 0;
  }

  async addShields(userId: string, source: string): Promise<{ added: number; total: number }> {
    const amount = SHIELD_REWARDS[source];
    if (!amount) {
      throw new BadRequestException(`Unknown shield source: ${source}`);
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { shields: { increment: amount } },
      select: { shields: true },
    });

    return { added: amount, total: user.shields };
  }

  async initializeShields(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { shields: SHIELD_REWARDS.initial },
    });
  }
}
