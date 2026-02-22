import { shuffleArray, calculateGameScore, getResultMessage } from '../utils';

describe('shuffleArray', () => {
  it('returns array of same length', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffleArray(input);
    expect(result.length).toBe(input.length);
  });

  it('does not mutate original array', () => {
    const input = [1, 2, 3, 4, 5];
    const original = [...input];
    shuffleArray(input);
    expect(input).toEqual(original);
  });

  it('contains all original elements', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffleArray(input);
    expect(result.sort()).toEqual(input.sort());
  });

  it('handles empty array', () => {
    expect(shuffleArray([])).toEqual([]);
  });

  it('handles single element', () => {
    expect(shuffleArray([1])).toEqual([1]);
  });
});

describe('calculateGameScore', () => {
  it('returns 0 for incorrect answer', () => {
    expect(calculateGameScore(false, 5000, false)).toBe(0);
    expect(calculateGameScore(false, 5000, true)).toBe(0);
  });

  it('returns 100 base score for correct answer at 10s+', () => {
    expect(calculateGameScore(true, 10_000, false)).toBe(100);
    expect(calculateGameScore(true, 20_000, false)).toBe(100);
  });

  it('gives time bonus for fast answers under 10s', () => {
    const score = calculateGameScore(true, 0, false);
    expect(score).toBe(150); // 100 + 50
  });

  it('gives partial time bonus', () => {
    const score = calculateGameScore(true, 5000, false);
    expect(score).toBe(125); // 100 + 25
  });

  it('applies 50% hint penalty', () => {
    const withoutHint = calculateGameScore(true, 10_000, false);
    const withHint = calculateGameScore(true, 10_000, true);
    expect(withHint).toBe(Math.round(withoutHint * 0.5));
  });

  it('applies hint penalty to time bonus too', () => {
    const score = calculateGameScore(true, 0, true);
    expect(score).toBe(75); // (100 + 50) * 0.5
  });
});

describe('getResultMessage', () => {
  it('returns excellent for perfect score', () => {
    expect(getResultMessage(5, 5)).toBe('excellent');
  });

  it('returns good for 80%+', () => {
    expect(getResultMessage(4, 5)).toBe('good');
  });

  it('returns okay for 50%+', () => {
    expect(getResultMessage(3, 5)).toBe('okay');
  });

  it('returns tryAgain for under 50%', () => {
    expect(getResultMessage(2, 5)).toBe('tryAgain');
    expect(getResultMessage(0, 5)).toBe('tryAgain');
  });
});
