import { IsArray, ValidateNested, IsString, IsEnum, IsInt, IsBoolean, IsOptional, Min, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CollectionResultDto {
  @ApiProperty({ description: 'ID of the question' })
  @IsString()
  questionId: string;

  @ApiProperty({ enum: ['correct', 'incorrect'], description: 'Answer result' })
  @IsEnum(['correct', 'incorrect'])
  result: string;

  @ApiProperty({ minimum: 0, description: 'Time spent in seconds' })
  @IsInt()
  @Min(0)
  timeSpentSeconds: number;

  @ApiProperty({ required: false, description: 'Whether a shield was used on this question' })
  @IsBoolean()
  @IsOptional()
  shieldUsed?: boolean;
}

export class SubmitCollectionDto {
  @ApiProperty({ type: [CollectionResultDto], description: 'Array of results' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CollectionResultDto)
  @ArrayMinSize(1)
  results: CollectionResultDto[];
}
