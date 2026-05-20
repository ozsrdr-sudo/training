'use client';

import { Chart as ChartJS, registerables } from 'chart.js';

let registered = false;

export function ensureChartRegistered() {
  if (registered) return;
  ChartJS.register(...registerables);
  registered = true;
}
