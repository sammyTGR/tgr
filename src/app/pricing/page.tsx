import Pricing from '@/components/ui/Pricing';
import { createClient } from '@/utils/supabase/server';
import { getProducts, getSubscription, getUser } from '@/utils/supabase/queries';

export default async function PricingPage() {
  const supabase = createClient();
  
  // Always attempt to sync before fetching data
  await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/sync-stripe`, { method: 'GET' });

  const [user, products, subscription] = await Promise.all([
    getUser(supabase),
    getProducts(supabase),
    getSubscription(supabase)
  ]);

  return (
    <Pricing
      user={user}
      products={products ?? []}
      subscription={subscription}
    />
  );
}