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
import { AdminQuestionsService } from './admin-questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionQueryDto } from './dto/question-query.dto';

@ApiTags('admin/questions')
@ApiBearerAuth()
@UseGuards(AdminJwtGuard)
@Controller('admin/questions')
export class AdminQuestionsController {
  constructor(
    private readonly adminQuestionsService: AdminQuestionsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List questions with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of questions' })
  async findAll(@Query() query: QuestionQueryDto) {
    return this.adminQuestionsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single question by ID' })
  @ApiResponse({ status: 200, description: 'Question details' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async findOne(@Param('id') id: string) {
    return this.adminQuestionsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new question manually' })
  @ApiResponse({ status: 201, description: 'Question created' })
  async create(@Body() dto: CreateQuestionDto) {
    return this.adminQuestionsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a question' })
  @ApiResponse({ status: 200, description: 'Question updated' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateQuestionDto) {
    return this.adminQuestionsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a question' })
  @ApiResponse({ status: 200, description: 'Question deleted' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async remove(@Param('id') id: string) {
    return this.adminQuestionsService.remove(id);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve a question' })
  @ApiResponse({ status: 200, description: 'Question approved' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async approve(@Param('id') id: string) {
    return this.adminQuestionsService.approve(id);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject a question' })
  @ApiResponse({ status: 200, description: 'Question rejected' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async reject(@Param('id') id: string) {
    return this.adminQuestionsService.reject(id);
  }

  @Post('bulk-approve')
  @ApiOperation({ summary: 'Bulk approve multiple questions' })
  @ApiResponse({ status: 200, description: 'Questions approved' })
  async bulkApprove(@Body() body: { ids: string[] }) {
    return this.adminQuestionsService.bulkApprove(body.ids);
  }
}
