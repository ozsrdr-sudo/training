'use client';

import { useEffect, useState } from 'react';

type Stats = { visits: number; uniqueIps: number; configured: boolean };

const SESSION_KEY = 'visit_tracked';

export function VisitStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let cancelled = false;
    const alreadyTracked = typeof window !== 'undefined' && sessionStorage.getItem(SESSION_KEY) === '1';
    const run = async () => {
      try {
        if (!alreadyTracked) {
          await fetch('/api/track', { method: 'POST' });
          sessionStorage.setItem(SESSION_KEY, '1');
        }
        const res = await fetch('/api/stats', { cache: 'no-store' });
        if (!res.ok) return;
        const data: Stats = await res.json();
        if (!cancelled) setStats(data);
      } catch {
        /* sessizce yut */
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!stats || !stats.configured) return null;

  return (
    <div className="text-[11px] text-fg-secondary mt-6 mb-2 text-center">
      <span>Ziyaret: <strong className="font-medium text-fg-primary">{stats.visits.toLocaleString('tr-TR')}</strong></span>
      <span className="mx-2">·</span>
      <span>Tekil IP: <strong className="font-medium text-fg-primary">{stats.uniqueIps.toLocaleString('tr-TR')}</strong></span>
    </div>
  );
}
