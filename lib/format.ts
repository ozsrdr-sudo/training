export function fmtUsd(n: number, decimals = 2): string {
  return '$' + n.toFixed(decimals);
}

export function fmtPct(decimal: number, decimals = 0): string {
  return (decimal * 100).toFixed(decimals) + '%';
}

export function fmtSigned(n: number, decimals = 0): string {
  const sign = n >= 0 ? '+' : '';
  return sign + n.toFixed(decimals);
}

export function fmtSignedUsd(n: number, decimals = 0): string {
  const sign = n >= 0 ? '+' : '';
  return sign + '$' + n.toFixed(decimals);
}

export function fmtSignedPct(decimal: number, decimals = 0): string {
  const sign = decimal >= 0 ? '+' : '';
  return sign + (decimal * 100).toFixed(decimals) + '%';
}
