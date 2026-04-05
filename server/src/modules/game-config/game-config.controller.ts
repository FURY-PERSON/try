import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GameConfigService } from './game-config.service';

@ApiTags('game-config')
@Controller('v1/game-config')
export class GameConfigController {
  constructor(private readonly gameConfigService: GameConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Get game configuration (public)' })
  @ApiResponse({ status: 200, description: 'Game configuration' })
  async getConfig() {
    const streakBonus = await this.gameConfigService.getStreakBonusConfig();
    return { streakBonus };
  }
}
