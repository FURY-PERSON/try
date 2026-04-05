import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { User } from '@prisma/client';
import { ShieldsService } from './shields.service';
import { UseShieldDto } from './dto/use-shield.dto';
import { RewardShieldDto } from './dto/reward-shield.dto';
import { DeviceAuthGuard } from '@/common/guards/device-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('shields')
@Controller('v1/shields')
export class ShieldsController {
  constructor(private readonly shieldsService: ShieldsService) {}

  @Post('use')
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({ summary: 'Use a shield (deduct 1 from balance)' })
  @ApiHeader({ name: 'x-device-id', required: true })
  @ApiResponse({ status: 201, description: 'Shield used successfully' })
  @ApiResponse({ status: 400, description: 'Not enough shields' })
  async useShield(
    @CurrentUser() user: User,
    @Body() dto: UseShieldDto,
  ) {
    const remainingShields = await this.shieldsService.useShield(user.id);
    return { success: true, remainingShields };
  }

  @Post('reward')
  @UseGuards(DeviceAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Earn shields by watching a rewarded video' })
  @ApiHeader({ name: 'x-device-id', required: true })
  @ApiResponse({ status: 201, description: 'Shields rewarded successfully' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async rewardShield(
    @CurrentUser() user: User,
    @Body() dto: RewardShieldDto,
  ) {
    const result = await this.shieldsService.addShields(user.id, dto.source);
    return { shieldsAdded: result.added, totalShields: result.total };
  }
}
