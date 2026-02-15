import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Preferred language code',
    example: 'en',
  })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({
    description: 'User display nickname',
    example: 'QuizMaster42',
  })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiPropertyOptional({
    description: 'Push notification token',
    example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
  })
  @IsOptional()
  @IsString()
  pushToken?: string;

  @ApiPropertyOptional({
    description: 'Whether push notifications are enabled',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;
}
