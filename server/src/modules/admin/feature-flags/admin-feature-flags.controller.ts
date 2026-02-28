import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';
import { AdminFeatureFlagsService } from './admin-feature-flags.service';
import { CreateFeatureFlagDto } from './dto/create-feature-flag.dto';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';

@ApiTags('admin/feature-flags')
@ApiBearerAuth()
@UseGuards(AdminJwtGuard)
@Controller('admin/feature-flags')
export class AdminFeatureFlagsController {
  constructor(
    private readonly adminFeatureFlagsService: AdminFeatureFlagsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all feature flags (admin, full data)' })
  @ApiResponse({ status: 200, description: 'All feature flags' })
  async findAll() {
    return this.adminFeatureFlagsService.findAll();
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get a feature flag by key (admin)' })
  @ApiParam({ name: 'key', example: 'show_ads' })
  @ApiResponse({ status: 200, description: 'Feature flag found' })
  @ApiResponse({ status: 404, description: 'Feature flag not found' })
  async findByKey(@Param('key') key: string) {
    return this.adminFeatureFlagsService.findByKey(key);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new feature flag' })
  @ApiResponse({ status: 201, description: 'Feature flag created' })
  @ApiResponse({ status: 409, description: 'Key already exists' })
  async create(@Body() dto: CreateFeatureFlagDto) {
    return this.adminFeatureFlagsService.create(dto);
  }

  @Patch(':key')
  @ApiOperation({ summary: 'Update a feature flag' })
  @ApiParam({ name: 'key', example: 'show_ads' })
  @ApiResponse({ status: 200, description: 'Feature flag updated' })
  @ApiResponse({ status: 404, description: 'Feature flag not found' })
  async update(@Param('key') key: string, @Body() dto: UpdateFeatureFlagDto) {
    return this.adminFeatureFlagsService.update(key, dto);
  }

  @Patch(':key/toggle')
  @ApiOperation({ summary: 'Toggle feature flag enabled/disabled' })
  @ApiParam({ name: 'key', example: 'show_ads' })
  @ApiResponse({ status: 200, description: 'Feature flag toggled' })
  @ApiResponse({ status: 404, description: 'Feature flag not found' })
  async toggle(@Param('key') key: string) {
    return this.adminFeatureFlagsService.toggle(key);
  }

  @Delete(':key')
  @ApiOperation({ summary: 'Delete a feature flag' })
  @ApiParam({ name: 'key', example: 'show_ads' })
  @ApiResponse({ status: 200, description: 'Feature flag deleted' })
  @ApiResponse({ status: 404, description: 'Feature flag not found' })
  async remove(@Param('key') key: string) {
    return this.adminFeatureFlagsService.remove(key);
  }
}
