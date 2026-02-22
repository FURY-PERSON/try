export const QUESTION_STATUS = {
  DRAFT: 'draft',
  MODERATION: 'moderation',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type QuestionStatus = (typeof QUESTION_STATUS)[keyof typeof QUESTION_STATUS];

export const QUESTION_STATUS_VALUES = Object.values(QUESTION_STATUS);
