import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CollectionResultDto } from './submit-collection.dto';

export class SaveProgressDto {
  @ApiProperty({ type: [CollectionResultDto], description: 'Array of results to save' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CollectionResultDto)
  results: CollectionResultDto[];
}
