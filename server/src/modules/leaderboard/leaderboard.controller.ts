import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiHeader,
  ApiQuery,
} from '@nestjs/swagger';
import { LeaderboardService, LeaderboardResponse } from './leaderboard.service';
import { DeviceAuthGuard } from '../../common/guards/device-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('leaderboard')
@Controller('v1/leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('daily')
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({ summary: 'Get daily leaderboard' })
  @ApiHeader({ name: 'x-device-id', required: true })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Date in YYYY-MM-DD format (defaults to today)',
    example: '2026-02-14',
  })
  async getDaily(
    @CurrentUser() user: any,
    @Query('date') date?: string,
  ): Promise<LeaderboardResponse> {
    return this.leaderboardService.getDailyLeaderboard(user.id, date);
  }

  @Get('weekly')
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({ summary: 'Get weekly leaderboard (current week)' })
  @ApiHeader({ name: 'x-device-id', required: true })
  async getWeekly(@CurrentUser() user: any): Promise<LeaderboardResponse> {
    return this.leaderboardService.getWeeklyLeaderboard(user.id);
  }

  @Get('alltime')
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({ summary: 'Get all-time leaderboard' })
  @ApiHeader({ name: 'x-device-id', required: true })
  async getAllTime(@CurrentUser() user: any): Promise<LeaderboardResponse> {
    return this.leaderboardService.getAllTimeLeaderboard(user.id);
  }
}
