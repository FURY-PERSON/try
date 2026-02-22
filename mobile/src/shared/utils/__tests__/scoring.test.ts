import { calculateScore, calculateDailySetScore } from '../scoring';

describe('calculateScore', () => {
  it('returns 0 for incorrect answer', () => {
    expect(calculateScore(false, 3, 10)).toBe(0);
  });

  it('returns base score for difficulty 1, slow answer', () => {
    expect(calculateScore(true, 1, 30)).toBe(100);
  });

  it('applies difficulty multiplier', () => {
    expect(calculateScore(true, 1, 30)).toBe(100); // 100 * (1 + 0*0.2)
    expect(calculateScore(true, 3, 30)).toBe(140); // 100 * (1 + 2*0.2)
    expect(calculateScore(true, 5, 30)).toBe(180); // 100 * (1 + 4*0.2)
  });

  it('gives time bonus for fast answers', () => {
    // Under 30s threshold: bonus = (30 - time) * 2
    const score = calculateScore(true, 1, 10);
    expect(score).toBe(100 + 40); // base + timeBonus(20*2)
  });

  it('no time bonus at threshold', () => {
    const score = calculateScore(true, 1, 30);
    expect(score).toBe(100);
  });

  it('no time bonus above threshold', () => {
    const score = calculateScore(true, 1, 60);
    expect(score).toBe(100);
  });

  it('combines difficulty and time bonuses', () => {
    const score = calculateScore(true, 5, 10);
    // difficultyBonus = 100 * (1 + 4*0.2) = 180
    // timeBonus = (30 - 10) * 2 = 40
    expect(score).toBe(220);
  });
});

describe('calculateDailySetScore', () => {
  it('returns 0 for empty results', () => {
    expect(calculateDailySetScore([])).toBe(0);
  });

  it('sums individual scores', () => {
    const results = [
      { isCorrect: true, difficulty: 1, timeSpentSeconds: 30 },
      { isCorrect: false, difficulty: 3, timeSpentSeconds: 15 },
      { isCorrect: true, difficulty: 2, timeSpentSeconds: 20 },
    ];
    // First: 100, Second: 0, Third: 120 + 20 = 140
    expect(calculateDailySetScore(results)).toBe(100 + 0 + 140);
  });

  it('returns 0 for all incorrect', () => {
    const results = [
      { isCorrect: false, difficulty: 1, timeSpentSeconds: 5 },
      { isCorrect: false, difficulty: 5, timeSpentSeconds: 5 },
    ];
    expect(calculateDailySetScore(results)).toBe(0);
  });
});
