import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiHeader,
} from '@nestjs/swagger';
import { User } from '@prisma/client';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { DeviceAuthGuard } from '@/common/guards/device-auth.guard';
import { DailyLoginBonusService } from './daily-login-bonus.service';
import { ClaimDailyLoginDto } from './dto/claim-daily-login.dto';
import { DailyLoginResponseDto } from './dto/daily-login-response.dto';
import { DailyLoginStatusResponseDto } from './dto/daily-login-status-response.dto';

@ApiTags('daily-login-bonus')
@ApiHeader({ name: 'x-device-id', required: true })
@Controller('v1/users/me/daily-login')
export class DailyLoginBonusController {
  constructor(private readonly service: DailyLoginBonusService) {}

  @Post('claim')
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({
    summary:
      'Начислить (если ещё не начислен) ежедневный бонус за заход и вернуть инфо о наградах',
  })
  @ApiResponse({ status: 201, type: DailyLoginResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid x-device-id header' })
  async claim(
    @CurrentUser() user: User,
    @Body() dto: ClaimDailyLoginDto,
  ): Promise<DailyLoginResponseDto> {
    return this.service.claim(user.id, dto.localDate);
  }

  @Get('status')
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({
    summary:
      'Получить статус ежедневного бонуса: текущий стрик, завтрашнюю награду, прогрессию',
  })
  @ApiQuery({ name: 'localDate', example: '2026-04-22' })
  @ApiResponse({ status: 200, type: DailyLoginStatusResponseDto })
  async getStatus(
    @CurrentUser() user: User,
    @Query('localDate') localDate: string,
  ): Promise<DailyLoginStatusResponseDto> {
    if (!localDate || !/^\d{4}-\d{2}-\d{2}$/.test(localDate)) {
      throw new BadRequestException('localDate must be in YYYY-MM-DD format');
    }
    return this.service.getStatus(user.id, localDate);
  }
}
