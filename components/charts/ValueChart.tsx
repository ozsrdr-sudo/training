'use client';

import { Chart, type ChartConfiguration, type Plugin } from 'chart.js';
import { useEffect, useRef } from 'react';
import { ensureChartRegistered } from './chartSetup';
import type { ContractData, Point, PriceResult } from '@/lib/types';

export interface ValueChartProps {
  original: ContractData;
  state: ContractData;
  points: Point[];
  contracts: number;
  mode: 'linear' | 'bs';
  priceAt: (args: { S_new: number; days_passed: number; useOriginal: boolean }) => PriceResult | null;
}

export function ValueChart({ original, state, points, contracts, mode, priceAt }: ValueChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const propsRef = useRef({ original, state, points, contracts, priceAt });
  propsRef.current = { original, state, points, contracts, priceAt };

  useEffect(() => {
    ensureChartRegistered();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const xAxisDatesPlugin: Plugin = {
      id: 'xAxisDates',
      afterDraw(c) {
        const xScale = c.scales.x;
        const area = c.chartArea;
        if (!area || !xScale) return;
        const ticks = xScale.ticks;
        const drawCtx = c.ctx;
        drawCtx.save();
        drawCtx.font = '9px monospace';
        drawCtx.fillStyle = 'rgba(100, 116, 139, 0.85)';
        drawCtx.textAlign = 'right';
        drawCtx.textBaseline = 'middle';
        for (const tick of ticks) {
          const xPx = xScale.getPixelForValue(tick.value);
          if (xPx < area.left - 2 || xPx > area.right + 2) continue;
          const date = new Date(Date.now() + tick.value * 86_400_000);
          const dateStr = date.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: 'short',
            year: '2-digit',
          });
          drawCtx.save();
          drawCtx.translate(xPx + 4, area.bottom + 28);
          drawCtx.rotate(-Math.PI * 45 / 180);
          drawCtx.fillText(dateStr, 0, 0);
          drawCtx.restore();
        }
        drawCtx.restore();
      },
    };

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
      const guess = Math.max(500 * contracts, 100);
      yMin = -guess;
      yMax = guess;
    } else {
      const allY = [...origData.map((d) => d.y), ...curData.map((d) => d.y)];
      const lo = Math.min(...allY);
      const hi = Math.max(...allY);
      const range = Math.max(hi - lo, 1);
      const padding = Math.max(range * 0.12, 1);
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
        layout: { padding: { bottom: 72, right: 20 } },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => 'Nokta ' + (items[0].dataIndex + 1) + ' · t=' + items[0].parsed.x + 'g',
              label: (item) => {
                const pnl = item.parsed.y ?? 0;
                const raw = item.raw as { price?: number } | undefined;
                const price = raw?.price ?? 0;
                const o = propsRef.current.original;
                const cost = o.price0 * 100 * Math.max(1, propsRef.current.contracts);
                const pct = cost > 0 ? (pnl / cost) * 100 : 0;
                const pnlSign = pnl >= 0 ? '+' : '−';
                const pctSign = pct >= 0 ? '+' : '−';
                return (
                  item.dataset.label +
                  ': K/Z ' +
                  pnlSign +
                  '$' +
                  Math.abs(pnl).toFixed(0) +
                  ' (' +
                  pctSign +
                  Math.abs(pct).toFixed(1) +
                  '%, prim $' +
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
            title: { display: true, text: 'Kalan gün', font: { size: 11 } },
            ticks: {
              font: { size: 10 },
              stepSize: Math.max(1, Math.round(state.days) <= 20 ? 1 : Math.ceil(Math.round(state.days) / 20)),
              maxTicksLimit: 22,
              autoSkip: false,
              callback: (v) => {
                const days = typeof v === 'number' ? v : parseFloat(String(v));
                if (!Number.isFinite(days)) return '';
                return String(Math.round(state.days) - Math.round(days));
              },
            },
            grid: { color: 'rgba(150,150,150,0.1)' },
          },
          y: {
            min: yMin,
            max: yMax,
            title: { display: true, text: 'K/Z ($ ve toplam maliyete % oran)', font: { size: 11 } },
            ticks: {
              font: { size: 10 },
              callback: (v) => {
                const num = typeof v === 'number' ? v : parseFloat(String(v));
                const dolSign = num > 0 ? '+' : num < 0 ? '−' : '';
                const cost = original.price0 * 100 * Math.max(1, contracts);
                const pct = cost > 0 ? (num / cost) * 100 : 0;
                const pctSign = pct > 0 ? '+' : pct < 0 ? '−' : '';
                return (
                  dolSign +
                  '$' +
                  Math.abs(num).toFixed(0) +
                  ' (' +
                  pctSign +
                  Math.abs(pct).toFixed(0) +
                  '%)'
                );
              },
            },
            grid: { color: 'rgba(150,150,150,0.1)' },
          },
        },
      },
      plugins: [zeroLinePlugin, xAxisDatesPlugin],
    };

    const chart = new Chart(ctx, config);
    chartRef.current = chart;
    return () => {
      chart.destroy();
      chartRef.current = null;
    };
  }, [original, state, points, contracts, priceAt]);

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
      {mode === 'linear' && (
        <div className="text-[10px] text-fg-tertiary mb-1.5 leading-snug">
          <strong>Lineer mod notu:</strong> fiyat tabanı $0&apos;a indirildi (intrinsic değil). Θ slider&apos;ını çok negatife
          çekince eğri her t değerinde aşağı ötelenir, intrinsic tabanına çarpıp düzleşmez. Gerçek piyasada opsiyon
          intrinsic&apos;in altında işlem görmez; bu yalnızca slider etkisinin grafik üzerinde görünür kalması için eğitsel
          bir gevşetme. Realistik fiyat için Black-Scholes mod&apos;a geç.
        </div>
      )}
      <div className="relative" style={{ height: 320 }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
