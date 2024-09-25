import { stripe } from "@/utils/stripe/config";
import { createClient } from "@/utils/supabase/server";

export async function syncStripeData() {
  const supabase = createClient();

  try {
    // Fetch all active products
    const stripeProducts = await stripe.products.list({
      active: true,
      limit: 100,
    });

    // Fetch all active prices
    const stripePrices = await stripe.prices.list({ active: true, limit: 100 });

    // Prepare product data for batch upsert
    const productsToUpsert = stripeProducts.data.map((product) => ({
      id: product.id,
      active: product.active,
      name: product.name,
      description: product.description,
      image: product.images[0] || null,
      metadata: product.metadata,
    }));

    // Batch upsert products
    const { error: productsError } = await supabase
      .from("products")
      .upsert(productsToUpsert, { onConflict: "id" });

    if (productsError) {
      console.error("Error upserting products:", productsError);
    }

    // Prepare price data for batch upsert
    const pricesToUpsert = stripePrices.data.map((price) => ({
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
      metadata: price.metadata,
    }));

    // Batch upsert prices
    const { error: pricesError } = await supabase
      .from("prices")
      .upsert(pricesToUpsert, { onConflict: "id" });

    if (pricesError) {
      console.error("Error upserting prices:", pricesError);
    }

    console.log(
      `Synced ${productsToUpsert.length} products and ${pricesToUpsert.length} prices successfully`
    );
  } catch (error) {
    console.error("Error syncing Stripe data:", error);
    throw error;
  }
}
