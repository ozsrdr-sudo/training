import type { Greeks, OptionType } from './types';

export function normCdf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x) / Math.sqrt(2);
  const t = 1 / (1 + p * ax);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
  return 0.5 * (1 + sign * y);
}

export function normPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

export function blackScholes(
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  type: OptionType
): Greeks {
  if (T <= 0) {
    const intr = type === 'C' ? Math.max(S - K, 0) : Math.max(K - S, 0);
    return {
      price: intr,
      delta: type === 'C' ? (S > K ? 1 : 0) : (S < K ? -1 : 0),
      theta: 0,
      vega: 0,
    };
  }
  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;
  const discK = K * Math.exp(-r * T);
  let price: number;
  let delta: number;
  let theta: number;
  if (type === 'C') {
    price = S * normCdf(d1) - discK * normCdf(d2);
    delta = normCdf(d1);
    theta = (-S * normPdf(d1) * sigma / (2 * sqrtT) - r * discK * normCdf(d2)) / 365;
  } else {
    price = discK * normCdf(-d2) - S * normCdf(-d1);
    delta = normCdf(d1) - 1;
    theta = (-S * normPdf(d1) * sigma / (2 * sqrtT) + r * discK * normCdf(-d2)) / 365;
  }
  const vega = (S * normPdf(d1) * sqrtT) / 100;
  return { price, delta, theta, vega };
}
