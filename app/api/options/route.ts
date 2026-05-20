import { NextResponse } from 'next/server';
import { getOptions, YahooError } from '@/lib/yahoo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol');
  const expiry = searchParams.get('expiry') ?? undefined;
  if (!symbol) {
    return NextResponse.json({ error: 'symbol gerekli' }, { status: 400 });
  }
  try {
    const data = await getOptions(symbol, expiry);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof YahooError) {
      const status = err.code === 'rate_limit' ? 429 : err.code === 'not_found' ? 404 : 502;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    return NextResponse.json({ error: 'beklenmeyen hata' }, { status: 500 });
  }
}
