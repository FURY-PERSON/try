import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateSupportTicketDto } from './dto/update-support-ticket.dto';
import { createPaginatedResponse } from '@/common/dto/pagination.dto';
import { SupportQueryDto } from './dto/support-query.dto';

export { SupportQueryDto };

@Injectable()
export class AdminSupportService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: SupportQueryDto) {
    const { page, limit, status } = query;
    const where = status ? { status } : {};

    const [tickets, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return createPaginatedResponse(tickets, total, query);
  }

  async findOne(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);
    return ticket;
  }

  async update(id: string, dto: UpdateSupportTicketDto) {
    const existing = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Ticket ${id} not found`);

    return this.prisma.supportTicket.update({
      where: { id },
      data: { status: dto.status },
    });
  }
}
