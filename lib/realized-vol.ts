// Realized (historical) volatility from a closing price series.
// Output is annualized: std(log returns) × √252.

export function realizedVolatility(closes: number[]): number | null {
  if (!Array.isArray(closes) || closes.length < 5) return null;
  const cleaned = closes.filter((c) => typeof c === 'number' && Number.isFinite(c) && c > 0);
  if (cleaned.length < 5) return null;
  const returns: number[] = [];
  for (let i = 1; i < cleaned.length; i++) {
    returns.push(Math.log(cleaned[i] / cleaned[i - 1]));
  }
  if (returns.length < 2) return null;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((acc, r) => acc + (r - mean) * (r - mean), 0) / (returns.length - 1);
  const stdev = Math.sqrt(variance);
  return stdev * Math.sqrt(252);
}
