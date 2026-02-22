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

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const result = await this.prisma.dailySet.updateMany({
      where: {
        status: 'scheduled',
        date: { lte: today },
      },
      data: {
        status: 'published',
      },
    });

    this.logger.log(`Published ${result.count} daily set(s).`);
  }
}
