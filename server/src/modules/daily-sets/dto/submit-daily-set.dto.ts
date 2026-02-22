import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsInt,
  Min,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GameResultDto {
  @ApiProperty({
    description: 'ID of the question',
    example: 'clxyz1234567890',
  })
  @IsString()
  questionId: string;

  @ApiProperty({
    description: 'Result of the game',
    enum: ['correct', 'incorrect'],
    example: 'correct',
  })
  @IsEnum(['correct', 'incorrect'])
  result: string;

  @ApiProperty({
    description: 'Time spent on the question in seconds',
    minimum: 0,
    example: 12,
  })
  @IsInt()
  @Min(0)
  timeSpentSeconds: number;
}

export class SubmitDailySetDto {
  @ApiProperty({
    description: 'Array of 5 game results, one per question',
    type: [GameResultDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GameResultDto)
  @ArrayMinSize(5)
  @ArrayMaxSize(5)
  results: GameResultDto[];
}
