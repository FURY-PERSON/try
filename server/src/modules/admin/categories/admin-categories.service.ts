import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class AdminCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { questions: true } },
      },
    });
  }

  async create(dto: CreateCategoryDto) {
    const existingSlug = await this.prisma.category.findUnique({
      where: { slug: dto.slug },
    });

    if (existingSlug) {
      throw new ConflictException(
        `Category with slug "${dto.slug}" already exists`,
      );
    }

    return this.prisma.category.create({
      data: {
        name: dto.name,
        nameEn: dto.nameEn,
        slug: dto.slug,
        icon: dto.icon,
        color: dto.color ?? '#34C759',
        description: dto.description ?? '',
        descriptionEn: dto.descriptionEn ?? '',
        imageUrl: dto.imageUrl,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Category with id "${id}" not found`);
    }

    if (dto.slug && dto.slug !== existing.slug) {
      const conflicting = await this.prisma.category.findUnique({
        where: { slug: dto.slug },
      });
      if (conflicting) {
        throw new ConflictException(
          `Category with slug "${dto.slug}" already exists`,
        );
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name,
        nameEn: dto.nameEn,
        slug: dto.slug,
        icon: dto.icon,
        color: dto.color,
        description: dto.description,
        descriptionEn: dto.descriptionEn,
        imageUrl: dto.imageUrl,
        isActive: dto.isActive,
        sortOrder: dto.sortOrder,
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { questions: true } } },
    });

    if (!existing) {
      throw new NotFoundException(`Category with id "${id}" not found`);
    }

    if (existing._count.questions > 0) {
      throw new ConflictException(
        `Cannot delete category "${existing.name}" because it has ${existing._count.questions} associated questions. Remove or reassign questions first.`,
      );
    }

    await this.prisma.category.delete({ where: { id } });

    return { deleted: true };
  }
}
