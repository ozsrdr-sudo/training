import { NextResponse } from 'next/server';
import { getRedis, KEY_VISITS_IPS, KEY_VISITS_TOTAL } from '@/lib/redis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const redis = getRedis();
  if (!redis) {
    return NextResponse.json({ visits: 0, uniqueIps: 0, configured: false });
  }
  try {
    const [visitsRaw, uniqueIps] = await Promise.all([
      redis.get<number | string>(KEY_VISITS_TOTAL),
      redis.scard(KEY_VISITS_IPS),
    ]);
    const visits = typeof visitsRaw === 'number' ? visitsRaw : Number(visitsRaw ?? 0);
    return NextResponse.json({
      visits: Number.isFinite(visits) ? visits : 0,
      uniqueIps: Number(uniqueIps ?? 0),
      configured: true,
    });
  } catch {
    return NextResponse.json({ visits: 0, uniqueIps: 0, configured: false });
  }
}
