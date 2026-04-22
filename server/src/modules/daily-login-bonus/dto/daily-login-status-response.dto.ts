import { ApiProperty } from '@nestjs/swagger';
import { DailyLoginRewardDto } from './daily-login-response.dto';

export class DailyLoginRewardItemDto extends DailyLoginRewardDto {
  @ApiProperty({ example: 1 })
  day: number;
}

export class DailyLoginStatusResponseDto {
  @ApiProperty({ example: true })
  isEnabled: boolean;

  @ApiProperty({ example: 3 })
  loginStreak: number;

  @ApiProperty({ example: 7 })
  bestLoginStreak: number;

  @ApiProperty({ example: true })
  claimedToday: boolean;

  @ApiProperty({
    type: DailyLoginRewardItemDto,
    nullable: true,
    description: 'Что получено за сегодня (если claimedToday=true)',
  })
  today: DailyLoginRewardItemDto | null;

  @ApiProperty({
    type: DailyLoginRewardItemDto,
    description:
      'Что пользователь получит в следующий заход (сегодня, если не claimed; завтра, если claimed)',
  })
  next: DailyLoginRewardItemDto;

  @ApiProperty({
    type: [DailyLoginRewardItemDto],
    description: 'Прогрессия наград из конфига (все дни, включая past/current/future)',
  })
  progression: DailyLoginRewardItemDto[];

  @ApiProperty({ example: 10 })
  capShields: number;

  @ApiProperty({ example: 10 })
  capStreak: number;
}
