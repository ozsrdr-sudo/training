'use client';

import { useState } from 'react';
import { ContractPicker } from '@/components/ContractPicker';
import { ContractSummary } from '@/components/ContractSummary';
import { ControlBar } from '@/components/ControlBar';
import { GreekExplainer } from '@/components/GreekExplainer';
import { ManualPointEntry } from '@/components/ManualPointEntry';
import { SliderPanel } from '@/components/SliderPanel';
import { SymbolSearch } from '@/components/SymbolSearch';
import { TutorBox } from '@/components/TutorBox';
import { VisitTracker } from '@/components/VisitTracker';
import { PriceChart } from '@/components/charts/PriceChart';
import { ValueChart } from '@/components/charts/ValueChart';
import { useSimulator } from '@/hooks/useSimulator';

export default function Page() {
  const sim = useSimulator();
  const [pickerSymbol, setPickerSymbol] = useState<string>('');

  const lastPoint = sim.points.length > 0 ? sim.points[sim.points.length - 1] : null;
  const lastResult = lastPoint
    ? sim.priceAt({ S_new: lastPoint.s, days_passed: lastPoint.t, useOriginal: false })
    : null;
  const lastPointPnl = lastResult ? lastResult.pnl : null;

  let moneynessTag = '';
  if (sim.hasContract) {
    const { spot, strike, type, iv } = sim.state;
    const pctDiff = Math.abs(spot - strike) / strike;
    const isATM = pctDiff < 0.01;
    const isITM = !isATM && (type === 'C' ? spot > strike : spot < strike);
    moneynessTag = ` · ${isATM ? 'ATM' : isITM ? 'ITM' : 'OTM'} · IV ${(iv * 100).toFixed(0)}%`;
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-[1100px] mx-auto">
        <div className="mb-3">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="text-[22px] font-medium m-0">Opsiyon Dersi Simülatörü</h1>
            <span className="text-[11px] font-medium" style={{ color: '#dc2626' }}>
              ⚠ Buradaki veriler yalnızca deneme eğitimi amaçlıdır, geliştirme aşamasındadır; değerler ve hesaplamalarda yanlışlıklar olabilir.
            </span>
          </div>
          <p className="text-[13px] text-fg-secondary m-0 mt-1">
            Greek&apos;lerin opsiyon fiyatına etkisini interaktif olarak öğrenin
            {sim.hasContract && ` · ${sim.contractName}${moneynessTag}`}
          </p>
        </div>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-[11px] text-fg-secondary">Canlı sembol:</span>
          <SymbolSearch
            onSelect={(sym) => {
              setPickerSymbol(sym);
            }}
          />
          <span className="text-[11px] text-fg-secondary ml-2">Kontrat adedi:</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => sim.setContracts(Math.max(1, sim.contracts - 1))}
              disabled={sim.contracts <= 1}
              className="text-sm px-2 py-1 rounded-md border border-border-tertiary bg-bg-primary text-fg-primary hover:bg-bg-secondary disabled:opacity-40"
              style={{ borderWidth: '0.5px' }}
              aria-label="Azalt"
            >
              −
            </button>
            <input
              type="number"
              min={1}
              max={9999}
              step={1}
              value={sim.contracts}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (Number.isFinite(v) && v >= 1) sim.setContracts(v);
              }}
              className="w-16 text-center text-[13px] font-medium bg-bg-primary rounded-md border border-border-tertiary px-1.5 py-1"
              style={{ borderWidth: '0.5px' }}
            />
            <button
              type="button"
              onClick={() => sim.setContracts(Math.min(9999, sim.contracts + 1))}
              className="text-sm px-2 py-1 rounded-md border border-border-tertiary bg-bg-primary text-fg-primary hover:bg-bg-secondary"
              style={{ borderWidth: '0.5px' }}
              aria-label="Arttır"
            >
              +
            </button>
          </div>
        </div>

        {pickerSymbol && (
          <ContractPicker
            symbol={pickerSymbol}
            onCancel={() => setPickerSymbol('')}
            onLoad={(params) => {
              sim.loadCustomContract(params);
              setPickerSymbol('');
            }}
          />
        )}

        {!sim.hasContract ? (
          <div
            className="bg-bg-primary border border-border-tertiary rounded-md p-6 text-center"
            style={{ borderWidth: '0.5px' }}
          >
            <div className="text-base font-medium mb-2">Başlamak için bir sembol ara</div>
            <p className="text-[13px] text-fg-secondary m-0">
              Yukarıdaki <strong>Canlı sembol</strong> kutusuna ticker veya şirket adı yaz (örn. <code>AAPL</code>, <code>NVDA</code>, <code>tesla</code>),
              listeden bir sonuç seç ve sonra vade + tip + strike seçerek kontratı yükle.
            </p>
          </div>
        ) : (
          <>
            <ContractSummary
              state={sim.state}
              original={sim.original}
              contracts={sim.contracts}
              lastPointPnl={lastPointPnl}
            />

            <ControlBar
              mode={sim.mode}
              onModeChange={sim.setMode}
              ptsMode={sim.ptsMode}
              onPtsModeChange={sim.setPtsMode}
              yRangePct={sim.yRangePct}
              onYRangeChange={sim.setYRangePct}
              heatmap={sim.heatmap}
              onHeatmapToggle={() => sim.setHeatmap(!sim.heatmap)}
              onClearPoints={sim.clearPoints}
            />

            <TutorBox message={sim.tutorMessage} />

            <ManualPointEntry
              maxDays={sim.state.days}
              defaultSpot={sim.state.spot}
              onAddPoint={sim.addPoint}
            />

            <PriceChart
              original={sim.original}
              state={sim.state}
              points={sim.points}
              ptsMode={sim.ptsMode}
              yRangePct={sim.yRangePct}
              heatmap={sim.heatmap}
              contracts={sim.contracts}
              priceAt={sim.priceAt}
              onAddPoint={sim.addPoint}
            />

            <ValueChart
              original={sim.original}
              state={sim.state}
              points={sim.points}
              contracts={sim.contracts}
              mode={sim.mode}
              priceAt={sim.priceAt}
            />

            <SliderPanel
              activeTab={sim.activeTab}
              onTabChange={sim.setActiveTab}
              mode={sim.mode}
              state={sim.state}
              original={sim.original}
              dIV={sim.dIV}
              contracts={sim.contracts}
              onDeltaChange={sim.setDelta}
              onThetaChange={sim.setTheta}
              onVegaChange={sim.setVega}
              onDIVChange={sim.setDIV}
              onSpotChange={sim.setSpot}
              onIVChange={sim.setIV}
              onDaysChange={sim.setDays}
              onRChange={sim.setR}
              onReset={sim.reset}
            />

            <GreekExplainer />
          </>
        )}

        <VisitTracker />
      </div>
    </main>
  );
}
