import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { LeaderboardService, LeaderboardResponse } from './leaderboard.service';
import { DeviceAuthGuard } from '../../common/guards/device-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('leaderboard')
@Controller('v1/leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('weekly')
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({ summary: 'Get weekly leaderboard (current week)' })
  @ApiHeader({ name: 'x-device-id', required: true })
  async getWeekly(@CurrentUser() user: any): Promise<LeaderboardResponse> {
    return this.leaderboardService.getWeeklyLeaderboard(user.id);
  }

  @Get('monthly')
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({ summary: 'Get monthly leaderboard (current month)' })
  @ApiHeader({ name: 'x-device-id', required: true })
  async getMonthly(@CurrentUser() user: any): Promise<LeaderboardResponse> {
    return this.leaderboardService.getMonthlyLeaderboard(user.id);
  }

  @Get('yearly')
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({ summary: 'Get yearly leaderboard (current year)' })
  @ApiHeader({ name: 'x-device-id', required: true })
  async getYearly(@CurrentUser() user: any): Promise<LeaderboardResponse> {
    return this.leaderboardService.getYearlyLeaderboard(user.id);
  }

  @Get('alltime')
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({ summary: 'Get all-time leaderboard' })
  @ApiHeader({ name: 'x-device-id', required: true })
  async getAllTime(@CurrentUser() user: any): Promise<LeaderboardResponse> {
    return this.leaderboardService.getAllTimeLeaderboard(user.id);
  }
}
