'use client';

import { useState } from 'react';

export interface ManualPointEntryProps {
  maxDays: number;
  defaultSpot: number;
  onAddPoint: (t: number, s: number) => void;
}

export function ManualPointEntry({ maxDays, defaultSpot, onAddPoint }: ManualPointEntryProps) {
  const [remainingStr, setRemainingStr] = useState<string>('');
  const [sStr, setSStr] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleAdd = () => {
    const remaining = parseFloat(remainingStr);
    const s = parseFloat(sStr);
    if (!Number.isFinite(remaining) || remaining < 0 || remaining > maxDays) {
      setError(`Kalan gün 0 ile ${maxDays} arasında olmalı`);
      return;
    }
    if (!Number.isFinite(s) || s <= 0) {
      setError('Spot pozitif bir sayı olmalı');
      return;
    }
    setError('');
    const t = maxDays - remaining;
    onAddPoint(t, s);
    setRemainingStr('');
    setSStr('');
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAdd();
  };

  const remainingNum = parseFloat(remainingStr);
  const showDate =
    Number.isFinite(remainingNum) && remainingNum >= 0 && remainingNum <= maxDays;
  // Kalan gün = vadeye kalan süre → tarih = bugün + (toplam_gün − kalan)
  const targetDate = showDate
    ? new Date(Date.now() + (maxDays - remainingNum) * 86_400_000).toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '';

  return (
    <div className="flex items-center gap-2 mb-2.5 flex-wrap text-[11px]">
      <span className="text-fg-secondary">Elle nokta ekle:</span>

      <label className="flex items-center gap-1" title="Vadeye ne kadar gün kaldığını gir (0 = vade günü)">
        <span className="text-fg-tertiary">kalan gün</span>
        <input
          type="number"
          min={0}
          max={maxDays}
          step={1}
          value={remainingStr}
          onChange={(e) => {
            const v = e.target.value;
            if (v === '' || v === '-') {
              setRemainingStr(v === '-' ? '' : v);
              return;
            }
            const n = parseFloat(v);
            if (!Number.isFinite(n)) {
              setRemainingStr('');
              return;
            }
            const clamped = Math.max(0, Math.min(maxDays, n));
            setRemainingStr(String(clamped));
          }}
          onKeyDown={handleKey}
          placeholder={`0–${maxDays}`}
          className="w-20 px-1.5 py-1 rounded-md border border-border-tertiary bg-bg-primary text-fg-primary"
          style={{ borderWidth: '0.5px' }}
        />
        {showDate && (
          <span
            className="text-fg-secondary ml-1.5 font-mono"
            title="Bu kalan gün sayısına denk gelen takvim tarihi"
          >
            → {targetDate}
          </span>
        )}
      </label>

      <label className="flex items-center gap-1">
        <span className="text-fg-tertiary">spot $</span>
        <input
          type="number"
          min={0}
          step={0.01}
          value={sStr}
          onChange={(e) => {
            const v = e.target.value;
            if (v === '' || v === '-') {
              setSStr(v === '-' ? '' : v);
              return;
            }
            const n = parseFloat(v);
            if (!Number.isFinite(n)) {
              setSStr('');
              return;
            }
            setSStr(String(Math.max(0, n)));
          }}
          onKeyDown={handleKey}
          placeholder={defaultSpot.toFixed(2)}
          className="w-24 px-1.5 py-1 rounded-md border border-border-tertiary bg-bg-primary text-fg-primary"
          style={{ borderWidth: '0.5px' }}
        />
      </label>

      <button
        type="button"
        onClick={handleAdd}
        disabled={!remainingStr || !sStr}
        className="px-2.5 py-1 rounded-md border bg-bg-info text-fg-info border-border-info disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ borderWidth: '0.5px' }}
      >
        Ekle
      </button>

      {error && <span className="text-fg-danger">{error}</span>}
      {!error && (
        <span className="text-fg-tertiary">
          (veya grafiğe tıkla)
        </span>
      )}
    </div>
  );
}
