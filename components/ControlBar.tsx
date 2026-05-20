'use client';

import { ToggleGroup } from '@/components/ui/ToggleGroup';
import type { PointsMode, PricingMode, YRangePct } from '@/lib/types';

export interface ControlBarProps {
  mode: PricingMode;
  onModeChange: (m: PricingMode) => void;
  ptsMode: PointsMode;
  onPtsModeChange: (m: PointsMode) => void;
  yRangePct: YRangePct;
  onYRangeChange: (v: YRangePct) => void;
  heatmap: boolean;
  onHeatmapToggle: () => void;
  onClearPoints: () => void;
}

export function ControlBar({
  mode,
  onModeChange,
  ptsMode,
  onPtsModeChange,
  yRangePct,
  onYRangeChange,
  heatmap,
  onHeatmapToggle,
  onClearPoints,
}: ControlBarProps) {
  return (
    <div className="flex gap-1.5 mb-3 items-center flex-wrap">
      <span className="text-[11px] text-fg-secondary">Fiyatlama:</span>
      <ToggleGroup<PricingMode>
        value={mode}
        onChange={onModeChange}
        options={[
          { value: 'linear', label: 'Lineer' },
          { value: 'bs', label: 'Black-Scholes' },
        ]}
      />
      <span className="text-[11px] text-fg-secondary ml-3">Senaryo:</span>
      <ToggleGroup<PointsMode>
        value={ptsMode}
        onChange={onPtsModeChange}
        options={[
          { value: 'independent', label: 'Bağımsız' },
          { value: 'curve', label: 'Eğri' },
        ]}
      />
      <span className="text-[11px] text-fg-secondary ml-3">Y ±:</span>
      <select
        value={yRangePct}
        onChange={(e) => onYRangeChange(parseInt(e.target.value, 10) as YRangePct)}
        className="min-w-[70px] text-xs px-2 py-1 rounded-md border border-border-tertiary bg-bg-primary text-fg-primary"
        style={{ borderWidth: '0.5px' }}
      >
        <option value={15}>%15</option>
        <option value={30}>%30</option>
        <option value={50}>%50</option>
        <option value={100}>%100</option>
      </select>
      <button
        type="button"
        onClick={onHeatmapToggle}
        className={`ml-auto text-xs px-2.5 py-1 rounded-md border transition-colors ${
          heatmap
            ? 'bg-bg-info text-fg-info border-border-info'
            : 'bg-bg-primary text-fg-primary border-border-tertiary hover:bg-bg-secondary'
        }`}
        style={{ borderWidth: '0.5px' }}
      >
        Isı haritası
      </button>
      <button
        type="button"
        onClick={onClearPoints}
        className="text-[11px] px-2 py-1 rounded-md border border-border-tertiary bg-bg-primary text-fg-primary hover:bg-bg-secondary"
        style={{ borderWidth: '0.5px' }}
      >
        Noktaları sil
      </button>
    </div>
  );
}
