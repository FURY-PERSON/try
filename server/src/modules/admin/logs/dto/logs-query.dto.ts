import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '@/common/dto/pagination.dto';

export class LogsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by log type' })
  @IsOptional()
  @IsString()
  type?: string;
}
