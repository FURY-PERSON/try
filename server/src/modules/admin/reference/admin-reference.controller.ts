import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';
import { AdminReferenceService } from './admin-reference.service';
import { CreateAdjectiveDto } from './dto/create-adjective.dto';
import { UpdateAdjectiveDto } from './dto/update-adjective.dto';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';
import { CreateEmojiDto } from './dto/create-emoji.dto';
import { UpdateEmojiDto } from './dto/update-emoji.dto';

@ApiTags('admin/reference')
@ApiBearerAuth()
@UseGuards(AdminJwtGuard)
@Controller('admin/reference')
export class AdminReferenceController {
  constructor(private readonly service: AdminReferenceService) {}

  // --- Adjectives ---

  @Get('adjectives')
  @ApiOperation({ summary: 'List all nickname adjectives' })
  @ApiResponse({ status: 200 })
  async findAllAdjectives() {
    return this.service.findAllAdjectives();
  }

  @Post('adjectives')
  @ApiOperation({ summary: 'Create a nickname adjective' })
  @ApiResponse({ status: 201 })
  async createAdjective(@Body() dto: CreateAdjectiveDto) {
    return this.service.createAdjective(dto);
  }

  @Patch('adjectives/:id')
  @ApiOperation({ summary: 'Update a nickname adjective' })
  @ApiResponse({ status: 200 })
  async updateAdjective(@Param('id') id: string, @Body() dto: UpdateAdjectiveDto) {
    return this.service.updateAdjective(id, dto);
  }

  @Delete('adjectives/:id')
  @ApiOperation({ summary: 'Delete a nickname adjective' })
  @ApiResponse({ status: 200 })
  async removeAdjective(@Param('id') id: string) {
    return this.service.removeAdjective(id);
  }

  // --- Animals ---

  @Get('animals')
  @ApiOperation({ summary: 'List all nickname animals' })
  @ApiResponse({ status: 200 })
  async findAllAnimals() {
    return this.service.findAllAnimals();
  }

  @Post('animals')
  @ApiOperation({ summary: 'Create a nickname animal' })
  @ApiResponse({ status: 201 })
  async createAnimal(@Body() dto: CreateAnimalDto) {
    return this.service.createAnimal(dto);
  }

  @Patch('animals/:id')
  @ApiOperation({ summary: 'Update a nickname animal' })
  @ApiResponse({ status: 200 })
  async updateAnimal(@Param('id') id: string, @Body() dto: UpdateAnimalDto) {
    return this.service.updateAnimal(id, dto);
  }

  @Delete('animals/:id')
  @ApiOperation({ summary: 'Delete a nickname animal' })
  @ApiResponse({ status: 200 })
  async removeAnimal(@Param('id') id: string) {
    return this.service.removeAnimal(id);
  }

  // --- Emojis ---

  @Get('emojis')
  @ApiOperation({ summary: 'List all avatar emojis' })
  @ApiResponse({ status: 200 })
  async findAllEmojis() {
    return this.service.findAllEmojis();
  }

  @Post('emojis')
  @ApiOperation({ summary: 'Create an avatar emoji' })
  @ApiResponse({ status: 201 })
  async createEmoji(@Body() dto: CreateEmojiDto) {
    return this.service.createEmoji(dto);
  }

  @Patch('emojis/:id')
  @ApiOperation({ summary: 'Update an avatar emoji' })
  @ApiResponse({ status: 200 })
  async updateEmoji(@Param('id') id: string, @Body() dto: UpdateEmojiDto) {
    return this.service.updateEmoji(id, dto);
  }

  @Delete('emojis/:id')
  @ApiOperation({ summary: 'Delete an avatar emoji' })
  @ApiResponse({ status: 200 })
  async removeEmoji(@Param('id') id: string) {
    return this.service.removeEmoji(id);
  }
}
