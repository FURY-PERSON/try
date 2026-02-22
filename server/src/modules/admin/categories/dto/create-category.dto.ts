import { IsString, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Наука', description: 'Category name in Russian' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Science', description: 'Category name in English' })
  @IsString()
  nameEn: string;

  @ApiProperty({
    example: 'science',
    description: 'Unique slug for the category',
  })
  @IsString()
  slug: string;

  @ApiProperty({ example: 'flask', description: 'Icon name' })
  @IsString()
  icon: string;

  @ApiPropertyOptional({ default: true, description: 'Whether the category is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 0, description: 'Sort order' })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
