import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Category } from '@prisma/client';
import { CategoriesService } from './categories.service';

@ApiTags('categories')
@Controller('api/v1/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active categories sorted by sort order' })
  @ApiResponse({ status: 200, description: 'List of active categories returned successfully' })
  async findAll(): Promise<Category[]> {
    return this.categoriesService.findAllActive();
  }
}
