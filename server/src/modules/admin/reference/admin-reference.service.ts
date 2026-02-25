import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateAdjectiveDto } from './dto/create-adjective.dto';
import { UpdateAdjectiveDto } from './dto/update-adjective.dto';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';
import { CreateEmojiDto } from './dto/create-emoji.dto';
import { UpdateEmojiDto } from './dto/update-emoji.dto';

@Injectable()
export class AdminReferenceService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Adjectives ---

  async findAllAdjectives() {
    return this.prisma.nicknameAdjective.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async createAdjective(dto: CreateAdjectiveDto) {
    return this.prisma.nicknameAdjective.create({
      data: {
        textRu: dto.textRu,
        textEn: dto.textEn,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateAdjective(id: string, dto: UpdateAdjectiveDto) {
    const existing = await this.prisma.nicknameAdjective.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Adjective "${id}" not found`);

    return this.prisma.nicknameAdjective.update({
      where: { id },
      data: dto,
    });
  }

  async removeAdjective(id: string) {
    const existing = await this.prisma.nicknameAdjective.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Adjective "${id}" not found`);

    await this.prisma.nicknameAdjective.delete({ where: { id } });
    return { deleted: true };
  }

  // --- Animals ---

  async findAllAnimals() {
    return this.prisma.nicknameAnimal.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async createAnimal(dto: CreateAnimalDto) {
    return this.prisma.nicknameAnimal.create({
      data: {
        textRu: dto.textRu,
        textEn: dto.textEn,
        emoji: dto.emoji,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateAnimal(id: string, dto: UpdateAnimalDto) {
    const existing = await this.prisma.nicknameAnimal.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Animal "${id}" not found`);

    return this.prisma.nicknameAnimal.update({
      where: { id },
      data: dto,
    });
  }

  async removeAnimal(id: string) {
    const existing = await this.prisma.nicknameAnimal.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Animal "${id}" not found`);

    await this.prisma.nicknameAnimal.delete({ where: { id } });
    return { deleted: true };
  }

  // --- Emojis ---

  async findAllEmojis() {
    return this.prisma.avatarEmoji.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async createEmoji(dto: CreateEmojiDto) {
    return this.prisma.avatarEmoji.create({
      data: {
        emoji: dto.emoji,
        category: dto.category ?? 'default',
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateEmoji(id: string, dto: UpdateEmojiDto) {
    const existing = await this.prisma.avatarEmoji.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Emoji "${id}" not found`);

    return this.prisma.avatarEmoji.update({
      where: { id },
      data: dto,
    });
  }

  async removeEmoji(id: string) {
    const existing = await this.prisma.avatarEmoji.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Emoji "${id}" not found`);

    await this.prisma.avatarEmoji.delete({ where: { id } });
    return { deleted: true };
  }
}
