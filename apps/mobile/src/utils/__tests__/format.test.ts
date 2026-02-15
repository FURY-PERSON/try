import { formatScore, formatCountdown, formatPercent, formatDate } from '../format';

describe('formatScore', () => {
  it('returns plain number for values under 1000', () => {
    expect(formatScore(0)).toBe('0');
    expect(formatScore(1)).toBe('1');
    expect(formatScore(999)).toBe('999');
  });

  it('formats thousands with K suffix', () => {
    expect(formatScore(1000)).toBe('1.0K');
    expect(formatScore(1500)).toBe('1.5K');
    expect(formatScore(999_999)).toBe('1000.0K');
  });

  it('formats millions with M suffix', () => {
    expect(formatScore(1_000_000)).toBe('1.0M');
    expect(formatScore(2_500_000)).toBe('2.5M');
  });
});

describe('formatCountdown', () => {
  it('returns 0:00 when target is in the past', () => {
    const past = new Date(Date.now() - 60_000);
    expect(formatCountdown(past)).toBe('0:00');
  });

  it('formats hours and minutes correctly', () => {
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000 + 30 * 60 * 1000);
    const result = formatCountdown(twoHoursFromNow);
    expect(result).toMatch(/^2ч 30м$/);
  });

  it('pads minutes with leading zero', () => {
    const oneHourFiveMin = new Date(Date.now() + 1 * 60 * 60 * 1000 + 5 * 60 * 1000);
    const result = formatCountdown(oneHourFiveMin);
    expect(result).toMatch(/^1ч 05м$/);
  });
});

describe('formatPercent', () => {
  it('returns 0% when total is 0', () => {
    expect(formatPercent(5, 0)).toBe('0%');
  });

  it('calculates percentage correctly', () => {
    expect(formatPercent(1, 2)).toBe('50%');
    expect(formatPercent(3, 4)).toBe('75%');
    expect(formatPercent(5, 5)).toBe('100%');
  });

  it('rounds to nearest integer', () => {
    expect(formatPercent(1, 3)).toBe('33%');
    expect(formatPercent(2, 3)).toBe('67%');
  });
});

describe('formatDate', () => {
  it('formats Date object', () => {
    const result = formatDate(new Date('2024-03-15'));
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('formats ISO string', () => {
    const result = formatDate('2024-03-15T00:00:00Z');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });
});
