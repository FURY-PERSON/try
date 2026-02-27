import { IsString, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendNotificationDto {
  @ApiProperty({ description: 'Notification title', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  title: string;

  @ApiProperty({ description: 'Notification body', maxLength: 500 })
  @IsString()
  @MaxLength(500)
  body: string;

  @ApiProperty({
    description: 'Target audience',
    default: 'all',
    required: false,
  })
  @IsOptional()
  @IsString()
  target?: string = 'all';
}
