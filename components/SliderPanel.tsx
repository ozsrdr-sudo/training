'use client';

import { fmtPct, fmtSignedPct } from '@/lib/format';
import type { ActiveTab, ContractData, PricingMode } from '@/lib/types';

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
  help: string;
  disabled?: boolean;
}

function SliderRow({ label, value, min, max, step, display, onChange, help, disabled = false }: SliderRowProps) {
  return (
    <>
      <div className="grid items-center gap-2.5" style={{ gridTemplateColumns: '70px 1fr 70px' }}>
        <label className={`text-[13px] ${disabled ? 'text-fg-tertiary' : ''}`}>{label}</label>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={disabled ? 'opacity-50 cursor-not-allowed' : ''}
        />
        <span className={`font-mono text-xs text-right ${disabled ? 'text-fg-tertiary' : 'text-fg-secondary'}`}>{display}</span>
      </div>
      <div className="text-[11px] text-fg-secondary mt-0.5 mb-2.5 ml-[80px] leading-snug">{help}</div>
    </>
  );
}

function ReadOnlyBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-bg-secondary px-3 py-2.5 rounded-md font-mono text-xs text-center">
      {label} = <span>{value}</span>
    </div>
  );
}

export interface SliderPanelProps {
  activeTab: ActiveTab;
  onTabChange: (t: ActiveTab) => void;
  mode: PricingMode;
  state: ContractData;
  original: ContractData;
  dIV: number;
  contracts: number;
  onDeltaChange: (v: number) => void;
  onThetaChange: (v: number) => void;
  onVegaChange: (v: number) => void;
  onDIVChange: (v: number) => void;
  onSpotChange: (v: number) => void;
  onIVChange: (v: number) => void;
  onDaysChange: (v: number) => void;
  onRChange: (v: number) => void;
  onReset: () => void;
}

