'use client';

import { Chart, type ChartConfiguration, type Plugin } from 'chart.js';
import { useEffect, useRef } from 'react';
import { ensureChartRegistered } from './chartSetup';
import type { ContractData, Point, PointsMode, PriceResult, YRangePct } from '@/lib/types';

export interface PriceChartProps {
  original: ContractData;
  state: ContractData;
  points: Point[];
  ptsMode: PointsMode;
  yRangePct: YRangePct;
  heatmap: boolean;
  priceAt: (args: { S_new: number; days_passed: number; useOriginal: boolean }) => PriceResult | null;
  onAddPoint: (t: number, s: number) => void;
}

function computeYRange(state: ContractData, yRangePct: YRangePct) {
  const be = state.strike + state.price0;
  const userMin = state.spot * (1 - yRangePct / 100);
  const userMax = state.spot * (1 + yRangePct / 100);
  return {
    min: Math.min(userMin, be * 0.9),
    max: Math.max(userMax, be * 1.1),
  };
}

export function PriceChart(props: PriceChartProps) {
  const { original, state, points, ptsMode, yRangePct, heatmap, priceAt } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const hoverRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef(props);
  propsRef.current = props;

  useEffect(() => {
    ensureChartRegistered();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const heatmapPlugin: Plugin = {
      id: 'heatmap',
      beforeDatasetsDraw(c) {
        if (!propsRef.current.heatmap) return;
        const area = c.chartArea;
        if (!area) return;
        const xScale = c.scales.x;
        const yScale = c.scales.y;
        const cols = 36;
        const rows = 26;
        const cw = (area.right - area.left) / cols;
        const ch = (area.bottom - area.top) / rows;
        const denom = Math.max(propsRef.current.original.price0 * 100, 500);
        const drawCtx = c.ctx;
        for (let i = 0; i < cols; i++) {
          for (let j = 0; j < rows; j++) {
            const tVal = xScale.min + ((xScale.max - xScale.min) * (i + 0.5)) / cols;
            const sVal = yScale.min + (yScale.max - yScale.min) * (1 - (j + 0.5) / rows);
            const r = propsRef.current.priceAt({ S_new: sVal, days_passed: tVal, useOriginal: false });
            if (!r) continue;
            const norm = Math.max(-1, Math.min(1, r.pnl / denom));
            drawCtx.fillStyle =
              norm >= 0
                ? `rgba(99, 153, 34, ${0.05 + norm * 0.35})`
                : `rgba(226, 75, 74, ${0.05 + -norm * 0.35})`;
            drawCtx.fillRect(area.left + i * cw, area.top + j * ch, cw + 1, ch + 1);
          }
        }
      },
    };

    const yr = computeYRange(state, yRangePct);
    const sortedPoints =
      ptsMode === 'curve'
        ? [...points].sort((a, b) => a.t - b.t).map((p) => ({ x: p.t, y: p.s }))
        : [];

    const config: ChartConfiguration = {
      type: 'scatter',
      data: {
        datasets: [
          {
            type: 'line',
            label: 'Eğri',
            data: sortedPoints,
            borderColor: '#3C3489',
            borderWidth: 2,
            borderDash: [5, 3],
            pointRadius: 0,
            fill: false,
            tension: 0,
            order: 1,
          },
          {
            type: 'line',
            label: 'Strike',
            data: [
              { x: 0, y: state.strike },
              { x: state.days, y: state.strike },
            ],
            borderColor: '#7F77DD',
            borderWidth: 1.5,
            borderDash: [6, 4],
            pointRadius: 0,
            fill: false,
            order: 2,
          },
          {
            type: 'line',
            label: 'Breakeven',
            data: [
              { x: 0, y: state.strike + state.price0 },
              { x: state.days, y: state.strike + state.price0 },
            ],
            borderColor: '#EF9F27',
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
            order: 3,
          },
          {
            type: 'line',
            label: 'Spot',
            data: [
              { x: 0, y: state.spot },
              { x: state.days, y: state.spot },
            ],
            borderColor: '#378ADD',
            borderWidth: 1.5,
            pointRadius: 0,
            fill: false,
            order: 4,
          },
          {
            type: 'scatter',
            label: 'Noktalar',
            data: points.map((p) => ({ x: p.t, y: p.s })),
            backgroundColor: '#3C3489',
            borderColor: '#FFFFFF',
            borderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8,
            order: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
        scales: {
          x: {
            type: 'linear',
            min: 0,
            max: state.days,
            title: { display: true, text: 'Zaman (gün)', font: { size: 11 } },
            ticks: { font: { size: 10 } },
            grid: { color: 'rgba(150,150,150,0.1)' },
          },
          y: {
            min: yr.min,
            max: yr.max,
            title: { display: true, text: 'Hisse fiyatı', font: { size: 11 } },
            ticks: {
              font: { size: 10 },
              callback: (v) => {
                const num = typeof v === 'number' ? v : parseFloat(String(v));
                const pct = ((num - state.spot) / state.spot) * 100;
                return '$' + num.toFixed(0) + ' (' + (pct >= 0 ? '+' : '') + pct.toFixed(0) + '%)';
              },
            },
            grid: { color: 'rgba(150,150,150,0.1)' },
          },
        },
      },
      plugins: [heatmapPlugin],
    };

    const chart = new Chart(ctx, config);
    chartRef.current = chart;

    const hoverEl = hoverRef.current;
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const xv = chart.scales.x.getValueForPixel(e.clientX - rect.left);
      const yv = chart.scales.y.getValueForPixel(e.clientY - rect.top);
      if (xv === undefined || yv === undefined) return;
      if (xv < 0 || xv > propsRef.current.state.days || yv < chart.scales.y.min || yv > chart.scales.y.max) {
        if (hoverEl) hoverEl.style.opacity = '0';
        return;
      }
      const r = propsRef.current.priceAt({ S_new: yv, days_passed: xv, useOriginal: false });
      if (!r) {
        if (hoverEl) hoverEl.style.opacity = '0';
        return;
      }
      if (!hoverEl) return;
      hoverEl.style.opacity = '1';
      const pct = ((yv - propsRef.current.state.spot) / propsRef.current.state.spot) * 100;
      const lines = hoverEl.children;
      (lines[0] as HTMLElement).textContent = `t = ${Math.round(xv)} gün`;
      (lines[1] as HTMLElement).textContent =
        `S = $${yv.toFixed(2)} (${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%)`;
      (lines[2] as HTMLElement).textContent = `Prim ≈ $${r.price.toFixed(2)}`;
      const kz = lines[3] as HTMLElement;
      kz.textContent = `K/Z: ${r.pnl >= 0 ? '+' : ''}$${r.pnl.toFixed(0)}`;
      kz.style.color = r.pnl >= 0 ? 'var(--color-text-success)' : 'var(--color-text-danger)';
    };
    const onLeave = () => {
      if (hoverEl) hoverEl.style.opacity = '0';
    };
    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const xv = chart.scales.x.getValueForPixel(e.clientX - rect.left);
      const yv = chart.scales.y.getValueForPixel(e.clientY - rect.top);
      if (xv === undefined || yv === undefined) return;
      if (xv < 0 || xv > propsRef.current.state.days || yv < chart.scales.y.min || yv > chart.scales.y.max) return;
      propsRef.current.onAddPoint(xv, yv);
    };

    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);
    canvas.addEventListener('click', onClick);

    return () => {
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
      canvas.removeEventListener('click', onClick);
      chart.destroy();
      chartRef.current = null;
    };
  }, [original, state, points, ptsMode, yRangePct, heatmap, priceAt]);

  return (
    <div
      className="bg-bg-primary border border-border-tertiary rounded-md p-3 mb-2.5"
      style={{ borderWidth: '0.5px' }}
    >
      <div className="text-xs font-medium mb-1">Hisse fiyatı senaryosu</div>
      <div className="flex gap-3.5 text-[11px] text-fg-secondary mb-1.5 flex-wrap">
        <span><span className="inline-block w-3.5 h-0.5 align-middle mr-1" style={{ background: '#378ADD' }} />Spot</span>
        <span><span className="inline-block w-3.5 h-0.5 align-middle mr-1" style={{ background: '#7F77DD' }} />Strike</span>
        <span><span className="inline-block w-3.5 h-0.5 align-middle mr-1" style={{ background: '#EF9F27' }} />Breakeven</span>
        <span><span className="inline-block w-2.5 h-2.5 rounded-sm align-middle mr-1" style={{ background: '#3C3489' }} />Noktalar</span>
      </div>
      <div className="relative" style={{ height: 320 }}>
        <canvas ref={canvasRef} style={{ cursor: 'crosshair' }} />
        <div
          ref={hoverRef}
          className="absolute top-2 right-2 text-[11px] font-mono bg-bg-primary px-2 py-1.5 rounded-md border border-border-secondary pointer-events-none transition-opacity z-10"
          style={{ opacity: 0, borderWidth: '0.5px' }}
        >
          <div>t = 0 gün</div>
          <div>S = $0</div>
          <div>Prim ≈ $0</div>
          <div className="font-medium mt-0.5">K/Z: $0</div>
        </div>
      </div>
    </div>
  );
}
