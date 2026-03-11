import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SupportService } from './support.service';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';

@ApiTags('support')
@Controller('v1/support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a support ticket' })
  @ApiResponse({ status: 201, description: 'Ticket created' })
  async create(@Body() dto: CreateSupportTicketDto) {
    return this.supportService.create(dto);
  }
}
