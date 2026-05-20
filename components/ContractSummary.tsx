'use client';

import { fmtPct, fmtUsd } from '@/lib/format';
import type { ContractData } from '@/lib/types';

function Stat({
  label,
  value,
  hint,
  valueClassName = 'text-fg-primary',
  children,
}: {
  label: string;
  value?: string;
  hint: string;
  valueClassName?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-bg-secondary p-2.5 rounded-md">
      <div className="text-[11px] text-fg-secondary mb-1">{label}</div>
      {children ?? <div className={`text-base font-medium ${valueClassName}`}>{value}</div>}
      <div className="text-[10px] text-fg-tertiary mt-1 leading-snug">{hint}</div>
    </div>
  );
}

export function ContractSummary({
  state,
  original,
  contracts,
  lastPointPnl,
}: {
  state: ContractData;
  original: ContractData;
  contracts: number;
  lastPointPnl: number | null;
}) {
  const totalCost = original.price0 * 100 * contracts;
  const pnlPct = lastPointPnl !== null && totalCost > 0 ? (lastPointPnl / totalCost) * 100 : null;

  let pnlText = '—';
  let pnlClass = 'text-fg-tertiary';
  if (lastPointPnl !== null && pnlPct !== null) {
    const sign = lastPointPnl >= 0 ? '+' : '−';
    pnlText = `${sign}$${Math.abs(lastPointPnl).toFixed(0)} (${
      lastPointPnl >= 0 ? '+' : '−'
    }${Math.abs(pnlPct).toFixed(1)}%)`;
    pnlClass = lastPointPnl >= 0 ? 'text-fg-success' : 'text-fg-danger';
  }

  return (
    <div className="mb-4">
      <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
        <Stat label="Spot" value={fmtUsd(state.spot)} hint="Dayanak hissenin bugünkü fiyatı." />
        <Stat
          label="Strike"
          value={fmtUsd(state.strike)}
          hint={`Kullanım fiyatı — opsiyonu işleme aldığında ${
            state.type === 'C' ? 'alabileceğin' : 'satabileceğin'
          } hisse fiyatı.`}
        />
        <Stat
          label="Prim (maliyet)"
          value={fmtUsd(state.price0)}
          hint="Hisse başına ödenen opsiyon fiyatı."
        />
        <Stat
          label="Breakeven"
          value={fmtUsd(state.strike + state.price0)}
          hint={`Vade sonunda kâra geçmek için spot ${state.type === 'C' ? '≥' : '≤'} bu seviye olmalı.`}
        />
        <Stat
          label="Kalan gün"
          value={String(state.days)}
          hint="Vade tarihine kalan gün; süre azaldıkça Theta erimesi hızlanır."
        />
        <Stat
          label="IV"
          value={fmtPct(state.iv)}
          hint="Zımni volatilite — piyasanın beklediği yıllık dalgalanma. Yüksek IV = pahalı opsiyon."
        />
      </div>
      <div className="flex justify-center gap-2 flex-wrap">
        <div className="flex-1 min-w-[200px] max-w-[320px]">
          <Stat
            label="Toplam ödenen"
            value={fmtUsd(totalCost)}
            hint={`${contracts} kontrat × 100 hisse × prim — kasandan çıkan toplam dolar.`}
          />
        </div>
        <div className="flex-1 min-w-[200px] max-w-[320px]">
          <Stat
            label="Son senaryo K/Z"
            value={pnlText}
            valueClassName={pnlClass}
            hint="En son tıkladığın nokta için mevcut Greek'lere göre kâr/zarar (dolar ve toplam maliyetin %'si)."
          />
        </div>
      </div>
    </div>
  );
}
