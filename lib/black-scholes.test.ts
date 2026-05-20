import { blackScholes, normCdf } from './black-scholes';

describe('normCdf', () => {
  it('matches known values', () => {
    expect(normCdf(0)).toBeCloseTo(0.5, 4);
    expect(normCdf(1)).toBeCloseTo(0.8413, 3);
    expect(normCdf(-1)).toBeCloseTo(0.1587, 3);
    expect(normCdf(1.96)).toBeCloseTo(0.975, 3);
  });
});

describe('Black-Scholes — Hull referans değerleri', () => {
  it('ATM call: bs(100, 100, 1, 0.05, 0.20, "C").price ≈ 10.45', () => {
    const g = blackScholes(100, 100, 1, 0.05, 0.20, 'C');
    expect(g.price).toBeCloseTo(10.4506, 2);
  });

  it('ATM put: bs(100, 100, 1, 0.05, 0.20, "P").price ≈ 5.57', () => {
    const g = blackScholes(100, 100, 1, 0.05, 0.20, 'P');
    expect(g.price).toBeCloseTo(5.5735, 2);
  });

  it('Call delta @ ATM ≈ 0.6368', () => {
    const g = blackScholes(100, 100, 1, 0.05, 0.20, 'C');
    expect(g.delta).toBeCloseTo(0.6368, 3);
  });

  it('Put delta @ ATM ≈ -0.3632', () => {
    const g = blackScholes(100, 100, 1, 0.05, 0.20, 'P');
    expect(g.delta).toBeCloseTo(-0.3632, 3);
  });
});

describe('Put-call parity: C - P = S - K·e^(-rT)', () => {
  const cases: Array<[number, number, number, number, number]> = [
    [100, 100, 1, 0.05, 0.20],
    [120, 100, 0.5, 0.04, 0.30],
    [80, 100, 2, 0.03, 0.25],
    [755.30, 750, 58 / 365, 0.045, 0.32],
  ];
  for (const [S, K, T, r, sigma] of cases) {
    it(`parity holds for S=${S} K=${K} T=${T} r=${r} σ=${sigma}`, () => {
      const c = blackScholes(S, K, T, r, sigma, 'C').price;
      const p = blackScholes(S, K, T, r, sigma, 'P').price;
      const rhs = S - K * Math.exp(-r * T);
      expect(c - p).toBeCloseTo(rhs, 6);
    });
  }
});

describe('Vade sonu (T ≤ 0)', () => {
  it('Call ITM: içsel değer', () => {
    expect(blackScholes(120, 100, 0, 0.05, 0.20, 'C').price).toBe(20);
  });

  it('Call OTM: 0', () => {
    expect(blackScholes(80, 100, 0, 0.05, 0.20, 'C').price).toBe(0);
  });

  it('Put ITM: içsel değer', () => {
    expect(blackScholes(80, 100, 0, 0.05, 0.20, 'P').price).toBe(20);
  });

  it('Greek\'ler sıfırlanır', () => {
    const g = blackScholes(100, 100, 0, 0.05, 0.20, 'C');
    expect(g.theta).toBe(0);
    expect(g.vega).toBe(0);
  });

  it('Delta vade sonunda 0 veya 1 (call)', () => {
    expect(blackScholes(120, 100, 0, 0.05, 0.20, 'C').delta).toBe(1);
    expect(blackScholes(80, 100, 0, 0.05, 0.20, 'C').delta).toBe(0);
  });
});

describe('Theta günlük olmalı (negatif, küçük)', () => {
  it('1 yıllık ATM call için theta günlük cinste', () => {
    const g = blackScholes(100, 100, 1, 0.05, 0.20, 'C');
    expect(g.theta).toBeLessThan(0);
    expect(g.theta).toBeGreaterThan(-0.1);
  });
});

describe('Vega birim: ondalık IV puanı başına (sigma=0.20 → vega ≈ S·φ(d1)·√T / 100)', () => {
  it('ATM 1-yıl, S=100 için vega ≈ 0.3752', () => {
    const g = blackScholes(100, 100, 1, 0.05, 0.20, 'C');
    expect(g.vega).toBeCloseTo(0.3752, 3);
  });
});
