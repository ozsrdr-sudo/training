/* eslint-disable @typescript-eslint/no-explicit-any */
import YahooFinance from 'yahoo-finance2';

// Yahoo zaman zaman şemada olmayan alanlar döndürünce kütüphane "Failed Yahoo
// Schema validation" uyarısı basıyor. Veri yine de geçerli, sadece gürültü;
// loglamayı kapatıyoruz (allowAdditionalProps zaten true, yani veri korunur).
const yahooFinance = new (YahooFinance as any)({
  validation: { logErrors: false, logOptionsErrors: false },
});

const QUOTE_TTL_MS = 60_000;
const OPTIONS_TTL_MS = 5 * 60_000;
const SEARCH_TTL_MS = 10 * 60_000;
const RATE_LIMIT_RETRY_MS = 30_000;

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const quoteCache = new Map<string, CacheEntry<QuoteResult>>();
const optionsCache = new Map<string, CacheEntry<OptionsResult>>();
const searchCache = new Map<string, CacheEntry<SearchResult[]>>();
const historicalCache = new Map<string, CacheEntry<number[]>>();
const HISTORICAL_TTL_MS = 30 * 60_000;

const rateLimitedUntil = { ts: 0 };

export interface QuoteResult {
  symbol: string;
  shortName: string;
  spot: number;
  change: number;
  changePct: number;
  currency: string;
}

export interface OptionContractRow {
  contractSymbol: string;
  strike: number;
  lastPrice: number | null;
  bid: number | null;
  ask: number | null;
  impliedVolatility: number | null;
  inTheMoney: boolean;
}

export interface OptionsResult {
  symbol: string;
  spot: number;
  expirationDates: string[];
  expiry?: string;
  calls?: OptionContractRow[];
  puts?: OptionContractRow[];
}

export interface SearchResult {
  symbol: string;
  shortname: string;
  exchange: string;
}

export class YahooError extends Error {
  constructor(public code: 'rate_limit' | 'not_found' | 'upstream', message: string) {
    super(message);
    this.name = 'YahooError';
  }
}

function isRateLimited(): boolean {
  return Date.now() < rateLimitedUntil.ts;
}

function markRateLimited() {
  rateLimitedUntil.ts = Date.now() + RATE_LIMIT_RETRY_MS;
}

function readCache<T>(map: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = map.get(key);
  if (!entry) return null;
  if (Date.now() >= entry.expiresAt) {
    map.delete(key);
    return null;
  }
  return entry.value;
}

function writeCache<T>(map: Map<string, CacheEntry<T>>, key: string, value: T, ttl: number) {
  map.set(key, { value, expiresAt: Date.now() + ttl });
}

function handleError(err: unknown): never {
  const msg = err instanceof Error ? err.message : String(err);
  if (/429|rate/i.test(msg)) {
    markRateLimited();
    throw new YahooError('rate_limit', 'Yahoo Finance rate limit (429). 30s sonra dene.');
  }
  if (/not\s*found|invalid|symbol/i.test(msg)) {
    throw new YahooError('not_found', msg);
  }
  throw new YahooError('upstream', msg);
}

const yf = yahooFinance as any;

export async function getQuote(symbol: string): Promise<QuoteResult> {
  const key = symbol.toUpperCase();
  const cached = readCache(quoteCache, key);
  if (cached) return cached;
  if (isRateLimited()) {
    throw new YahooError('rate_limit', 'Rate limit etkin, 30s bekle.');
  }
  try {
    const q: any = await yf.quote(key, undefined, { validateResult: false });
    if (!q || typeof q.regularMarketPrice !== 'number') {
      throw new YahooError('not_found', `Sembol bulunamadı: ${symbol}`);
    }
    const result: QuoteResult = {
      symbol: q.symbol ?? key,
      shortName: q.shortName ?? q.longName ?? key,
      spot: q.regularMarketPrice,
      change: q.regularMarketChange ?? 0,
      changePct: q.regularMarketChangePercent ?? 0,
      currency: q.currency ?? 'USD',
    };
    writeCache(quoteCache, key, result, QUOTE_TTL_MS);
    return result;
  } catch (err) {
    if (err instanceof YahooError) throw err;
    handleError(err);
  }
}

