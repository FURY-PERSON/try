import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader, ApiQuery } from '@nestjs/swagger';
import { LeaderboardService, LeaderboardResponse } from './leaderboard.service';
import { DeviceAuthGuard } from '../../common/guards/device-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

export type LeaderboardType = 'answers' | 'score';

@ApiTags('leaderboard')
@Controller('v1/leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('weekly')
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({ summary: 'Get weekly leaderboard (current week)' })
  @ApiHeader({ name: 'x-device-id', required: true })
  @ApiQuery({ name: 'type', required: false, enum: ['answers', 'score'] })
  async getWeekly(
    @CurrentUser() user: any,
    @Query('type') type?: LeaderboardType,
  ): Promise<LeaderboardResponse> {
    return this.leaderboardService.getWeeklyLeaderboard(user.id, type);
  }

  @Get('monthly')
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({ summary: 'Get monthly leaderboard (current month)' })
  @ApiHeader({ name: 'x-device-id', required: true })
  @ApiQuery({ name: 'type', required: false, enum: ['answers', 'score'] })
  async getMonthly(
    @CurrentUser() user: any,
    @Query('type') type?: LeaderboardType,
  ): Promise<LeaderboardResponse> {
    return this.leaderboardService.getMonthlyLeaderboard(user.id, type);
  }

  @Get('yearly')
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({ summary: 'Get yearly leaderboard (current year)' })
  @ApiHeader({ name: 'x-device-id', required: true })
  @ApiQuery({ name: 'type', required: false, enum: ['answers', 'score'] })
  async getYearly(
    @CurrentUser() user: any,
    @Query('type') type?: LeaderboardType,
  ): Promise<LeaderboardResponse> {
    return this.leaderboardService.getYearlyLeaderboard(user.id, type);
  }

  @Get('alltime')
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({ summary: 'Get all-time leaderboard' })
  @ApiHeader({ name: 'x-device-id', required: true })
  @ApiQuery({ name: 'type', required: false, enum: ['answers', 'score'] })
  async getAllTime(
    @CurrentUser() user: any,
    @Query('type') type?: LeaderboardType,
  ): Promise<LeaderboardResponse> {
    return this.leaderboardService.getAllTimeLeaderboard(user.id, type);
  }

  @Get('streak')
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({ summary: 'Get streak leaderboard' })
  @ApiHeader({ name: 'x-device-id', required: true })
  @ApiQuery({ name: 'period', required: false, enum: ['weekly', 'monthly', 'yearly', 'alltime'] })
  async getStreak(
    @CurrentUser() user: any,
    @Query('period') period?: string,
  ): Promise<LeaderboardResponse> {
    return this.leaderboardService.getStreakLeaderboard(user.id, period);
  }
}
