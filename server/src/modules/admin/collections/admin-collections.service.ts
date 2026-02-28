import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { createPaginatedResponse } from '@/common/dto/pagination.dto';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { CollectionQueryDto } from './dto/collection-query.dto';

@Injectable()
export class AdminCollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: CollectionQueryDto) {
    const where: Record<string, unknown> = {};

    if (query.status) {
      where.status = query.status;
    }
    if (query.type) {
      where.type = query.type;
    }

    const [data, total] = await Promise.all([
      this.prisma.collection.findMany({
        where,
        orderBy: { sortOrder: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          _count: { select: { questions: true } },
        },
      }),
      this.prisma.collection.count({ where }),
    ]);

    return createPaginatedResponse(data, total, query);
  }

  async findOne(id: string) {
    const collection = await this.prisma.collection.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!collection) {
      throw new NotFoundException(`Collection with id "${id}" not found`);
    }

    return collection;
  }

  async create(dto: CreateCollectionDto) {
    const collection = await this.prisma.collection.create({
      data: {
        title: dto.title,
        titleEn: dto.titleEn,
        description: dto.description ?? '',
        descriptionEn: dto.descriptionEn ?? '',
        icon: dto.icon ?? '📚',
        imageUrl: dto.imageUrl,
        type: dto.type ?? 'thematic',
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        sortOrder: dto.sortOrder ?? 0,
        questions: {
          create: dto.items.map((item, index) => ({
            statement: item.statement,
            isTrue: item.isTrue,
            explanation: item.explanation,
            source: item.source ?? '',
            sourceUrl: item.sourceUrl,
            difficulty: item.difficulty ?? 3,
            language: item.language ?? 'ru',
            sortOrder: item.sortOrder ?? index + 1,
          })),
        },
      },
      include: {
        _count: { select: { questions: true } },
      },
    });

    return collection;
  }

  async update(id: string, dto: UpdateCollectionDto) {
    const existing = await this.prisma.collection.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Collection with id "${id}" not found`);
    }

    // If items provided, replace all existing items
    if (dto.items) {
      await this.prisma.collectionItem.deleteMany({
        where: { collectionId: id },
      });

      await this.prisma.collectionItem.createMany({
        data: dto.items.map((item, index) => ({
          collectionId: id,
          statement: item.statement,
          isTrue: item.isTrue,
          explanation: item.explanation,
          source: item.source ?? '',
          sourceUrl: item.sourceUrl,
          difficulty: item.difficulty ?? 3,
          language: item.language ?? 'ru',
          sortOrder: item.sortOrder ?? index + 1,
        })),
      });
    }

    const { items, ...updateData } = dto;

    return this.prisma.collection.update({
      where: { id },
      data: {
        ...(updateData.title !== undefined && { title: updateData.title }),
        ...(updateData.titleEn !== undefined && { titleEn: updateData.titleEn }),
        ...(updateData.description !== undefined && { description: updateData.description }),
        ...(updateData.descriptionEn !== undefined && { descriptionEn: updateData.descriptionEn }),
        ...(updateData.icon !== undefined && { icon: updateData.icon }),
        ...(updateData.imageUrl !== undefined && { imageUrl: updateData.imageUrl }),
        ...(updateData.type !== undefined && { type: updateData.type }),
        ...(updateData.status !== undefined && { status: updateData.status }),
        ...(updateData.startDate !== undefined && { startDate: updateData.startDate ? new Date(updateData.startDate) : null }),
        ...(updateData.endDate !== undefined && { endDate: updateData.endDate ? new Date(updateData.endDate) : null }),
        ...(updateData.sortOrder !== undefined && { sortOrder: updateData.sortOrder }),
      },
      include: {
        _count: { select: { questions: true } },
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.collection.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Collection with id "${id}" not found`);
    }

    await this.prisma.collection.delete({ where: { id } });

    return { deleted: true };
  }
}
