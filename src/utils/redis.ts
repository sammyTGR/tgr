import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function getFromCache(key: string): Promise<string | null> {
  try {
    return (await redis.get(key)) as string | null;
  } catch (error) {
    console.error('Error getting data from cache:', error);
    return null;
  }
}

export async function setToCache(key: string, value: string, ttl?: number): Promise<void> {
  try {
    if (ttl) {
      await redis.set(key, value, { ex: ttl });
    } else {
      await redis.set(key, value);
    }
  } catch (error) {
    console.error('Error setting data to cache:', error);
  }
}
