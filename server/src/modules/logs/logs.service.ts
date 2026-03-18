import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateLogDto } from './dto/create-log.dto';

@Injectable()
export class LogsService {
  private readonly logger = new Logger(LogsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLogDto) {
    return this.prisma.appLog.create({
      data: {
        type: dto.type,
        message: dto.message,
        meta: dto.meta ? (dto.meta as Prisma.InputJsonValue) : undefined,
        deviceId: dto.deviceId ?? undefined,
      },
    });
  }

  @Cron('0 3 * * *')
  async deleteOldLogs() {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { count } = await this.prisma.appLog.deleteMany({
      where: { createdAt: { lt: oneWeekAgo } },
    });

    if (count > 0) {
      this.logger.log(`Deleted ${count} logs older than 7 days`);
    }
  }
}
