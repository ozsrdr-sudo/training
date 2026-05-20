'use client';

import { PRESETS } from '@/lib/presets';

export function PresetSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="min-w-[200px] text-[13px] px-2.5 py-1.5 rounded-md border border-border-tertiary bg-bg-primary text-fg-primary hover:bg-bg-secondary"
      style={{ borderWidth: '0.5px' }}
    >
      {PRESETS.map((p) => (
        <option key={p.key} value={p.key}>
          {p.name}
        </option>
      ))}
    </select>
  );
}
