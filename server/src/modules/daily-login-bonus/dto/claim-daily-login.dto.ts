import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class ClaimDailyLoginDto {
  @ApiProperty({
    example: '2026-04-22',
    description: 'Локальная дата пользователя в формате YYYY-MM-DD',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'localDate must be in YYYY-MM-DD format',
  })
  localDate: string;
}
