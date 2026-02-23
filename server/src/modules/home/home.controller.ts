import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { HomeService } from './home.service';
import { DeviceAuthGuard } from '../../common/guards/device-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('home')
@Controller('v1/home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get('feed')
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({ summary: 'Get home screen feed with all sections' })
  @ApiHeader({ name: 'x-device-id', required: true })
  async getFeed(@CurrentUser() user: { id: string }) {
    return this.homeService.getFeed(user.id);
  }
}
