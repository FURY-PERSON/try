import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';
import { AdminCollectionsService } from './admin-collections.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { PaginationQueryDto } from '@/common/dto/pagination.dto';

@ApiTags('admin/collections')
@ApiBearerAuth()
@UseGuards(AdminJwtGuard)
@Controller('admin/collections')
export class AdminCollectionsController {
  constructor(
    private readonly adminCollectionsService: AdminCollectionsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all collections (paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated list of collections' })
  @ApiQuery({ name: 'status', required: false, enum: ['draft', 'published'] })
  @ApiQuery({ name: 'type', required: false, enum: ['featured', 'seasonal', 'thematic'] })
  async findAll(
    @Query() query: PaginationQueryDto & { status?: string; type?: string },
  ) {
    return this.adminCollectionsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a collection by ID' })
  @ApiResponse({ status: 200, description: 'Collection details with questions' })
  @ApiResponse({ status: 404, description: 'Collection not found' })
  async findOne(@Param('id') id: string) {
    return this.adminCollectionsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new collection' })
  @ApiResponse({ status: 201, description: 'Collection created' })
  async create(@Body() dto: CreateCollectionDto) {
    return this.adminCollectionsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a collection' })
  @ApiResponse({ status: 200, description: 'Collection updated' })
  @ApiResponse({ status: 404, description: 'Collection not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateCollectionDto) {
    return this.adminCollectionsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a collection' })
  @ApiResponse({ status: 200, description: 'Collection deleted' })
  @ApiResponse({ status: 404, description: 'Collection not found' })
  async remove(@Param('id') id: string) {
    return this.adminCollectionsService.remove(id);
  }
}
