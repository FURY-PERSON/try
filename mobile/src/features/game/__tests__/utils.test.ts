import { calculateCardScore, getResultMessage } from '../utils';

describe('calculateCardScore', () => {
  it('returns 0 for incorrect answer', () => {
    expect(calculateCardScore(false, 5000)).toBe(0);
  });

  it('returns 100 base score for correct answer at 10s+', () => {
    expect(calculateCardScore(true, 10_000)).toBe(100);
    expect(calculateCardScore(true, 20_000)).toBe(100);
  });

  it('gives time bonus for fast answers under 10s', () => {
    const score = calculateCardScore(true, 0);
    expect(score).toBe(150); // 100 + 50
  });

  it('gives partial time bonus', () => {
    const score = calculateCardScore(true, 5000);
    expect(score).toBe(125); // 100 + 25
  });
});

describe('getResultMessage', () => {
  it('returns excellent for perfect score', () => {
    expect(getResultMessage(15, 15)).toBe('excellent');
  });

  it('returns good for 80%+', () => {
    expect(getResultMessage(12, 15)).toBe('good');
  });

  it('returns okay for 50%+', () => {
    expect(getResultMessage(8, 15)).toBe('okay');
  });

  it('returns tryAgain for under 50%', () => {
    expect(getResultMessage(5, 15)).toBe('tryAgain');
    expect(getResultMessage(0, 15)).toBe('tryAgain');
  });
});
