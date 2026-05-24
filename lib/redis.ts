import { Redis } from '@upstash/redis';

let client: Redis | null = null;

export function getRedis(): Redis | null {
  if (client) return client;
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  client = new Redis({ url, token });
  return client;
}

export const KEY_VISITS_TOTAL = 'visits:total';
export const KEY_VISITS_IPS = 'visits:ips';
