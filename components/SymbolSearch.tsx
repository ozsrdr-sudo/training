'use client';

import { useEffect, useRef, useState } from 'react';

interface SearchHit {
  symbol: string;
  shortname: string;
  exchange: string;
}

export function SymbolSearch({ onSelect }: { onSelect: (symbol: string) => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      setError('');
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? 'Arama başarısız');
          setResults([]);
        } else {
          setResults(data.results ?? []);
        }
      } catch {
        setError('Ağ hatası');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="relative flex-1 min-w-[240px]">
      <input
        type="text"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 200);
        }}
        placeholder="Canlı sembol ara (örn. AAPL, NVDA, Tesla)…"
        className="w-full text-[13px] px-3 py-1.5 rounded-md border border-border-tertiary bg-bg-primary text-fg-primary placeholder:text-fg-tertiary"
        style={{ borderWidth: '0.5px' }}
      />
      {open && q.trim().length > 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-1 bg-bg-primary border border-border-tertiary rounded-md max-h-64 overflow-auto z-20 shadow-lg"
          style={{ borderWidth: '0.5px' }}
        >
          {loading && <div className="px-3 py-2 text-xs text-fg-secondary">Aranıyor…</div>}
          {error && <div className="px-3 py-2 text-xs text-fg-danger">{error}</div>}
          {!loading && !error && results.length === 0 && (
            <div className="px-3 py-2 text-xs text-fg-tertiary">Sonuç yok</div>
          )}
          {results.map((r) => (
            <button
              key={`${r.symbol}-${r.exchange}`}
              type="button"
              onMouseDown={() => {
                if (blurTimer.current) clearTimeout(blurTimer.current);
                onSelect(r.symbol);
                setQ('');
                setOpen(false);
                setResults([]);
              }}
              className="block w-full text-left px-3 py-2 text-xs hover:bg-bg-secondary"
            >
              <span className="font-medium">{r.symbol}</span>
              <span className="text-fg-secondary">
                {' · '}
                {r.shortname}
                {r.exchange ? ` (${r.exchange})` : ''}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
