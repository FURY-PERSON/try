import { Controller, Get, Header, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Category } from '@prisma/client';
import { CategoriesService } from './categories.service';
import { DeviceAuthGuard } from '@/common/guards/device-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('categories')
@Controller('v1/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @Header('Cache-Control', 'public, max-age=300')
  @ApiOperation({ summary: 'Get all active categories sorted by sort order' })
  @ApiResponse({ status: 200, description: 'List of active categories returned successfully' })
  async findAll(): Promise<Category[]> {
    return this.categoriesService.findAllActive();
  }

  @Get(':id')
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({ summary: 'Get category detail with available question count' })
  @ApiResponse({ status: 200, description: 'Category detail returned successfully' })
  async findById(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.categoriesService.findById(id, userId);
  }
}
