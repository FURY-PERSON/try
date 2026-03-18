import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { LogsQueryDto } from './dto/logs-query.dto';
import { createPaginatedResponse } from '@/common/dto/pagination.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: LogsQueryDto) {
    const { page, limit, type } = query;
    const where: Prisma.AppLogWhereInput = {};

    if (type) {
      where.type = type;
    }

    const [logs, total] = await Promise.all([
      this.prisma.appLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.appLog.count({ where }),
    ]);

    return createPaginatedResponse(logs, total, query);
  }

  async getTypes() {
    const types = await this.prisma.appLog.groupBy({
      by: ['type'],
      _count: { type: true },
      orderBy: { _count: { type: 'desc' } },
    });

    return types.map((t) => ({ type: t.type, count: t._count.type }));
  }
}
