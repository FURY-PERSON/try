import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DailySetPublisherService {
  private readonly logger = new Logger(DailySetPublisherService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Runs every day at 00:05 UTC+3 (21:05 UTC).
   * Finds all DailySets with status 'scheduled' and date <= today,
   * then updates their status to 'published'.
   */
  @Cron('5 21 * * *')
  async publishScheduledSets(): Promise<void> {
    this.logger.log('Running daily set publisher...');

    // Cron fires at 21:05 UTC = 00:05 GMT+3.
    // We need today's date in GMT+3, not UTC.
    const nowUtc = new Date();
    const msk = new Date(nowUtc.getTime() + 3 * 60 * 60 * 1000);
    const todayMsk = new Date(
      Date.UTC(msk.getUTCFullYear(), msk.getUTCMonth(), msk.getUTCDate()),
    );

    const result = await this.prisma.dailySet.updateMany({
      where: {
        status: 'scheduled',
        date: { lte: todayMsk },
      },
      data: {
        status: 'published',
      },
    });

    this.logger.log(`Published ${result.count} daily set(s) for ${todayMsk.toISOString().slice(0, 10)} (MSK).`);
  }
}
