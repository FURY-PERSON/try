import type { CategoryWithCount } from './category';
import type { CollectionSummary } from './collection';

export type DailyStatus = {
  set: {
    id: string;
    date: string;
    theme: string;
    themeEn: string;
  } | null;
  isLocked: boolean;
  unlocksAt: string | null;
  lastResult: {
    score: number;
    correctAnswers: number;
    totalTimeSeconds: number;
  } | null;
};

export type DifficultyProgress = Record<
  string,
  { totalCount: number; answeredCount: number }
>;

export type HomeFeedCollection = CollectionSummary & {
  answeredCount?: number;
  isCompleted?: boolean;
};

export type HomeFeed = {
  daily: DailyStatus;
  categories: CategoryWithCount[];
  collections: HomeFeedCollection[];
  difficultyProgress?: DifficultyProgress;
  userProgress: {
    dailyCompleted: boolean;
    streak: number;
    nickname: string | null;
    avatarEmoji: string | null;
  };
};
