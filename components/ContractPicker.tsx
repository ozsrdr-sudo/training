'use client';

import { useEffect, useMemo, useState } from 'react';
import { impliedVol } from '@/lib/black-scholes';
import { DEFAULT_RISK_FREE_RATE } from '@/lib/constants';
import type { OptionType } from '@/lib/types';

interface OptionContractRow {
  contractSymbol: string;
  strike: number;
  lastPrice: number | null;
  bid: number | null;
  ask: number | null;
  impliedVolatility: number | null;
  inTheMoney: boolean;
}

interface OptionsResponse {
  symbol: string;
  spot: number;
  expirationDates: string[];
  expiry?: string;
  calls?: OptionContractRow[];
  puts?: OptionContractRow[];
}

interface ContractPickerProps {
  symbol: string;
  onCancel: () => void;
  onLoad: (params: {
    name: string;
    spot: number;
    strike: number;
    days: number;
    iv: number;
    type: OptionType;
  }) => void;
}

function daysBetween(today: Date, expiry: string): number {
  const e = new Date(expiry + 'T16:00:00');
  return Math.max(1, Math.round((e.getTime() - today.getTime()) / 86_400_000));
}

function fmtExpiry(s: string): string {
  const d = new Date(s + 'T00:00:00');
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function midPrice(row: OptionContractRow): number | null {
  if (row.bid !== null && row.ask !== null && row.bid > 0 && row.ask > 0) {
    return (row.bid + row.ask) / 2;
  }
  if (row.lastPrice !== null && row.lastPrice > 0) return row.lastPrice;
  if (row.ask !== null && row.ask > 0) return row.ask;
  if (row.bid !== null && row.bid > 0) return row.bid;
  return null;
}

export function ContractPicker({ symbol, onCancel, onLoad }: ContractPickerProps) {
  const [data, setData] = useState<OptionsResponse | null>(null);
  const [expiry, setExpiry] = useState<string>('');
  const [type, setType] = useState<OptionType>('C');
  const [strike, setStrike] = useState<number | null>(null);
  const [strikeCount, setStrikeCount] = useState<number>(30);
  const [loadingExpiries, setLoadingExpiries] = useState(true);
  const [loadingChain, setLoadingChain] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    setLoadingExpiries(true);
    setError('');
    setData(null);
    setExpiry('');
    setStrike(null);
    fetch(`/api/options?symbol=${encodeURIComponent(symbol)}`)
      .then(async (res) => {
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(json.error ?? 'Opsiyon zinciri alınamadı');
        } else {
          setData(json);
          if (json.expirationDates?.length > 0) {
            const today = new Date();
            const closest =
              json.expirationDates.find((d: string) => daysBetween(today, d) >= 14) ??
              json.expirationDates[0];
            setExpiry(closest);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setError('Ağ hatası');
      })
      .finally(() => {
        if (!cancelled) setLoadingExpiries(false);
      });
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  useEffect(() => {
    if (!expiry || !data) return;
    let cancelled = false;
    setLoadingChain(true);
    setError('');
    fetch(`/api/options?symbol=${encodeURIComponent(symbol)}&expiry=${expiry}`)
      .then(async (res) => {
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(json.error ?? 'Zincir alınamadı');
        } else {
          setData(json);
          const rows = type === 'C' ? json.calls : json.puts;
          if (rows?.length) {
            const atm = rows.reduce((acc: OptionContractRow, cur: OptionContractRow) =>
              Math.abs(cur.strike - json.spot) < Math.abs(acc.strike - json.spot) ? cur : acc
            );
            setStrike(atm.strike);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setError('Ağ hatası');
      })
      .finally(() => {
        if (!cancelled) setLoadingChain(false);
      });
    return () => {
      cancelled = true;
    };
  }, [expiry, symbol, type, data?.symbol]); // eslint-disable-line react-hooks/exhaustive-deps

  const rows: OptionContractRow[] = useMemo(() => {
    const list = type === 'C' ? data?.calls ?? [] : data?.puts ?? [];
    if (!data) return list;
    const spot = data.spot;
    return [...list].sort((a, b) => Math.abs(a.strike - spot) - Math.abs(b.strike - spot)).slice(0, strikeCount).sort((a, b) => a.strike - b.strike);
  }, [data, type, strikeCount]);

  const selectedRow = useMemo(() => rows.find((r) => r.strike === strike) ?? null, [rows, strike]);

  const mid = useMemo(() => (selectedRow ? midPrice(selectedRow) : null), [selectedRow]);

  const solvedIV = useMemo(() => {
    if (!data || !selectedRow || mid === null || !expiry) return null;
    const days = daysBetween(new Date(), expiry);
    return impliedVol(mid, data.spot, selectedRow.strike, days / 365, DEFAULT_RISK_FREE_RATE, type);
  }, [data, selectedRow, mid, expiry, type]);

  const effectiveIV = solvedIV ?? selectedRow?.impliedVolatility ?? null;

  const canLoad =
    !loadingExpiries &&
    !loadingChain &&
    !error &&
    data &&
    expiry &&
    selectedRow &&
    effectiveIV !== null;

  const handleLoad = () => {
    if (!canLoad || !data || !selectedRow || effectiveIV === null) return;
    const days = daysBetween(new Date(), expiry);
    onLoad({
      name: `${data.symbol} ${selectedRow.strike}${type} — ${fmtExpiry(expiry)}`,
      spot: data.spot,
      strike: selectedRow.strike,
      days,
      iv: effectiveIV,
      type,
    });
  };

  return (
    <div
      className="bg-bg-primary border border-border-tertiary rounded-md p-3.5 mb-3"
      style={{ borderWidth: '0.5px' }}
    >
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <strong className="text-sm">{symbol}</strong>
        {data && (
          <span className="text-xs text-fg-secondary font-mono">spot ${data.spot.toFixed(2)}</span>
        )}
        <button
          type="button"
          onClick={onCancel}
          className="ml-auto text-[11px] px-2 py-1 rounded-md border border-border-tertiary bg-bg-primary text-fg-secondary hover:bg-bg-secondary"
          style={{ borderWidth: '0.5px' }}
        >
          Kapat
        </button>
      </div>

      {loadingExpiries && <div className="text-xs text-fg-secondary">Vade tarihleri yükleniyor…</div>}
      {error && <div className="text-xs text-fg-danger">{error}</div>}

      {!loadingExpiries && data && (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
          <label className="text-xs">
            <span className="block text-fg-secondary mb-1">Vade</span>
            <select
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              className="w-full text-xs px-2 py-1.5 rounded-md border border-border-tertiary bg-bg-primary text-fg-primary"
              style={{ borderWidth: '0.5px' }}
            >
              {data.expirationDates.map((d) => {
                const days = daysBetween(new Date(), d);
                return (
                  <option key={d} value={d}>
                    {fmtExpiry(d)} ({days}g)
                  </option>
                );
              })}
            </select>
          </label>

          <label className="text-xs">
            <span className="block text-fg-secondary mb-1">Tip</span>
            <div className="inline-flex gap-1 w-full">
              {(['C', 'P'] as OptionType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 text-xs px-2 py-1.5 rounded-md border ${
                    type === t
                      ? 'bg-bg-info text-fg-info border-border-info'
                      : 'bg-bg-primary text-fg-primary border-border-tertiary hover:bg-bg-secondary'
                  }`}
                  style={{ borderWidth: '0.5px' }}
                >
                  {t === 'C' ? 'Call' : 'Put'}
                </button>
              ))}
            </div>
          </label>

          <label className="text-xs">
            <span className="block text-fg-secondary mb-1 flex items-center gap-1.5">
              <span>Strike (ATM yakın {strikeCount})</span>
              <select
                value={strikeCount}
                onChange={(e) => setStrikeCount(parseInt(e.target.value, 10))}
                className="text-[10px] px-1 py-0.5 rounded border border-border-tertiary bg-bg-primary text-fg-secondary"
                style={{ borderWidth: '0.5px' }}
                title="Listede gösterilecek strike sayısı (ATM'ye en yakınlar)"
              >
                <option value={30}>30</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </span>
            <select
              value={strike ?? ''}
              onChange={(e) => setStrike(parseFloat(e.target.value))}
              disabled={loadingChain || rows.length === 0}
              className="w-full text-xs px-2 py-1.5 rounded-md border border-border-tertiary bg-bg-primary text-fg-primary disabled:opacity-50"
              style={{ borderWidth: '0.5px' }}
            >
              {loadingChain && <option>Zincir yükleniyor…</option>}
              {!loadingChain &&
                rows.map((r) => {
                  const ivPct =
                    r.impliedVolatility !== null ? ` · IV ${(r.impliedVolatility * 100).toFixed(0)}%` : ' · IV yok';
                  return (
                    <option key={r.strike} value={r.strike}>
                      ${r.strike}
                      {r.inTheMoney ? ' (ITM)' : ''}
                      {ivPct}
                    </option>
                  );
                })}
            </select>
          </label>
        </div>
      )}

      {selectedRow && !loadingChain && (
        <div className="mt-3 text-[11px] text-fg-secondary leading-snug">
          {effectiveIV === null ? (
            <span className="text-fg-danger">
              Bu kontrat için IV yok — Yahoo veri eksik ve bid/ask mid'den çözülemedi, başka strike/expiry seç.
            </span>
          ) : (
            <>
              Seçili: <strong>{symbol} {selectedRow.strike}{type}</strong>
              {' · '}
              <span title={solvedIV !== null ? 'Bid/ask mid fiyatından geriye doğru çözülen örtük oynaklık (canlı). Yahoo\'nun stale impliedVolatility alanı yerine kullanılır.' : 'Yahoo\'nun raporladığı IV (genelde son işlem fiyatından çözülmüş, stale olabilir).'}>
                IV {(effectiveIV * 100).toFixed(1)}% <span className="text-fg-tertiary">({solvedIV !== null ? 'mid\'den çözüldü' : 'Yahoo'})</span>
              </span>
              {solvedIV !== null && selectedRow.impliedVolatility !== null && Math.abs(solvedIV - selectedRow.impliedVolatility) > 0.005 && (
                <span className="text-fg-tertiary" title="Yahoo'nun raporladığı IV (son işlem fiyatından çözülmüş, mid'le farklı olabilir).">
                  {' · '}Yahoo IV {(selectedRow.impliedVolatility * 100).toFixed(1)}%
                </span>
              )}
              {mid !== null && (
                <span title="Bid/ask mid (IV solver bunu kullandı).">
                  {' · '}mid ${mid.toFixed(2)}
                </span>
              )}
              {selectedRow.lastPrice !== null && (
                <span title="Son gerçekleşen işlem fiyatı (prim)">
                  {' · '}son işlem ${selectedRow.lastPrice.toFixed(2)}
                </span>
              )}
              {selectedRow.bid !== null && selectedRow.ask !== null && (
                <span title="Bid = piyasadaki en yüksek alış teklifi, Ask = en düşük satış isteği">
                  {' · '}alış/satış ${selectedRow.bid.toFixed(2)}/${selectedRow.ask.toFixed(2)}
                </span>
              )}
              <div className="mt-2 p-2 rounded bg-bg-secondary text-[10px] text-fg-tertiary leading-relaxed space-y-1">
                <div>
                  <strong className="text-fg-secondary">{selectedRow.strike}{type}</strong> —
                  {' '}Strike {selectedRow.strike}$ {type === 'C' ? 'Call (alma hakkı)' : 'Put (satma hakkı)'}.
                  {selectedRow.inTheMoney
                    ? ' ITM: şu an kârda taraf (spot ' + (type === 'C' ? '>' : '<') + ' strike).'
                    : ' OTM: şu an kârsız taraf.'}
                </div>
                <div>
                  <strong className="text-fg-secondary">IV</strong> (Implied Volatility / örtük oynaklık) —
                  {' '}piyasanın bu opsiyon fiyatından geriye doğru çözdüğü <em>yıllık</em> beklenen oynaklık.
                  {' '}Yüksek IV = büyük hareket bekleniyor = prim pahalı.
                </div>
                {selectedRow.lastPrice !== null && (
                  <div>
                    <strong className="text-fg-secondary">son işlem</strong> —
                    {' '}son gerçekleşen alım-satımın <em>primi</em> (1 kontrat = 100 hisse,
                    yani gerçek maliyet ${(selectedRow.lastPrice * 100).toFixed(0)}).
                  </div>
                )}
                {selectedRow.bid !== null && selectedRow.ask !== null && (
                  <div>
                    <strong className="text-fg-secondary">alış/satış</strong> (bid/ask) —
                    {' '}alıcının en yüksek teklifi / satıcının en düşük isteği.
                    {' '}Aradaki fark (spread) ${(selectedRow.ask - selectedRow.bid).toFixed(2)};
                    {' '}dar spread = iyi likidite.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleLoad}
          disabled={!canLoad}
          className="text-xs px-3 py-1.5 rounded-md border bg-bg-info text-fg-info border-border-info disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ borderWidth: '0.5px' }}
        >
          Bu kontratı yükle
        </button>
      </div>
    </div>
  );
}
