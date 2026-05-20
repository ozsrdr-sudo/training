'use client';

export interface ToggleOption<T extends string> {
  value: T;
  label: string;
}

export function ToggleGroup<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: ToggleOption<T>[];
}) {
  return (
    <div className="inline-flex gap-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
              active
                ? 'bg-bg-info text-fg-info border-border-info'
                : 'bg-bg-primary text-fg-primary border-border-tertiary hover:bg-bg-secondary'
            }`}
            style={{ borderWidth: '0.5px' }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
