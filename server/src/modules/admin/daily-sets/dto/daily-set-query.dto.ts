import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '@/common/dto/pagination.dto';

export class DailySetQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by status (draft, published)' })
  @IsOptional()
  @IsString()
  status?: string;
}
