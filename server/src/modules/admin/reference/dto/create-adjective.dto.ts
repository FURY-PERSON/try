import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAdjectiveDto {
  @ApiProperty({ example: 'Быстрый', description: 'Adjective in Russian' })
  @IsString()
  textRu: string;

  @ApiProperty({ example: 'Swift', description: 'Adjective in English' })
  @IsString()
  textEn: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
