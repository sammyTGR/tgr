import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/utils/stripe/config';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const supabase = createClient();

  switch (event.type) {
    // Customer subscription events
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
    case 'customer.subscription.paused':
    case 'customer.subscription.resumed':
    case 'customer.subscription.pending_update_applied':
    case 'customer.subscription.pending_update_expired':
    case 'customer.subscription.trial_will_end':
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionChange(supabase, subscription);
      break;

    // Invoice events
    case 'invoice.created':
    case 'invoice.deleted':
    case 'invoice.finalization_failed':
    case 'invoice.finalized':
    case 'invoice.marked_uncollectible':
    case 'invoice.paid':
    case 'invoice.payment_action_required':
    case 'invoice.payment_failed':
    case 'invoice.payment_succeeded':
    case 'invoice.sent':
    case 'invoice.upcoming':
    case 'invoice.updated':
    case 'invoice.voided':
    case 'invoice.will_be_due':
      const invoice = event.data.object as Stripe.Invoice;
      await handleInvoiceEvent(supabase, invoice, event.type);
      break;

    // Invoice item events
    case 'invoiceitem.created':
    case 'invoiceitem.deleted':
      const invoiceItem = event.data.object as Stripe.InvoiceItem;
      await handleInvoiceItemEvent(supabase, invoiceItem, event.type);
      break;

    // Price events
    case 'price.created':
    case 'price.updated':
    case 'price.deleted':
      const price = event.data.object as Stripe.Price;
      await handlePriceEvent(supabase, price, event.type);
      break;

    // Product events
    case 'product.created':
    case 'product.updated':
    case 'product.deleted':
      const product = event.data.object as Stripe.Product;
      await handleProductEvent(supabase, product, event.type);
      break;

    // Subscription schedule events
    case 'subscription_schedule.aborted':
    case 'subscription_schedule.canceled':
      const subscriptionSchedule = event.data.object as Stripe.SubscriptionSchedule;
      await handleSubscriptionScheduleEvent(supabase, subscriptionSchedule, event.type);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

async function handleSubscriptionChange(supabase: any, subscription: Stripe.Subscription) {
  // Update subscription in your database
  await supabase
    .from('subscriptions')
    .upsert({
      id: subscription.id,
      user_id: subscription.customer as string,
      status: subscription.status,
      price_id: subscription.items.data[0].price.id,
      // Add other relevant fields
    });
}

async function handleInvoiceEvent(supabase: any, invoice: Stripe.Invoice, eventType: string) {
  // Handle invoice events (e.g., update payment status)
  await supabase
    .from('invoices')
    .upsert({
      id: invoice.id,
      customer_id: invoice.customer as string,
      status: invoice.status,
      total: invoice.total,
      // Add other relevant fields
    });
}

async function handleInvoiceItemEvent(supabase: any, invoiceItem: Stripe.InvoiceItem, eventType: string) {
  // Handle invoice item events if necessary
  console.log(`Handled ${eventType} for invoice item ${invoiceItem.id}`);
}

async function handlePriceEvent(supabase: any, price: Stripe.Price, eventType: string) {
  if (eventType === 'price.deleted') {
    await supabase
      .from('prices')
      .delete()
      .match({ id: price.id });
  } else {
    await supabase
      .from('prices')
      .upsert({
        id: price.id,
        product_id: price.product as string,
        active: price.active,
        currency: price.currency,
        type: price.type,
        unit_amount: price.unit_amount,
        // Add other relevant fields
      });
  }
}

async function handleProductEvent(supabase: any, product: Stripe.Product, eventType: string) {
  if (eventType === 'product.deleted') {
    await supabase
      .from('products')
      .delete()
      .match({ id: product.id });
  } else {
    await supabase
      .from('products')
      .upsert({
        id: product.id,
        active: product.active,
        name: product.name,
        description: product.description,
        // Add other relevant fields
      });
  }
}

async function handleSubscriptionScheduleEvent(supabase: any, schedule: Stripe.SubscriptionSchedule, eventType: string) {
  // Handle subscription schedule events if necessary
  console.log(`Handled ${eventType} for subscription schedule ${schedule.id}`);
}