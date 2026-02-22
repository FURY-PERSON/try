import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, Min } from 'class-validator';

export class AnswerQuestionDto {
  @ApiProperty({
    description: 'Result of the answer',
    enum: ['correct', 'incorrect'],
    example: 'correct',
  })
  @IsEnum(['correct', 'incorrect'])
  result: 'correct' | 'incorrect';

  @ApiProperty({
    description: 'Time spent answering in seconds',
    example: 12,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  timeSpentSeconds: number;
}
