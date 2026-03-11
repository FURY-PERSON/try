import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSupportTicketDto) {
    return this.prisma.supportTicket.create({
      data: {
        email: dto.email,
        description: dto.description,
      },
    });
  }
}
