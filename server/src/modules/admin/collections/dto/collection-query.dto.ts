import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '@/common/dto/pagination.dto';

export class CollectionQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by status (draft, published)',
    enum: ['draft', 'published'],
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by type (featured, seasonal, thematic)',
    enum: ['featured', 'seasonal', 'thematic'],
  })
  @IsOptional()
  @IsString()
  type?: string;
}
