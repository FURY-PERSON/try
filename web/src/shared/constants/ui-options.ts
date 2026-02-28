import { QUESTION_STATUS } from './question-status';

export const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Элементарная',
  2: 'Лёгкая',
  3: 'Средняя',
  4: 'Сложная',
  5: 'Экспертная',
};

export const DIFFICULTY_OPTIONS: { value: string; label: string }[] = [
  { value: '1', label: '1 — Элементарная' },
  { value: '2', label: '2 — Лёгкая' },
  { value: '3', label: '3 — Средняя' },
  { value: '4', label: '4 — Сложная' },
  { value: '5', label: '5 — Экспертная' },
];

export const LANGUAGE_OPTIONS: { value: string; label: string }[] = [
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
];

export const IS_TRUE_OPTIONS: { value: string; label: string }[] = [
  { value: 'true', label: 'Факт (правда)' },
  { value: 'false', label: 'Фейк (ложь)' },
];

export const IS_TRUE_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Все' },
  { value: 'true', label: 'Факты' },
  { value: 'false', label: 'Фейки' },
];

export const LANGUAGE_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Все языки' },
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
];

export const DIFFICULTY_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Все сложности' },
  { value: '1', label: '1 — Элементарная' },
  { value: '2', label: '2 — Лёгкая' },
  { value: '3', label: '3 — Средняя' },
  { value: '4', label: '4 — Сложная' },
  { value: '5', label: '5 — Экспертная' },
];

export const STATUS_BADGE_VARIANT: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'danger'> = {
  draft: 'default',
  moderation: 'warning',
  approved: 'success',
  rejected: 'danger',
};

export const QUESTION_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Все статусы' },
  { value: QUESTION_STATUS.DRAFT, label: 'Черновик' },
  { value: QUESTION_STATUS.MODERATION, label: 'На модерации' },
  { value: QUESTION_STATUS.APPROVED, label: 'Одобрен' },
  { value: QUESTION_STATUS.REJECTED, label: 'Отклонён' },
];
