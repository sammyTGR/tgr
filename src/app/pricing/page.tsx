import Pricing from "@/components/ui/Pricing";
import { createClient } from "@/utils/supabase/server";
import {
  getProducts,
  getSubscription,
  getUser,
} from "@/utils/supabase/queries";
import { syncStripeData } from "@/utils/stripe/syncStripeData";
import { cache } from "react";

const cachedSyncStripeData = cache(async () => {
  // console.log("Syncing Stripe data");
  await syncStripeData();
});

export default async function PricingPage() {
  const supabase = createClient();

  // Sync Stripe data (this will only run once per request due to caching)
  await cachedSyncStripeData();

  const [user, products, subscription] = await Promise.all([
    getUser(supabase),
    getProducts(supabase),
    getSubscription(supabase),
  ]);

  return (
    <Pricing
      user={user}
      products={products ?? []}
      subscription={subscription}
    />
  );
}
