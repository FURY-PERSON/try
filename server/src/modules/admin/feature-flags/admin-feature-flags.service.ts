import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateFeatureFlagDto } from './dto/create-feature-flag.dto';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';

@Injectable()
export class AdminFeatureFlagsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.featureFlag.findMany({ orderBy: { key: 'asc' } });
  }

  async findByKey(key: string) {
    const flag = await this.prisma.featureFlag.findUnique({ where: { key } });
    if (!flag) {
      throw new NotFoundException(`Feature flag "${key}" not found`);
    }
    return flag;
  }

  async create(dto: CreateFeatureFlagDto) {
    const existing = await this.prisma.featureFlag.findUnique({
      where: { key: dto.key },
    });
    if (existing) {
      throw new ConflictException(
        `Feature flag with key "${dto.key}" already exists`,
      );
    }
    return this.prisma.featureFlag.create({
      data: {
        key: dto.key,
        name: dto.name,
        description: dto.description ?? '',
        isEnabled: dto.isEnabled ?? false,
        payload: dto.payload
          ? (dto.payload as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
    });
  }

  async update(key: string, dto: UpdateFeatureFlagDto) {
    await this.findByKey(key);
    return this.prisma.featureFlag.update({
      where: { key },
      data: {
        name: dto.name,
        description: dto.description,
        isEnabled: dto.isEnabled,
        ...(dto.payload !== undefined && {
          payload: dto.payload
            ? (dto.payload as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        }),
      },
    });
  }

  async toggle(key: string) {
    const flag = await this.findByKey(key);
    return this.prisma.featureFlag.update({
      where: { key },
      data: { isEnabled: !flag.isEnabled },
    });
  }

  async remove(key: string) {
    await this.findByKey(key);
    await this.prisma.featureFlag.delete({ where: { key } });
    return { deleted: true };
  }
}
