import { NextResponse } from 'next/server';
import { realizedVolatility } from '@/lib/realized-vol';
import { getHistoricalCloses, YahooError } from '@/lib/yahoo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol');
  const daysParam = searchParams.get('days');
  const days = daysParam ? Math.max(10, Math.min(252, parseInt(daysParam, 10))) : 60;
  if (!symbol) {
    return NextResponse.json({ error: 'symbol gerekli' }, { status: 400 });
  }
  try {
    const closes = await getHistoricalCloses(symbol, days);
    const rv = realizedVolatility(closes);
    return NextResponse.json({ symbol: symbol.toUpperCase(), days, samples: closes.length, rv });
  } catch (err) {
    if (err instanceof YahooError) {
      const status = err.code === 'rate_limit' ? 429 : err.code === 'not_found' ? 404 : 502;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    return NextResponse.json({ error: 'beklenmeyen hata' }, { status: 500 });
  }
}
