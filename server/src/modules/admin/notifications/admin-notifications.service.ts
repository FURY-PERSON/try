import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { SendNotificationDto } from './dto/send-notification.dto';

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  sound?: string;
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
}

@Injectable()
export class AdminNotificationsService {
  private readonly logger = new Logger(AdminNotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async send(dto: SendNotificationDto) {
    const users = await this.prisma.user.findMany({
      where: {
        pushToken: { not: null },
        pushEnabled: true,
      },
      select: { pushToken: true },
    });

    const tokens = users
      .map((u) => u.pushToken)
      .filter((t): t is string => !!t);

    if (tokens.length === 0) {
      const record = await this.prisma.notification.create({
        data: {
          title: dto.title,
          body: dto.body,
          target: dto.target ?? 'all',
          totalSent: 0,
          totalFailed: 0,
          status: 'sent',
        },
      });
      return { sent: 0, failed: 0, total: 0, notificationId: record.id };
    }

    const chunkSize = 100;
    let totalSent = 0;
    let totalFailed = 0;

    for (let i = 0; i < tokens.length; i += chunkSize) {
      const chunk = tokens.slice(i, i + chunkSize);
      const messages: ExpoPushMessage[] = chunk.map((token) => ({
        to: token,
        title: dto.title,
        body: dto.body,
        sound: 'default',
      }));

      try {
        const response = await fetch(
          'https://exp.host/--/api/v2/push/send',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(messages),
          },
        );

        const result = await response.json();
        const tickets: ExpoPushTicket[] = result.data ?? [];

        for (const ticket of tickets) {
          if (ticket.status === 'ok') {
            totalSent++;
          } else {
            totalFailed++;
          }
        }
      } catch (error) {
        this.logger.error(`Failed to send push chunk: ${error}`);
        totalFailed += chunk.length;
      }
    }

    const record = await this.prisma.notification.create({
      data: {
        title: dto.title,
        body: dto.body,
        target: dto.target ?? 'all',
        totalSent,
        totalFailed,
        status: totalFailed === tokens.length ? 'failed' : 'sent',
      },
    });

    return {
      sent: totalSent,
      failed: totalFailed,
      total: tokens.length,
      notificationId: record.id,
    };
  }

  async getHistory(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
