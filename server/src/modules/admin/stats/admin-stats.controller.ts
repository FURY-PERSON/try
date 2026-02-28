import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';
import { AdminStatsService } from './admin-stats.service';

@ApiTags('admin/stats')
@ApiBearerAuth()
@UseGuards(AdminJwtGuard)
@Controller('admin/stats')
export class AdminStatsController {
  constructor(private readonly adminStatsService: AdminStatsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard stats including users, questions, daily sets',
  })
  async getDashboard() {
    return this.adminStatsService.getDashboard();
  }

  @Get('questions')
  @ApiOperation({ summary: 'Get question statistics' })
  @ApiResponse({
    status: 200,
    description: 'Question stats: hardest, easiest, most shown',
  })
  async getQuestionStats() {
    return this.adminStatsService.getQuestionStats();
  }

}
