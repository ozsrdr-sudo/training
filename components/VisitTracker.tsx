'use client';

import { useEffect } from 'react';

const SESSION_KEY = 'visit_tracked';

export function VisitTracker() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(SESSION_KEY) === '1') return;
    fetch('/api/track', { method: 'POST' })
      .then(() => sessionStorage.setItem(SESSION_KEY, '1'))
      .catch(() => {
        /* sessizce yut */
      });
  }, []);
  return null;
}
