'use server';

import Stripe from 'stripe';
import { stripe } from '@/utils/stripe/config';
import { createClient } from '@/utils/supabase/server';
import { getURL } from '@/utils/stripe/helpers';
import { Tables } from '@/types_db';
import { Redis } from '@upstash/redis';

type Price = Tables<'prices'> & {
    type: 'one_time' | 'recurring';
    // ... other fields
  };

type CheckoutResponse = {
  sessionId?: string;
  error?: {
    message: string;
  };
};

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

const CACHE_TTL = 3600; // 1 hour in seconds

export async function checkoutWithStripe(
    price: Price,
    redirectPath: string = '/'
  ): Promise<CheckoutResponse> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not found');
    }

    // Retrieve or create the customer in Stripe
    const { data: customer } = await supabase
      .from('customers')
      .select('stripe_customer_id, email, first_name, last_name')
      .eq('user_uuid', user.id)
      .single();

    if (!customer) {
      throw new Error('Customer not found');
    }

    let stripe_customer_id = customer.stripe_customer_id;

    if (!stripe_customer_id) {
      const stripeCustomer = await stripe.customers.create({
        email: customer.email,
        name: `${customer.first_name} ${customer.last_name}`.trim(),
        metadata: {
          supabase_uuid: user.id,
        },
      });
      stripe_customer_id = stripeCustomer.id;

      await supabase
        .from('customers')
        .update({ stripe_customer_id })
        .eq('user_uuid', user.id);
    }

    // Determine the mode based on the price type
    const mode = price.type === 'one_time' ? 'payment' : 'subscription';

    // Create a checkout session in Stripe
    const session = await stripe.checkout.sessions.create({
        customer: stripe_customer_id,
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
        mode: mode,
        allow_promotion_codes: true,
        ...(mode === 'subscription' && {
          subscription_data: {
            metadata: {
              user_uuid: user.id,
            },
          },
        }),
        success_url: `${getURL()}${redirectPath}`,
        cancel_url: `${getURL()}/pricing`,
      });

    return { sessionId: session.id };
  } catch (error) {
    console.error(error);
    return {
      error: {
        message: 'An error occurred during checkout. Please try again.',
      },
    };
  }
}

export async function createStripePortalSession(userUuid: string) {
  try {
    const supabase = createClient();

    const { data: customer } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('user_uuid', userUuid)
      .single();

    if (!customer?.stripe_customer_id) {
      throw new Error('No associated Stripe customer found');
    }

    const { url } = await stripe.billingPortal.sessions.create({
      customer: customer.stripe_customer_id,
      return_url: `${getURL()}/crew/profile/${userUuid}`,
    });

    return { url };
  } catch (error) {
    console.error(error);
    return {
      error: {
        message: 'An error occurred while creating the portal session.',
      },
    };
  }
}

async function batchUpdateSubscriptions(updates: any[]) {
  const supabase = createClient();
  const { error } = await supabase
    .from('subscriptions')
    .upsert(updates, { onConflict: 'id' });
  
  if (error) console.error('Error batch updating subscriptions:', error);
}

export async function handleStripeWebhook(event: Stripe.Event) {
  const { type, data } = event;

  switch (type) {
    case 'customer.subscription.updated':
    case 'customer.subscription.created':
    case 'customer.subscription.deleted':
      const subscription = data.object as Stripe.Subscription;
      const cacheKey = `subscription:${subscription.id}`;
      const cachedSubscription = await redis.get(cacheKey);

      if (!cachedSubscription || JSON.stringify(subscription) !== cachedSubscription) {
        await redis.set(cacheKey, JSON.stringify(subscription), { ex: CACHE_TTL });
        
        // Queue update for batch processing
        await redis.lpush('subscription_updates', JSON.stringify(subscription));
      }
      break;
    // Handle other event types...
  }
}

export async function processBatchUpdates() {
    const updates = await redis.lrange('subscription_updates', 0, -1);
    if (updates.length > 0) {
      await batchUpdateSubscriptions(updates.map((update: string) => JSON.parse(update)));
      await redis.del('subscription_updates');
    }
  }