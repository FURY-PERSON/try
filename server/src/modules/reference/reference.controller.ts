import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DeviceAuthGuard } from '@/common/guards/device-auth.guard';
import { ReferenceService } from './reference.service';

@ApiTags('reference')
@UseGuards(DeviceAuthGuard)
@Controller('v1/reference')
export class ReferenceController {
  constructor(private readonly referenceService: ReferenceService) {}

  @Get('nickname-options')
  @ApiOperation({ summary: 'Get random nickname placeholder and avatar emoji' })
  @ApiResponse({ status: 200 })
  async getNicknameOptions(@Query('language') language?: string) {
    return this.referenceService.getNicknameOptions(language || 'ru');
  }

  @Get('avatar-emojis')
  @ApiOperation({ summary: 'Get all available avatar emojis grouped by category' })
  @ApiResponse({ status: 200 })
  async getAvatarEmojis() {
    return this.referenceService.getAvatarEmojis();
  }
}
