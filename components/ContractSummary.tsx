'use client';

import { fmtPct, fmtUsd } from '@/lib/format';
import type { ContractData } from '@/lib/types';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-bg-secondary p-2.5 rounded-md">
      <div className="text-[11px] text-fg-secondary mb-1">{label}</div>
      <div className="text-base font-medium">{value}</div>
    </div>
  );
}

export function ContractSummary({ state }: { state: ContractData }) {
  return (
    <div className="grid gap-2 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))' }}>
      <Stat label="Spot" value={fmtUsd(state.spot)} />
      <Stat label="Strike" value={fmtUsd(state.strike)} />
      <Stat label="Prim (maliyet)" value={fmtUsd(state.price0)} />
      <Stat label="Breakeven" value={fmtUsd(state.strike + state.price0)} />
      <Stat label="Kalan gün" value={String(state.days)} />
      <Stat label="IV" value={fmtPct(state.iv)} />
    </div>
  );
}
