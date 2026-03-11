import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdateSupportTicketDto {
  @ApiProperty({ enum: ['open', 'closed'] })
  @IsIn(['open', 'closed'])
  status: 'open' | 'closed';
}
