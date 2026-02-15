import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiParam,
} from '@nestjs/swagger';
import { QuestionsService } from './questions.service';
import { AnswerQuestionDto } from './dto/answer-question.dto';
import { QuestionFilterDto } from './dto/question-filter.dto';
import { DeviceAuthGuard } from '@/common/guards/device-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('questions')
@Controller('api/v1/questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get('random')
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({ summary: 'Get a random question the user has not answered correctly' })
  @ApiHeader({ name: 'x-device-id', description: 'Device identifier', required: true })
  @ApiResponse({ status: 200, description: 'Random question returned successfully' })
  @ApiResponse({ status: 404, description: 'No available questions found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid device ID' })
  async getRandomQuestion(
    @CurrentUser() user: any,
    @Query() filters: QuestionFilterDto,
  ) {
    return this.questionsService.getRandomQuestion(user.id, filters);
  }

  @Post(':id/answer')
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({ summary: 'Submit an answer for a question' })
  @ApiHeader({ name: 'x-device-id', description: 'Device identifier', required: true })
  @ApiParam({ name: 'id', description: 'Question ID' })
  @ApiResponse({
    status: 201,
    description: 'Answer recorded successfully',
    schema: {
      type: 'object',
      properties: {
        correct: { type: 'boolean', example: true },
        score: { type: 'number', example: 220 },
        fact: { type: 'string', example: 'The word "algorithm" comes from the name of Persian mathematician al-Khwarizmi.' },
        factSource: { type: 'string', example: 'Wikipedia' },
        factSourceUrl: { type: 'string', nullable: true, example: 'https://en.wikipedia.org/wiki/Algorithm' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Question not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid device ID' })
  async answerQuestion(
    @CurrentUser() user: any,
    @Param('id') questionId: string,
    @Body() dto: AnswerQuestionDto,
  ) {
    return this.questionsService.answerQuestion(user.id, questionId, dto);
  }
}
