'use client';

import { ContractSummary } from '@/components/ContractSummary';
import { ControlBar } from '@/components/ControlBar';
import { GreekExplainer } from '@/components/GreekExplainer';
import { PresetSelector } from '@/components/PresetSelector';
import { SearchBar } from '@/components/SearchBar';
import { SliderPanel } from '@/components/SliderPanel';
import { TutorBox } from '@/components/TutorBox';
import { PriceChart } from '@/components/charts/PriceChart';
import { ValueChart } from '@/components/charts/ValueChart';
import { useSimulator } from '@/hooks/useSimulator';

export default function Page() {
  const sim = useSimulator();

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-[1100px] mx-auto">
        <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
          <div>
            <h1 className="text-[22px] font-medium m-0">Opsiyon Dersi Simülatörü</h1>
            <p className="text-[13px] text-fg-secondary m-0">
              Greek&apos;lerin opsiyon fiyatına etkisini interaktif olarak öğrenin
            </p>
          </div>
          <PresetSelector value={sim.currentPresetKey} onChange={sim.loadPreset} />
        </div>

        <SearchBar />

        <ContractSummary state={sim.state} />

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

        <PriceChart
          original={sim.original}
          state={sim.state}
          points={sim.points}
          ptsMode={sim.ptsMode}
          yRangePct={sim.yRangePct}
          heatmap={sim.heatmap}
          priceAt={sim.priceAt}
          onAddPoint={sim.addPoint}
        />

        <ValueChart
          original={sim.original}
          state={sim.state}
          points={sim.points}
          priceAt={sim.priceAt}
        />

        <SliderPanel
          activeTab={sim.activeTab}
          onTabChange={sim.setActiveTab}
          mode={sim.mode}
          state={sim.state}
          original={sim.original}
          dIV={sim.dIV}
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
      </div>
    </main>
  );
}
