import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAnimalDto {
  @ApiProperty({ example: 'Лис', description: 'Animal name in Russian' })
  @IsString()
  textRu: string;

  @ApiProperty({ example: 'Fox', description: 'Animal name in English' })
  @IsString()
  textEn: string;

  @ApiProperty({ example: '🦊', description: 'Animal emoji' })
  @IsString()
  emoji: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
