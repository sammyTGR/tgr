import { stripe } from '@/utils/stripe/config';
import { createClient } from '@/utils/supabase/server';

export async function syncStripeData() {
  const supabase = createClient();

  // Sync Products
  const stripeProducts = await stripe.products.list({ active: true });
  for (let product of stripeProducts.data) {
    await supabase.from('products').upsert({
      id: product.id,
      active: product.active,
      name: product.name,
      description: product.description,
      image: product.images[0],
      metadata: product.metadata
    });

    // Sync Prices for each Product
    const stripePrices = await stripe.prices.list({ product: product.id, active: true });
    for (let price of stripePrices.data) {
      await supabase.from('prices').upsert({
        id: price.id,
        product_id: price.product as string,
        active: price.active,
        currency: price.currency,
        description: price.nickname,
        type: price.type,
        unit_amount: price.unit_amount,
        interval: price.recurring?.interval,
        interval_count: price.recurring?.interval_count,
        trial_period_days: price.recurring?.trial_period_days,
        metadata: price.metadata
      });
    }
  }

  console.log('Stripe data synced successfully');
}