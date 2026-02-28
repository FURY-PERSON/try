import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFeatureFlagDto {
  @ApiProperty({
    example: 'show_ads',
    description: 'Unique snake_case key (letters, digits, underscores; starts with a letter)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z][a-z0-9_]*$/, {
    message: 'key must be snake_case: lowercase letters, digits, underscores, starting with a letter',
  })
  key: string;

  @ApiProperty({ example: 'Показ рекламы', description: 'Human-readable flag name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Глобальное управление показом рекламы' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @ApiPropertyOptional({
    example: { variant: 'v2', maxPerDay: 5 },
    description: 'Optional JSON payload attached to the flag',
  })
  @IsObject()
  @IsOptional()
  payload?: Record<string, unknown>;
}
