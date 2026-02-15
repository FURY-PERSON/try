export const GAME_TYPES = {
  ANAGRAM: 'anagram',
  COMPOSE_WORDS: 'compose_words',
  WORD_CHAIN: 'word_chain',
  WORD_SEARCH: 'word_search',
  GUESS_WORD: 'guess_word',
} as const;

export type GameType = (typeof GAME_TYPES)[keyof typeof GAME_TYPES];

export const GAME_TYPE_VALUES = Object.values(GAME_TYPES);

export const GAMES_PER_DAILY_SET = 5;
