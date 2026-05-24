import { notFound } from 'next/navigation';
import { getRedis, KEY_VISITS_IPS, KEY_VISITS_TOTAL } from '@/lib/redis';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Props = {
  searchParams: { key?: string };
};

export default async function StatsPage({ searchParams }: Props) {
  const requiredKey = process.env.STATS_KEY;
  if (requiredKey && searchParams.key !== requiredKey) {
    notFound();
  }

  const redis = getRedis();
  let visits = 0;
  let uniqueIps = 0;
  let configured = false;

  if (redis) {
    try {
      const [visitsRaw, ipCount] = await Promise.all([
        redis.get<number | string>(KEY_VISITS_TOTAL),
        redis.scard(KEY_VISITS_IPS),
      ]);
      const v = typeof visitsRaw === 'number' ? visitsRaw : Number(visitsRaw ?? 0);
      visits = Number.isFinite(v) ? v : 0;
      uniqueIps = Number(ipCount ?? 0);
      configured = true;
    } catch {
      configured = false;
    }
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-[640px] mx-auto">
        <h1 className="text-[22px] font-medium m-0 mb-1">Ziyaret İstatistikleri</h1>
        <p className="text-[13px] text-fg-secondary m-0 mb-6">
          Opsiyon Dersi Simülatörü · özet sayaçlar
        </p>

        {!configured ? (
          <div
            className="bg-bg-primary border border-border-tertiary rounded-md p-6"
            style={{ borderWidth: '0.5px' }}
          >
            <div className="text-[14px] font-medium mb-1">KV bağlı değil</div>
            <p className="text-[12px] text-fg-secondary m-0">
              <code>KV_REST_API_URL</code> ve <code>KV_REST_API_TOKEN</code> env değişkenleri yok veya bağlantı hata verdi.
              Vercel → Storage&apos;tan Upstash Redis bağlanınca burada veriler görünür.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div
              className="bg-bg-primary border border-border-tertiary rounded-md p-4"
              style={{ borderWidth: '0.5px' }}
            >
              <div className="text-[11px] text-fg-secondary uppercase tracking-wide">Toplam ziyaret</div>
              <div className="text-[28px] font-medium mt-1 tabular-nums">
                {visits.toLocaleString('tr-TR')}
              </div>
            </div>
            <div
              className="bg-bg-primary border border-border-tertiary rounded-md p-4"
              style={{ borderWidth: '0.5px' }}
            >
              <div className="text-[11px] text-fg-secondary uppercase tracking-wide">Tekil IP</div>
              <div className="text-[28px] font-medium mt-1 tabular-nums">
                {uniqueIps.toLocaleString('tr-TR')}
              </div>
            </div>
          </div>
        )}

        <p className="text-[11px] text-fg-secondary mt-6 m-0">
          Veriler aynı tarayıcı oturumunda yenileme yapsan da artmaz (session başına 1 sayım).
        </p>
      </div>
    </main>
  );
}
