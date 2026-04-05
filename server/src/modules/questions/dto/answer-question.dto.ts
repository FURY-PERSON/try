import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

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

  @ApiPropertyOptional({
    description: 'Whether to use a shield to protect streak on wrong answer',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  useShield?: boolean;
}