export function SliderPanel(props: SliderPanelProps) {
  const {
    activeTab,
    onTabChange,
    mode,
    state,
    original,
    dIV,
    contracts,
    onDeltaChange,
    onThetaChange,
    onVegaChange,
    onDIVChange,
    onSpotChange,
    onIVChange,
    onDaysChange,
    onRChange,
    onReset,
  } = props;

  const greekDisabled = mode === 'bs';
  const greekHelpSuffix = greekDisabled
    ? ' (BS modunda kilitli — Greek\'ler BS hesabının çıktısıdır, girdisi değil.)'
    : '';

  const N = Math.max(1, contracts);
  const positionScale = 100 * N;
  const fmtFormula = (perShare: number, perShareDecimals = 2, resultDecimals = 0) =>
    `${perShare.toFixed(perShareDecimals)} × 100 × ${N} = ${(perShare * positionScale).toFixed(resultDecimals)}`;

  return (
    <div
      className="bg-bg-primary border border-border-tertiary rounded-md p-3.5 mb-2.5"
      style={{ borderWidth: '0.5px' }}
    >
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {(['greek', 'param'] as ActiveTab[]).map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={`text-[13px] px-3 py-1.5 rounded-md border transition-colors ${
                active
                  ? 'bg-bg-info text-fg-info border-border-info'
                  : 'bg-bg-primary text-fg-primary border-border-tertiary hover:bg-bg-secondary'
              }`}
              style={{ borderWidth: '0.5px' }}
            >
              {tab === 'greek' ? 'Greek Play' : 'Greek Parametre Play'}
            </button>
          );
        })}
        <button
          type="button"
          onClick={onReset}
          className="ml-auto text-xs px-2.5 py-1.5 rounded-md border border-border-tertiary bg-bg-primary text-fg-primary hover:bg-bg-secondary"
          style={{ borderWidth: '0.5px' }}
        >
          Orijinale dön
        </button>
      </div>

      {activeTab === 'greek' && (
        <div>
          {greekDisabled && (
            <div className="bg-bg-secondary text-fg-secondary text-[11px] rounded-md px-3 py-2 mb-3 leading-snug">
              <strong>BS modu:</strong> Δ/Θ/ν aşağıda kilitli — Black-Scholes Greek&apos;leri sıfırdan hesapladığı için bu slider&apos;larla değişmez. Greek&apos;leri etkilemek için <em>Greek Parametre Play</em> tab&apos;ından S/σ/T/r oynat, ya da Lineer mod&apos;a geç. ΔIV slider&apos;ı BS modunda da etki eder.
            </div>
          )}
          <SliderRow
            label="Δ Delta"
            min={state.type === 'C' ? 0 : -1 * positionScale}
            max={state.type === 'C' ? 1 * positionScale : 0}
            step={1}
            value={state.delta * positionScale}
            display={(state.delta * positionScale).toFixed(0)}
            onChange={(v) => onDeltaChange(v / positionScale)}
            disabled={greekDisabled}
            help={
              (state.type === 'C'
                ? `Call delta: hisse $1 yukarı → pozisyonun ${(state.delta * positionScale).toFixed(0)}$ kazanır. Hesap: ${fmtFormula(state.delta)}.`
                : `Put delta: hisse $1 yukarı → pozisyonun ${(state.delta * positionScale).toFixed(0)}$ değişir (negatif olduğu için kaybeder). Hesap: ${fmtFormula(state.delta)}.`) + greekHelpSuffix
            }
          />
          <SliderRow
            label="Θ Theta"
            min={-0.5 * positionScale}
            max={0}
            step={1}
            value={state.theta * positionScale}
            display={(state.theta * positionScale).toFixed(0)}
            onChange={(v) => onThetaChange(v / positionScale)}
            disabled={greekDisabled}
            help={`Her gün pozisyondan ${Math.abs(state.theta * positionScale).toFixed(0)}$ erir (zaman değeri kaybı). Vadeye yaklaştıkça hızlanır. Hesap: ${fmtFormula(state.theta)}.` + greekHelpSuffix}
          />
          <SliderRow
            label="ν Vega"
            min={0}
            max={2 * positionScale}
            step={1}
            value={state.vega * positionScale}
            display={(state.vega * positionScale).toFixed(0)}
            onChange={(v) => onVegaChange(v / positionScale)}
            disabled={greekDisabled}
            help={`IV %1 değişirse pozisyon ${(state.vega * positionScale).toFixed(0)}$ hareket eder. ΔIV slider'ıyla dene. Hesap: ${fmtFormula(state.vega)}.` + greekHelpSuffix}
          />
          <div className="grid items-center gap-2.5" style={{ gridTemplateColumns: '70px 1fr 70px' }}>
            <label className="text-[13px] text-fg-tertiary" title="Gamma — Delta'nın türevi. S/σ/T/σ'den hesaplanır, slider'la oynatılmaz.">Γ Gamma</label>
            <div className="text-[11px] text-fg-secondary leading-snug">
              Hisse $1 hareket → Delta&apos;nın değişimi (Δ&apos;nın eğimi).{' '}
              <strong>BS</strong> (Black-Scholes — opsiyon fiyatlama modeli, Fischer Black + Myron Scholes 1973) den hesaplanır;
              Yahoo Greek vermez, biz lokalde S/K/T/σ/r&apos;den çözüyoruz.{' '}
              <strong>Pratik kullanım: hedging.</strong> 1 kontrat aldın, delta&apos;n {(original.delta * 100).toFixed(0)} (={original.delta.toFixed(2)}×100).
              Hisse $1 yukarı çıktı → yeni delta {(original.delta * 100).toFixed(0)} + {(original.gamma * 100).toFixed(2)} = {(original.delta * 100 + original.gamma * 100).toFixed(2)}.
              Hedge kuruyorsan kaç hisse short almak gerektiği bu kadar değişir. IB de bu yüzden per-kontrat gösterir — trader doğrudan kullanır.
              Hesap: {fmtFormula(original.gamma, 4, 2)}.
              <div className="mt-1 text-fg-tertiary">
                <em>Not:</em> Greek Play tab&apos;ında Δ/Θ/ν bağımsız scrub edilir, Γ sabit kalır. Gerçek BS bağlantısını görmek için <strong>Greek Parametre Play</strong> tab&apos;ına geç — S/σ/T değiştir, Γ da koordineli yenilenir.
              </div>
            </div>
            <span className="font-mono text-xs text-right text-fg-secondary">{(original.gamma * positionScale).toFixed(2)}</span>
          </div>
          <div className="mb-2.5" />
          <SliderRow
            label="ΔIV sim"
            min={-0.2}
            max={0.2}
            step={0.01}
            value={dIV}
            display={fmtSignedPct(dIV)}
            onChange={onDIVChange}
            help="Senaryo: IV %X değişirse ne olur? Vega'nın etkisini bu slider'la görürsün. BS modunda da etki eder."
          />
          <div className="bg-bg-secondary px-3 py-2.5 rounded-md font-mono text-xs mt-2 leading-relaxed">
            ΔPrim ≈ Δ·(S−S₀) + Θ·Δt + ν·ΔIV
          </div>
        </div>
      )}

      {activeTab === 'param' && (
        <div>
          {mode === 'bs' && (
            <div className="bg-bg-secondary text-fg-secondary text-[11px] rounded-md px-3 py-2 mb-3 leading-snug">
              <strong>BS modu:</strong> S spot aşağıda kilitli — Black-Scholes formülü her senaryo noktasının kendi S&apos;ini girdi alır, &quot;bugünkü spot&quot; varsayımı sonucu etkilemez. σ IV, T gün, r faiz aktif. Spot&apos;u senaryo üzerinde test etmek için Lineer mod&apos;a geç.
            </div>
          )}
          <SliderRow
            label="S spot"
            min={Math.round(original.spot * 0.5)}
            max={Math.round(original.spot * 1.5)}
            step={1}
            value={state.spot}
            display={'$' + Math.round(state.spot)}
            onChange={onSpotChange}
            disabled={mode === 'bs'}
            help="Hisse fiyatı. Spot strike'a yaklaştıkça Delta 0.5'e gider."
          />
          <SliderRow
            label="σ IV"
            min={0.05}
            max={1.5}
            step={0.05}
            value={state.iv}
            display={fmtPct(state.iv)}
            onChange={onIVChange}
            help="Zımni volatilite. Yüksek IV = pahalı opsiyon. Bilanço sonrası IV crush. Adım %5."
          />
          <SliderRow
            label="T gün"
            min={1}
            max={Math.max(Math.round(original.days * 2), 90)}
            step={1}
            value={state.days}
            display={state.days + ' g'}
            onChange={onDaysChange}
            help="Vadeye kalan gün. Süre azaldıkça Theta büyür ve OTM time value buharlaşır — alt grafikteki K/Z eğrisinde belirgin görünür."
          />
          <SliderRow
            label="r faiz"
            min={0}
            max={0.2}
            step={0.005}
            value={state.r}
            display={(state.r * 100).toFixed(1) + '%'}
            onChange={onRChange}
            help="Risksiz faiz oranı. Call primlerini hafif artırır, Put'ları azaltır. Adım %0.5."
          />
          <div className="grid grid-cols-4 gap-2 mt-2">
            <ReadOnlyBox label="Δ" value={`${(state.delta * positionScale).toFixed(0)}`} />
            <ReadOnlyBox label="Γ" value={`${(state.gamma * positionScale).toFixed(2)}`} />
            <ReadOnlyBox label="Θ" value={`${(state.theta * positionScale).toFixed(0)}`} />
            <ReadOnlyBox label="ν" value={`${(state.vega * positionScale).toFixed(0)}`} />
          </div>
          <div className="text-[10px] text-fg-tertiary mt-1 text-center leading-snug">
            Per-pozisyon (×100 × {N} kontrat). Per-hisse: Δ {state.delta.toFixed(2)} · Γ {state.gamma.toFixed(4)} · Θ {state.theta.toFixed(2)} · ν {state.vega.toFixed(2)}.
          </div>
        </div>
      )}
    </div>
  );
}
