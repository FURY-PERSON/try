import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { FeatureFlagsService } from './feature-flags.service';

@ApiTags('feature-flags')
@Controller('feature-flags')
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all feature flags (public)' })
  @ApiResponse({ status: 200, description: 'List of feature flags' })
  async findAll() {
    return this.featureFlagsService.findAll();
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get a feature flag by key (public)' })
  @ApiParam({ name: 'key', example: 'show_ads' })
  @ApiResponse({ status: 200, description: 'Feature flag found' })
  @ApiResponse({ status: 404, description: 'Feature flag not found' })
  async findByKey(@Param('key') key: string) {
    return this.featureFlagsService.findByKey(key);
  }
}
