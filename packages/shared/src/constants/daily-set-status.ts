export const DAILY_SET_STATUS = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  PUBLISHED: 'published',
} as const;

export type DailySetStatus = (typeof DAILY_SET_STATUS)[keyof typeof DAILY_SET_STATUS];

export const DAILY_SET_STATUS_VALUES = Object.values(DAILY_SET_STATUS);
