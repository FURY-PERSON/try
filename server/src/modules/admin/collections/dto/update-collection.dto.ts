import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateCollectionDto } from './create-collection.dto';

export class UpdateCollectionDto extends PartialType(CreateCollectionDto) {
  @ApiPropertyOptional({ enum: ['draft', 'published'], description: 'Collection status' })
  @IsOptional()
  @IsEnum(['draft', 'published'])
  status?: string;
}
