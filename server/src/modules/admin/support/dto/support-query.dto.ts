import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '@/common/dto/pagination.dto';

export class SupportQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ['open', 'closed'] })
  @IsOptional()
  @IsString()
  status?: string;
}
