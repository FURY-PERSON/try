import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateDailySetDto } from './dto/create-daily-set.dto';
import { UpdateDailySetDto } from './dto/update-daily-set.dto';
import { DailySetQueryDto } from './dto/daily-set-query.dto';
import { createPaginatedResponse } from '@/common/dto/pagination.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminDailySetsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: DailySetQueryDto) {
    const { page, limit, status } = query;

    const where: Prisma.DailySetWhereInput = {};

    if (status) {
      where.status = status;
    }

    const [dailySets, total] = await Promise.all([
      this.prisma.dailySet.findMany({
        where,
        include: {
          questions: {
            include: { question: { include: { category: true } } },
            orderBy: { sortOrder: 'asc' },
          },
          _count: { select: { leaderboardEntries: true } },
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.dailySet.count({ where }),
    ]);

    return createPaginatedResponse(dailySets, total, page, limit);
  }

  async findOne(id: string) {
    const dailySet = await this.prisma.dailySet.findUnique({
      where: { id },
      include: {
        questions: {
          include: { question: { include: { category: true } } },
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { leaderboardEntries: true } },
      },
    });

    if (!dailySet) {
      throw new NotFoundException(`Daily set with id "${id}" not found`);
    }

    return dailySet;
  }

  async create(dto: CreateDailySetDto) {
    const dateValue = new Date(dto.date);

    const existingSet = await this.prisma.dailySet.findUnique({
      where: { date: dateValue },
    });

    if (existingSet) {
      throw new ConflictException(
        `A daily set already exists for date ${dto.date}`,
      );
    }

    const questions = await this.prisma.question.findMany({
      where: {
        id: { in: dto.questionIds },
        status: 'approved',
      },
    });

    if (questions.length !== dto.questionIds.length) {
      const foundIds = questions.map((q) => q.id);
      const missingIds = dto.questionIds.filter(
        (id) => !foundIds.includes(id),
      );
      throw new BadRequestException(
        `Some questions were not found or not approved: ${missingIds.join(', ')}`,
      );
    }

    return this.prisma.dailySet.create({
      data: {
        date: dateValue,
        theme: dto.theme,
        themeEn: dto.themeEn,
        questions: {
          create: dto.questionIds.map((questionId, index) => ({
            questionId,
            sortOrder: index,
          })),
        },
      },
      include: {
        questions: {
          include: { question: { include: { category: true } } },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async update(id: string, dto: UpdateDailySetDto) {
    const existing = await this.prisma.dailySet.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Daily set with id "${id}" not found`);
    }

    if (dto.date) {
      const dateValue = new Date(dto.date);
      const conflicting = await this.prisma.dailySet.findFirst({
        where: { date: dateValue, id: { not: id } },
      });
      if (conflicting) {
        throw new ConflictException(
          `A daily set already exists for date ${dto.date}`,
        );
      }
    }

    if (dto.questionIds) {
      const questions = await this.prisma.question.findMany({
        where: {
          id: { in: dto.questionIds },
          status: 'approved',
        },
      });

      if (questions.length !== dto.questionIds.length) {
        const foundIds = questions.map((q) => q.id);
        const missingIds = dto.questionIds.filter(
          (qId) => !foundIds.includes(qId),
        );
        throw new BadRequestException(
          `Some questions were not found or not approved: ${missingIds.join(', ')}`,
        );
      }

      await this.prisma.dailySetQuestion.deleteMany({
        where: { dailySetId: id },
      });

      await this.prisma.dailySetQuestion.createMany({
        data: dto.questionIds.map((questionId, index) => ({
          dailySetId: id,
          questionId,
          sortOrder: index,
        })),
      });
    }

    const updateData: Prisma.DailySetUpdateInput = {};
    if (dto.theme !== undefined) updateData.theme = dto.theme;
    if (dto.themeEn !== undefined) updateData.themeEn = dto.themeEn;
    if (dto.date !== undefined) updateData.date = new Date(dto.date);

    return this.prisma.dailySet.update({
      where: { id },
      data: updateData,
      include: {
        questions: {
          include: { question: { include: { category: true } } },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.dailySet.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Daily set with id "${id}" not found`);
    }

    await this.prisma.dailySet.delete({ where: { id } });

    return { deleted: true };
  }
}
