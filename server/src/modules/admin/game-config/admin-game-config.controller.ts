import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';
import { AdminGameConfigService } from './admin-game-config.service';
import { UpdateStreakBonusDto } from './dto/update-streak-bonus.dto';

@ApiTags('admin/game-config')
@ApiBearerAuth()
@UseGuards(AdminJwtGuard)
@Controller('admin/game-config')
export class AdminGameConfigController {
  constructor(
    private readonly adminGameConfigService: AdminGameConfigService,
  ) {}

  @Get('streak-bonus')
  @ApiOperation({ summary: 'Get current streak bonus configuration' })
  @ApiResponse({ status: 200, description: 'Streak bonus config' })
  async getStreakBonus() {
    return this.adminGameConfigService.getStreakBonus();
  }

  @Put('streak-bonus')
  @ApiOperation({ summary: 'Update streak bonus configuration' })
  @ApiResponse({ status: 200, description: 'Streak bonus config updated' })
  async updateStreakBonus(@Body() dto: UpdateStreakBonusDto) {
    return this.adminGameConfigService.updateStreakBonus(dto);
  }
}
