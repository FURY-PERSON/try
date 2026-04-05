import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UseShieldDto {
  @ApiProperty({ description: 'ID of the question where shield is used' })
  @IsString()
  questionId: string;
}
