'use client';

import { Fragment } from 'react';
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

  const pctDiff = Math.abs(state.spot - state.strike) / state.strike;
  const isATM = pctDiff < 0.01;
  const isITM = !isATM && (state.type === 'C' ? state.spot > state.strike : state.spot < state.strike);
  const moneyness = isATM ? 'ATM' : isITM ? 'ITM' : 'OTM';
  const moneynessClass = isATM ? 'text-fg-info' : isITM ? 'text-fg-success' : 'text-fg-danger';
  const moneynessLabel = isATM ? 'At The Money (strike≈spot)' : isITM ? 'In The Money (kârda)' : 'Out of The Money (kârsız)';

  const greekRows: Array<{ symbol: string; name: string; perShare: string; perContract: string; hint: string }> = [
    {
      symbol: 'Δ',
      name: 'Delta',
      perShare: state.delta.toFixed(4),
      perContract: (state.delta * 100).toFixed(2),
      hint: 'Hisse $1 hareket → prim ≈ Δ$ hareket. IB Risk Navigator per-contract gösterir.',
    },
    {
      symbol: 'Γ',
      name: 'Gamma',
      perShare: state.gamma.toFixed(5),
      perContract: (state.gamma * 100).toFixed(3),
      hint: 'Hisse $1 hareket → Delta\'nın değişimi. Δ\'nın eğimi.',
    },
    {
      symbol: 'Θ',
      name: 'Theta',
      perShare: state.theta.toFixed(4) + '/gün',
      perContract: (state.theta * 100).toFixed(2) + '/gün',
      hint: 'Her gün primden ne kadar erir (zaman değeri kaybı). Negatif normal.',
    },
    {
      symbol: 'ν',
      name: 'Vega',
      perShare: state.vega.toFixed(4),
      perContract: (state.vega * 100).toFixed(2),
      hint: 'IV %1 hareket → primin değişimi.',
    },
  ];

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
      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="bg-bg-secondary p-2.5 rounded-md">
          <div className="text-[11px] text-fg-secondary mb-1">Kısaltmalar</div>
          <div className={`text-base font-medium ${moneynessClass}`}>
            {moneyness} · IV {fmtPct(state.iv)}
          </div>
          <div className="text-[10px] text-fg-tertiary mt-1 leading-snug space-y-0.5">
            <div><strong className="text-fg-secondary">ITM</strong> In The Money — opsiyon kârda (Call: spot{'>'}strike, Put: spot{'<'}strike)</div>
            <div><strong className="text-fg-secondary">ATM</strong> At The Money — strike ≈ spot (±%1)</div>
            <div><strong className="text-fg-secondary">OTM</strong> Out of The Money — kârsız taraf</div>
            <div><strong className="text-fg-secondary">IV</strong> Implied Volatility — örtük yıllık oynaklık (yüksek = prim pahalı)</div>
            <div className="mt-1 text-fg-secondary">Bu kontrat: <strong>{moneynessLabel}</strong></div>
          </div>
        </div>
        <Stat
          label="Prim (maliyet)"
          value={fmtUsd(state.price0)}
          hint={`1 hisse başına opsiyon fiyatı. 1 kontrat = 100 hisse → 1 kontrat maliyeti ${fmtUsd(state.price0 * 100)} (Yahoo'daki last/bid/ask).`}
        />
        <Stat
          label="Toplam ödenen"
          value={fmtUsd(totalCost)}
          hint={`${contracts} kontrat × 100 hisse × prim ${fmtUsd(state.price0)} = ${fmtUsd(totalCost)}. Long opsiyonda maksimum kaybın bu.`}
        />
        <Stat
          label="Son senaryo K/Z"
          value={pnlText}
          valueClassName={pnlClass}
          hint="Fiyat grafiğine son tıkladığın noktanın, mevcut Greek (slider) değerleriyle K/Z'si. Yeşil=kâr, kırmızı=zarar."
        />
      </div>

      <div className="mt-2 bg-bg-secondary rounded-md p-2.5">
        <div className="flex items-baseline justify-between mb-2 flex-wrap gap-1">
          <div className="text-[11px] text-fg-secondary">Greek&apos;ler</div>
          <div className="text-[10px] text-fg-tertiary leading-snug">
            IB Risk Navigator <em>per kontrat</em> (×100) gösterir; bu uygulama temel olarak <em>per hisse</em> hesaplar. 1 kontrat = 100 hisse.
          </div>
        </div>
        <div className="grid gap-1 text-[11px] font-mono" style={{ gridTemplateColumns: '60px 1fr 1fr' }}>
          <div className="text-fg-tertiary">&nbsp;</div>
          <div className="text-fg-tertiary text-right pr-2">per hisse</div>
          <div className="text-fg-tertiary text-right pr-2">per kontrat (×100)</div>
          {greekRows.map((g) => (
            <Fragment key={g.symbol}>
              <div className="text-fg-secondary" title={g.hint}>
                <strong className="text-fg-primary">{g.symbol}</strong> {g.name}
              </div>
              <div className="text-right pr-2 text-fg-primary">{g.perShare}</div>
              <div className="text-right pr-2 text-fg-primary">{g.perContract}</div>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
