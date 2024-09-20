'use server';

import Stripe from 'stripe';
import { stripe } from '@/utils/stripe/config';
import { createClient } from '@/utils/supabase/server';
import { getURL } from '@/utils/stripe/helpers';
import { Tables } from '@/types_db';

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
      return_url: `${getURL()}/account`,
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