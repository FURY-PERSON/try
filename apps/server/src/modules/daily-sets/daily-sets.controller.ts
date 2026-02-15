import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader, ApiParam } from '@nestjs/swagger';
import { DailySetsService } from './daily-sets.service';
import { SubmitDailySetDto } from './dto/submit-daily-set.dto';
import { DeviceAuthGuard } from '../../common/guards/device-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('daily-sets')
@Controller('api/v1/daily-sets')
export class DailySetsController {
  constructor(private readonly dailySetsService: DailySetsService) {}

  @Get('today')
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({ summary: "Get today's daily set with all questions" })
  @ApiHeader({ name: 'x-device-id', required: true })
  async getToday(@CurrentUser() user: any) {
    return this.dailySetsService.getTodaySet(user.id);
  }

  @Post(':id/submit')
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({ summary: 'Submit results for a daily set' })
  @ApiHeader({ name: 'x-device-id', required: true })
  @ApiParam({ name: 'id', description: 'Daily set ID' })
  async submit(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: SubmitDailySetDto,
  ) {
    return this.dailySetsService.submitDailySet(user.id, id, dto);
  }
}
