'use client';

import { Chart, type ChartConfiguration, type Plugin } from 'chart.js';
import { useEffect, useRef } from 'react';
import { ensureChartRegistered } from './chartSetup';
import type { ContractData, Point, PriceResult } from '@/lib/types';

export interface ValueChartProps {
  original: ContractData;
  state: ContractData;
  points: Point[];
  priceAt: (args: { S_new: number; days_passed: number; useOriginal: boolean }) => PriceResult | null;
}

export function ValueChart({ original, state, points, priceAt }: ValueChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const propsRef = useRef({ original, state, points, priceAt });
  propsRef.current = { original, state, points, priceAt };

  useEffect(() => {
    ensureChartRegistered();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const zeroLinePlugin: Plugin = {
      id: 'zeroline',
      afterDatasetsDraw(c) {
        const area = c.chartArea;
        if (!area) return;
        const yScale = c.scales.y;
        const yPx = yScale.getPixelForValue(0);
        if (yPx < area.top || yPx > area.bottom) return;
        const drawCtx = c.ctx;
        drawCtx.save();
        drawCtx.strokeStyle = '#D85A30';
        drawCtx.lineWidth = 1.5;
        drawCtx.setLineDash([4, 4]);
        drawCtx.beginPath();
        drawCtx.moveTo(area.left, yPx);
        drawCtx.lineTo(area.right, yPx);
        drawCtx.stroke();
        drawCtx.restore();
        drawCtx.save();
        drawCtx.fillStyle = '#D85A30';
        drawCtx.font = '10px monospace';
        drawCtx.textAlign = 'right';
        drawCtx.fillText(
          'Başabaş (t₀ maliyet $' + propsRef.current.original.price0.toFixed(2) + ')',
          area.right - 4,
          yPx - 4
        );
        drawCtx.restore();
      },
    };

    const sorted = [...points].sort((a, b) => a.t - b.t);
    const origData = sorted
      .map((p) => {
        const r = priceAt({ S_new: p.s, days_passed: p.t, useOriginal: true });
        return r ? { x: p.t, y: r.pnl, price: r.price } : null;
      })
      .filter((d): d is { x: number; y: number; price: number } => d !== null);
    const curData = sorted
      .map((p) => {
        const r = priceAt({ S_new: p.s, days_passed: p.t, useOriginal: false });
        return r ? { x: p.t, y: r.pnl, price: r.price } : null;
      })
      .filter((d): d is { x: number; y: number; price: number } => d !== null);

    let yMin: number;
    let yMax: number;
    if (points.length === 0) {
      yMin = -500;
      yMax = 500;
    } else {
      const allY = [...origData.map((d) => d.y), ...curData.map((d) => d.y), 0];
      const lo = Math.min(...allY);
      const hi = Math.max(...allY);
      const range = Math.max(hi - lo, 100);
      const padding = Math.max(range * 0.1, 20);
      yMin = lo - padding;
      yMax = hi + padding;
    }

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'Orijinal Greek',
            data: origData,
            borderColor: '#888780',
            borderWidth: 2,
            borderDash: [5, 3],
            pointRadius: 4,
            pointBackgroundColor: '#888780',
            tension: 0,
            fill: false,
          },
          {
            label: 'Mevcut Greek',
            data: curData,
            borderColor: '#1D9E75',
            borderWidth: 2.5,
            pointRadius: 5,
            pointBackgroundColor: '#1D9E75',
            tension: 0,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => 'Nokta ' + (items[0].dataIndex + 1) + ' · t=' + items[0].parsed.x + 'g',
              label: (item) => {
                const pnl = item.parsed.y ?? 0;
                const raw = item.raw as { price?: number } | undefined;
                const price = raw?.price ?? 0;
                return (
                  item.dataset.label +
                  ': K/Z ' +
                  (pnl >= 0 ? '+' : '') +
                  '$' +
                  pnl.toFixed(0) +
                  ' (prim $' +
                  price.toFixed(2) +
                  ')'
                );
              },
            },
          },
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
            min: yMin,
            max: yMax,
            title: { display: true, text: 'K/Z ($, 1 kontrat = 100 hisse)', font: { size: 11 } },
            ticks: {
              font: { size: 10 },
              callback: (v) => {
                const num = typeof v === 'number' ? v : parseFloat(String(v));
                const sign = num > 0 ? '+' : num < 0 ? '−' : '';
                return sign + '$' + Math.abs(num).toFixed(0);
              },
            },
            grid: { color: 'rgba(150,150,150,0.1)' },
          },
        },
      },
      plugins: [zeroLinePlugin],
    };

    const chart = new Chart(ctx, config);
    chartRef.current = chart;
    return () => {
      chart.destroy();
      chartRef.current = null;
    };
  }, [original, state, points, priceAt]);

  return (
    <div
      className="bg-bg-primary border border-border-tertiary rounded-md p-3 mb-2.5"
      style={{ borderWidth: '0.5px' }}
    >
      <div className="text-xs font-medium mb-1">K/Z (senaryo noktalarına göre)</div>
      <div className="flex gap-3.5 text-[11px] text-fg-secondary mb-1.5 flex-wrap">
        <span><span className="inline-block w-2.5 h-2.5 rounded-sm align-middle mr-1" style={{ background: '#888780' }} />Orijinal Greek (sabit)</span>
        <span><span className="inline-block w-2.5 h-2.5 rounded-sm align-middle mr-1" style={{ background: '#1D9E75' }} />Mevcut Greek (slider)</span>
        <span><span className="inline-block w-3.5 h-0.5 align-middle mr-1" style={{ background: '#D85A30' }} />Başabaş ($0 K/Z)</span>
        {points.length === 0 && (
          <span className="ml-auto text-fg-tertiary">Önce yukarıdaki grafiğe tıkla</span>
        )}
      </div>
      <div className="relative" style={{ height: 240 }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
