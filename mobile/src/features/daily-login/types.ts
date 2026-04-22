export type DailyLoginReward = {
  shields: number;
  streak: number;
};

export type DailyLoginRewardItem = DailyLoginReward & {
  day: number;
};

export type DailyLoginResponse = {
  claimed: boolean;
  disabled: boolean;
  dayInStreak: number;
  loginStreak: number;
  rewardToday: DailyLoginReward;
  rewardTomorrow: DailyLoginReward;
  shields: number;
  currentStreak: number;
};

export type DailyLoginStatus = {
  isEnabled: boolean;
  loginStreak: number;
  bestLoginStreak: number;
  claimedToday: boolean;
  today: DailyLoginRewardItem | null;
  next: DailyLoginRewardItem;
  progression: DailyLoginRewardItem[];
  capShields: number;
  capStreak: number;
};
