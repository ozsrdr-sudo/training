import { blackScholes } from './black-scholes';
import type { ContractData, PriceResult, PricingMode } from './types';

export function linearPriceWithGreeks(
  S_new: number,
  days_passed: number,
  dIV: number,
  original: ContractData,
  greeks: Pick<ContractData, 'delta' | 'theta' | 'vega'>
): number {
  return (
    original.price0 +
    greeks.delta * (S_new - original.spot) +
    greeks.theta * days_passed +
    greeks.vega * (dIV * 100)
  );
}

export function bsPriceAt(
  S_new: number,
  days_remaining: number,
  IV_new: number,
  r: number,
  state: Pick<ContractData, 'strike' | 'type'>
): number {
  if (days_remaining <= 0) {
    return state.type === 'C'
      ? Math.max(S_new - state.strike, 0)
      : Math.max(state.strike - S_new, 0);
  }
  return blackScholes(S_new, state.strike, days_remaining / 365, r, IV_new, state.type).price;
}

export interface PriceAtArgs {
  S_new: number;
  days_passed: number;
  useOriginal: boolean;
  mode: PricingMode;
  dIV: number;
  original: ContractData;
  state: ContractData;
  contracts: number;
}

export function priceAt(args: PriceAtArgs): PriceResult | null {
  const { S_new, days_passed, useOriginal, mode, dIV, original, state, contracts } = args;
  const src = useOriginal ? original : state;
  const days_remaining = src.days - days_passed;
  if (days_remaining < 0) return null;

  const multiplier = 100 * Math.max(1, contracts);

  if (mode === 'linear') {
    const greeks = useOriginal
      ? { delta: original.delta, theta: original.theta, vega: original.vega }
      : { delta: state.delta, theta: state.theta, vega: state.vega };
    const dIV_use = useOriginal ? 0 : dIV;
    const p = linearPriceWithGreeks(S_new, days_passed, dIV_use, original, greeks);
    return { price: p, pnl: (p - original.price0) * multiplier };
  }

  const IV_use = useOriginal ? original.iv : state.iv + dIV;
  const r_use = useOriginal ? original.r : state.r;
  const p = bsPriceAt(S_new, days_remaining, IV_use, r_use, src);
  return { price: p, pnl: (p - original.price0) * multiplier };
}
