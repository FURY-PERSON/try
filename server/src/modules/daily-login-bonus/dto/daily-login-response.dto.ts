import { ApiProperty } from '@nestjs/swagger';

export class DailyLoginRewardDto {
  @ApiProperty({ example: 2 })
  shields: number;

  @ApiProperty({ example: 1 })
  streak: number;
}

export class DailyLoginResponseDto {
  @ApiProperty({
    example: true,
    description: 'true — бонус только что начислен; false — уже получен за этот день или система выключена',
  })
  claimed: boolean;

  @ApiProperty({
    example: false,
    description: 'true — механизм выключен в админке; клиент не должен показывать модалку',
  })
  disabled: boolean;

  @ApiProperty({ example: 3, description: 'Номер дня в текущем стрике логинов' })
  dayInStreak: number;

  @ApiProperty({ example: 3 })
  loginStreak: number;

  @ApiProperty({ type: DailyLoginRewardDto })
  rewardToday: DailyLoginRewardDto;

  @ApiProperty({ type: DailyLoginRewardDto })
  rewardTomorrow: DailyLoginRewardDto;

  @ApiProperty({ example: 8, description: 'Актуальное количество щитов у пользователя' })
  shields: number;

  @ApiProperty({ example: 5, description: 'Актуальный игровой currentStreak' })
  currentStreak: number;
}
