import { NextResponse } from 'next/server';
import { searchSymbols, YahooError } from '@/lib/yahoo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  if (!q || q.trim().length < 1) {
    return NextResponse.json({ results: [] });
  }
  try {
    const results = await searchSymbols(q);
    return NextResponse.json({ results });
  } catch (err) {
    if (err instanceof YahooError) {
      const status = err.code === 'rate_limit' ? 429 : 502;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    return NextResponse.json({ error: 'beklenmeyen hata' }, { status: 500 });
  }
}
