import { NextResponse } from 'next/server';
import { getRedis, KEY_VISITS_IPS, KEY_VISITS_TOTAL } from '@/lib/redis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getClientIp(req: Request): string | null {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) {
    const first = fwd.split(',')[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return null;
}

export async function POST(req: Request) {
  const redis = getRedis();
  if (!redis) {
    return NextResponse.json({ ok: false, reason: 'kv_not_configured' }, { status: 200 });
  }
  const ip = getClientIp(req);
  try {
    const [total] = await Promise.all([
      redis.incr(KEY_VISITS_TOTAL),
      ip ? redis.sadd(KEY_VISITS_IPS, ip) : Promise.resolve(0),
    ]);
    return NextResponse.json({ ok: true, total });
  } catch {
    return NextResponse.json({ ok: false, reason: 'redis_error' }, { status: 200 });
  }
}