export async function getOptions(symbol: string, expiry?: string): Promise<OptionsResult> {
  const key = `${symbol.toUpperCase()}|${expiry ?? ''}`;
  const cached = readCache(optionsCache, key);
  if (cached) return cached;
  if (isRateLimited()) {
    throw new YahooError('rate_limit', 'Rate limit etkin, 30s bekle.');
  }
  try {
    const queryOpts = expiry ? { date: new Date(expiry) } : undefined;
    const chain: any = await yf.options(symbol.toUpperCase(), queryOpts, { validateResult: false });
    if (!chain) {
      throw new YahooError('not_found', `Opsiyon zinciri yok: ${symbol}`);
    }
    const expirationDates: string[] = (chain.expirationDates ?? []).map((d: any) =>
      d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10)
    );
    const result: OptionsResult = {
      symbol: symbol.toUpperCase(),
      spot: chain.quote?.regularMarketPrice ?? 0,
      expirationDates,
    };
    if (expiry && Array.isArray(chain.options) && chain.options.length > 0) {
      const o = chain.options[0];
      result.expiry = expiry;
      result.calls = ((o.calls as any[]) ?? []).map(mapContract);
      result.puts = ((o.puts as any[]) ?? []).map(mapContract);
    }
    writeCache(optionsCache, key, result, OPTIONS_TTL_MS);
    return result;
  } catch (err) {
    if (err instanceof YahooError) throw err;
    handleError(err);
  }
}

function mapContract(c: any): OptionContractRow {
  return {
    contractSymbol: c.contractSymbol ?? '',
    strike: c.strike ?? 0,
    lastPrice: typeof c.lastPrice === 'number' && c.lastPrice > 0 ? c.lastPrice : null,
    bid: typeof c.bid === 'number' && c.bid > 0 ? c.bid : null,
    ask: typeof c.ask === 'number' && c.ask > 0 ? c.ask : null,
    impliedVolatility:
      typeof c.impliedVolatility === 'number' && c.impliedVolatility > 0 ? c.impliedVolatility : null,
    inTheMoney: !!c.inTheMoney,
  };
}

export async function searchSymbols(query: string): Promise<SearchResult[]> {
  const key = query.toUpperCase().trim();
  if (!key) return [];
  const cached = readCache(searchCache, key);
  if (cached) return cached;
  if (isRateLimited()) {
    throw new YahooError('rate_limit', 'Rate limit etkin, 30s bekle.');
  }
  try {
    const res: any = await yf.search(query, { quotesCount: 8, newsCount: 0 }, { validateResult: false });
    const list: SearchResult[] = ((res?.quotes as any[]) ?? [])
      .filter((q) => typeof q?.symbol === 'string')
      .filter((q) => q.quoteType === 'EQUITY' || q.quoteType === 'ETF')
      .map((q) => ({
        symbol: String(q.symbol),
        shortname: String(q.shortname ?? q.longname ?? q.symbol),
        exchange: String(q.exchange ?? ''),
      }));
    writeCache(searchCache, key, list, SEARCH_TTL_MS);
    return list;
  } catch (err) {
    if (err instanceof YahooError) throw err;
    handleError(err);
  }
}

export async function getHistoricalCloses(symbol: string, days: number): Promise<number[]> {
  const lookback = Math.max(days + 5, 10);
  const key = `${symbol.toUpperCase()}|${lookback}`;
  const cached = readCache(historicalCache, key);
  if (cached) return cached;
  if (isRateLimited()) {
    throw new YahooError('rate_limit', 'Rate limit etkin, 30s bekle.');
  }
  try {
    const now = new Date();
    const period1 = new Date(now.getTime() - (lookback + 7) * 86_400_000);
    const rows: any[] = await yf.historical(symbol.toUpperCase(), {
      period1,
      period2: now,
      interval: '1d',
    }, { validateResult: false });
    const closes = (rows ?? [])
      .map((r) => (typeof r?.close === 'number' && r.close > 0 ? r.close : null))
      .filter((c): c is number => c !== null)
      .slice(-lookback);
    writeCache(historicalCache, key, closes, HISTORICAL_TTL_MS);
    return closes;
  } catch (err) {
    if (err instanceof YahooError) throw err;
    handleError(err);
  }
}

export function premiumFromContract(c: OptionContractRow): number | null {
  if (c.lastPrice !== null && c.lastPrice > 0) return c.lastPrice;
  if (c.bid !== null && c.ask !== null) return (c.bid + c.ask) / 2;
  if (c.ask !== null) return c.ask;
  if (c.bid !== null) return c.bid;
  return null;
}
