import Pricing from '@/components/ui/Pricing';
import { createClient } from '@/utils/supabase/server';
import { getProducts, getSubscription, getUser } from '@/utils/supabase/queries';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

const CACHE_TTL = 3600; // 1 hour in seconds

export default async function PricingPage({ searchParams }: { searchParams: { refresh?: string } }) {
  const supabase = createClient();

  // Use Redis to cache products
  const cachedProducts = await redis.get('stripe_products');
  let products;

  if (searchParams.refresh === 'true' || !cachedProducts || typeof cachedProducts !== 'string') {
    products = await getProducts(supabase);
    if (products && products.length > 0) {
      await redis.set('stripe_products', JSON.stringify(products), { ex: CACHE_TTL });
    }
  } else {
    products = JSON.parse(cachedProducts);
  }

  const [user, subscription] = await Promise.all([
    getUser(supabase),
    getSubscription(supabase)
  ]);

  if (!products || products.length === 0) {
    // If no products, trigger a sync
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/sync-stripe`, { method: 'GET' });
    products = await getProducts(supabase);
    if (products && products.length > 0) {
      await redis.set('stripe_products', JSON.stringify(products), { ex: CACHE_TTL });
    }
  }

  return (
    <Pricing
      user={user}
      products={products ?? []}
      subscription={subscription}
    />
  );
}