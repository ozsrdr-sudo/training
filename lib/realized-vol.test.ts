import { realizedVolatility } from './realized-vol';

describe('realizedVolatility', () => {
  it('returns null for too-short series', () => {
    expect(realizedVolatility([])).toBeNull();
    expect(realizedVolatility([100, 101])).toBeNull();
  });

  it('returns 0 for a constant series', () => {
    const closes = Array.from({ length: 20 }, () => 100);
    const rv = realizedVolatility(closes);
    expect(rv).toBeCloseTo(0, 8);
  });

  it('matches a known sigma for synthetic geometric series', () => {
    // Daily log return = 0.01 → annualized sigma = 0.01 × √252 ≈ 0.1587
    // Use alternating +0.01 / -0.01 returns to get nonzero variance
    const closes: number[] = [100];
    for (let i = 0; i < 60; i++) {
      const r = i % 2 === 0 ? 0.01 : -0.01;
      closes.push(closes[closes.length - 1] * Math.exp(r));
    }
    const rv = realizedVolatility(closes);
    expect(rv).not.toBeNull();
    expect(rv!).toBeCloseTo(0.01 * Math.sqrt(252), 2);
  });

  it('ignores non-finite / non-positive values', () => {
    const closes = [100, 101, NaN, 0, -5, 102, 103, 104, 105, 106];
    const rv = realizedVolatility(closes);
    expect(rv).not.toBeNull();
    expect(Number.isFinite(rv!)).toBe(true);
  });
});
