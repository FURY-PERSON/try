import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmojiDto {
  @ApiProperty({ example: '🦊', description: 'Emoji character' })
  @IsString()
  emoji: string;

  @ApiPropertyOptional({ example: 'animals', default: 'default', description: 'Emoji category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
