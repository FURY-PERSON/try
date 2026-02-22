import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, Min } from 'class-validator';

export class AnswerQuestionDto {
  @ApiProperty({
    description: 'User answer: true if they think the statement is a fact, false if they think it is a fake',
    example: true,
  })
  @IsBoolean()
  userAnswer: boolean;

  @ApiProperty({
    description: 'Time spent answering in seconds',
    example: 12,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  timeSpentSeconds: number;
}
