import type { OptionType } from './types';

export interface Preset {
  key: string;
  name: string;
  symbol: string;
  spot: number;
  strike: number;
  days: number;
  iv: number;
  type: OptionType;
}

export const PRESETS: Preset[] = [
  { key: 'META', name: 'META 750C — 17 Oca 2026', symbol: 'META', spot: 755.30, strike: 750, days: 58, iv: 0.32, type: 'C' },
  { key: 'MSTR', name: 'MSTR 165C — 15 Oca 2027', symbol: 'MSTR', spot: 178.50, strike: 165, days: 420, iv: 0.65, type: 'C' },
  { key: 'TSLA', name: 'TSLA 750C — 15 Ara 2028', symbol: 'TSLA', spot: 412.80, strike: 750, days: 1120, iv: 0.55, type: 'C' },
];

export const DEFAULT_RISK_FREE_RATE = 0.045;

export function getPreset(key: string): Preset {
  return PRESETS.find((p) => p.key === key) ?? PRESETS[0];
}
