import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';
import { AdminSupportService, SupportQueryDto } from './admin-support.service';
import { UpdateSupportTicketDto } from './dto/update-support-ticket.dto';

@ApiTags('admin/support')
@ApiBearerAuth()
@UseGuards(AdminJwtGuard)
@Controller('admin/support')
export class AdminSupportController {
  constructor(private readonly adminSupportService: AdminSupportService) {}

  @Get()
  @ApiOperation({ summary: 'List support tickets' })
  async findAll(@Query() query: SupportQueryDto) {
    return this.adminSupportService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket by id' })
  async findOne(@Param('id') id: string) {
    return this.adminSupportService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update ticket status' })
  async update(@Param('id') id: string, @Body() dto: UpdateSupportTicketDto) {
    return this.adminSupportService.update(id, dto);
  }
}
