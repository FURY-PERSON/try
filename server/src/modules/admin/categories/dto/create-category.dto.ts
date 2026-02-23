import { IsString, IsOptional, IsBoolean, IsInt, Min, Matches } from 'class-validator';
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

  @ApiPropertyOptional({ example: '#34C759', description: 'Hex color for the category card' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'color must be a valid hex color (e.g. #FF5722)' })
  color?: string;

  @ApiPropertyOptional({ example: 'Вопросы о науке и технологиях', description: 'Description in Russian' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Questions about science and technology', description: 'Description in English' })
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional({ description: 'URL of the category image' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

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
