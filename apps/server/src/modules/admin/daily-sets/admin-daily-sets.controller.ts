import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';
import { AdminDailySetsService } from './admin-daily-sets.service';
import { CreateDailySetDto } from './dto/create-daily-set.dto';
import { UpdateDailySetDto } from './dto/update-daily-set.dto';
import { DailySetQueryDto } from './dto/daily-set-query.dto';

@ApiTags('admin/daily-sets')
@ApiBearerAuth()
@UseGuards(AdminJwtGuard)
@Controller('admin/daily-sets')
export class AdminDailySetsController {
  constructor(
    private readonly adminDailySetsService: AdminDailySetsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List daily sets with pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of daily sets' })
  async findAll(@Query() query: DailySetQueryDto) {
    return this.adminDailySetsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a daily set with its questions' })
  @ApiResponse({ status: 200, description: 'Daily set details with questions' })
  @ApiResponse({ status: 404, description: 'Daily set not found' })
  async findOne(@Param('id') id: string) {
    return this.adminDailySetsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new daily set' })
  @ApiResponse({ status: 201, description: 'Daily set created' })
  @ApiResponse({ status: 409, description: 'Daily set for this date already exists' })
  async create(@Body() dto: CreateDailySetDto) {
    return this.adminDailySetsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a daily set' })
  @ApiResponse({ status: 200, description: 'Daily set updated' })
  @ApiResponse({ status: 404, description: 'Daily set not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateDailySetDto) {
    return this.adminDailySetsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a daily set' })
  @ApiResponse({ status: 200, description: 'Daily set deleted' })
  @ApiResponse({ status: 404, description: 'Daily set not found' })
  async remove(@Param('id') id: string) {
    return this.adminDailySetsService.remove(id);
  }
}
