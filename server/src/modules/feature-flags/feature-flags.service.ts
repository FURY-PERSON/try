import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class FeatureFlagsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const flags = await this.prisma.featureFlag.findMany({
      orderBy: { key: 'asc' },
    });
    return flags.map((f) => ({
      key: f.key,
      isEnabled: f.isEnabled,
      payload: f.payload,
    }));
  }

  async findByKey(key: string) {
    const flag = await this.prisma.featureFlag.findUnique({ where: { key } });
    if (!flag) {
      throw new NotFoundException(`Feature flag "${key}" not found`);
    }
    return {
      key: flag.key,
      isEnabled: flag.isEnabled,
      payload: flag.payload,
    };
  }
}
