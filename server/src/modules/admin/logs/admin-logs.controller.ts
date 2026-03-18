import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';
import { AdminLogsService } from './admin-logs.service';
import { LogsQueryDto } from './dto/logs-query.dto';

@ApiTags('admin/logs')
@ApiBearerAuth()
@UseGuards(AdminJwtGuard)
@Controller('admin/logs')
export class AdminLogsController {
  constructor(private readonly adminLogsService: AdminLogsService) {}

  @Get()
  @ApiOperation({ summary: 'List application logs' })
  async findAll(@Query() query: LogsQueryDto) {
    return this.adminLogsService.findAll(query);
  }

  @Get('types')
  @ApiOperation({ summary: 'Get log type counts for grouping' })
  async getTypes() {
    return this.adminLogsService.getTypes();
  }
}
