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

  const ivPct = state.iv * 100;
  let ivTier: { label: string; klass: string; note: string };
  if (ivPct < 30) {
    ivTier = { label: 'düşük', klass: 'text-fg-success', note: 'prim ucuz tarafta, piyasa büyük hareket beklemiyor' };
  } else if (ivPct < 50) {
    ivTier = { label: 'orta', klass: 'text-fg-info', note: 'tipik seviye, prim normal' };
  } else if (ivPct < 80) {
    ivTier = { label: 'yüksek', klass: 'text-brand-be', note: 'prim pahalıya yakın, piyasa belirgin hareket fiyatlıyor (kazanç dönemi, volatil sektör vb.)' };
  } else {
    ivTier = { label: 'çok yüksek', klass: 'text-fg-danger', note: 'prim pahalı, piyasa büyük hareket bekliyor (yaklaşan event, dar şirket, spekülasyon). Long opsiyon riski yüksek; event sonrası IV crush olabilir' };
  }

  const rv = state.rv;
  const rvPct = rv !== null ? rv * 100 : null;
  const ratio = rv !== null && rv > 0 ? state.iv / rv : null;
  let ratioTier: { label: string; klass: string } | null = null;
  if (ratio !== null) {
    if (ratio < 0.9) ratioTier = { label: 'ucuz', klass: 'text-fg-success' };
    else if (ratio < 1.2) ratioTier = { label: 'normal premium', klass: 'text-fg-info' };
    else if (ratio < 1.5) ratioTier = { label: 'pahalı', klass: 'text-brand-be' };
    else ratioTier = { label: 'çok pahalı', klass: 'text-fg-danger' };
  }

  const ivThresholds = [
    { range: '< %30', label: 'düşük', klass: 'text-fg-success', match: ivPct < 30 },
    { range: '%30 – 50', label: 'orta', klass: 'text-fg-info', match: ivPct >= 30 && ivPct < 50 },
    { range: '%50 – 80', label: 'yüksek', klass: 'text-brand-be', match: ivPct >= 50 && ivPct < 80 },
    { range: '> %80', label: 'çok yüksek', klass: 'text-fg-danger', match: ivPct >= 80 },
  ];
  const ratioThresholds = [
    { range: '< 0.9×', label: 'ucuz', klass: 'text-fg-success', match: ratio !== null && ratio < 0.9 },
    { range: '0.9 – 1.2×', label: 'normal premium', klass: 'text-fg-info', match: ratio !== null && ratio >= 0.9 && ratio < 1.2 },
    { range: '1.2 – 1.5×', label: 'pahalı', klass: 'text-brand-be', match: ratio !== null && ratio >= 1.2 && ratio < 1.5 },
    { range: '> 1.5×', label: 'çok pahalı', klass: 'text-fg-danger', match: ratio !== null && ratio >= 1.5 },
  ];

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
            <div className="mt-1 text-fg-secondary">
              Bu kontrat: <strong>{moneynessLabel}</strong>, <span className={`font-medium ${ivTier.klass}`}>{ivTier.note}</span>.
            </div>
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

      <div className="mt-2 bg-bg-secondary rounded-md p-3 text-[12px] leading-relaxed">
        <div className="text-[11px] text-fg-secondary mb-2">IV analizi</div>
        <div
          className="grid gap-x-4 gap-y-1.5 mb-2"
          style={{ gridTemplateColumns: rvPct !== null ? 'repeat(auto-fit, minmax(160px, 1fr))' : '1fr' }}
        >
          <div>
            <span className="text-fg-tertiary">IV </span>
            <span className="text-fg-primary font-medium">%{ivPct.toFixed(0)}</span>
            <span className={`ml-1.5 font-medium ${ivTier.klass}`}>({ivTier.label})</span>
            <div className="text-fg-secondary text-[11px] mt-0.5">{ivTier.note}.</div>
          </div>
          {rvPct !== null && (
            <div>
              <span className="text-fg-tertiary">RV </span>
              <span className="text-fg-primary font-medium">%{rvPct.toFixed(0)}</span>
              <span className="ml-1.5 text-fg-tertiary text-[11px]">(son {state.rvWindow} gün)</span>
              <div className="text-fg-secondary text-[11px] mt-0.5">Hissenin gerçekleşen yıllık oynaklığı.</div>
            </div>
          )}
          {ratio !== null && ratioTier !== null && (
            <div>
              <span className="text-fg-tertiary">IV/RV </span>
              <span className="text-fg-primary font-medium">{ratio.toFixed(2)}×</span>
              <span className={`ml-1.5 font-medium ${ratioTier.klass}`}>({ratioTier.label})</span>
              <div className="text-fg-secondary text-[11px] mt-0.5">
                Opsiyon hissenin son hareketine göre {ratio >= 1 ? `%${((ratio - 1) * 100).toFixed(0)} pahalı` : `%${((1 - ratio) * 100).toFixed(0)} ucuz`}.
              </div>
            </div>
          )}
          {rvPct === null && (
            <div className="text-fg-tertiary text-[11px]">
              RV verisi alınamadı (Yahoo geçmiş kapanışlar yok), IV/RV oranı gösterilemiyor.
            </div>
          )}
        </div>
        <div
          className="grid gap-x-4 gap-y-1 mb-2 pt-2 border-t border-border-tertiary text-[11px]"
          style={{ borderTopWidth: '0.5px', gridTemplateColumns: ratio !== null ? '1fr 1fr' : '1fr' }}
        >
          <div>
            <div className="text-fg-tertiary mb-1">Eşik tablosu — <strong className="text-fg-secondary">IV (mutlak)</strong></div>
            <div className="flex flex-wrap gap-1.5">
              {ivThresholds.map((t) => (
                <span
                  key={t.range}
                  className={`px-2 py-0.5 rounded ${
                    t.match
                      ? `bg-bg-primary ${t.klass} font-medium border border-border-secondary`
                      : 'text-fg-tertiary'
                  }`}
                  style={t.match ? { borderWidth: '0.5px' } : undefined}
                >
                  {t.range} <span className="opacity-80">{t.label}</span>
                </span>
              ))}
            </div>
          </div>
          {ratio !== null && (
            <div>
              <div className="text-fg-tertiary mb-1">Eşik tablosu — <strong className="text-fg-secondary">IV/RV oranı</strong></div>
              <div className="flex flex-wrap gap-1.5">
                {ratioThresholds.map((t) => (
                  <span
                    key={t.range}
                    className={`px-2 py-0.5 rounded ${
                      t.match
                        ? `bg-bg-primary ${t.klass} font-medium border border-border-secondary`
                        : 'text-fg-tertiary'
                    }`}
                    style={t.match ? { borderWidth: '0.5px' } : undefined}
                  >
                    {t.range} <span className="opacity-80">{t.label}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="text-[11px] text-fg-tertiary leading-snug pt-1.5 border-t border-border-tertiary" style={{ borderTopWidth: '0.5px' }}>
          <em>Not:</em> bu mutlak değil, başlangıç heuristic&apos;i. Daha doğru karar için <strong>IV rank</strong> (son 1 yıllık IV penceresinin bu noktası) gerekirdi, o veri Yahoo&apos;da yok. Mevcut değerler eğitim amaçlı hesaplamadır; gerçek IV rank için ücretli kaynaklar (Tastytrade, IB TWS, ORATS, IVolatility) gerekir.
        </div>
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
