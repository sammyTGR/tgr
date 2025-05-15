import { NextResponse } from 'next/server';
import { stripe } from '@/utils/stripe/config';
import { createClient } from '@/utils/supabase/server';
import Stripe from 'stripe';

export async function POST(req: Request) {
  const { sessionId } = await req.json();

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'line_items.data.price.product'],
    });

    if (session.payment_status !== 'paid') {
      throw new Error('Payment not successful');
    }

    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Error fetching user:', userError);
      throw new Error('Could not get user');
    }

    // Fetch customer data from the customers table
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('user_uuid', user.id)
      .single();

    if (customerError) {
      console.error('Error fetching customer data:', customerError);
      throw new Error('Could not fetch customer data');
    }

    if (!customerData) {
      console.error('Customer data not found');
      throw new Error('Customer data not found');
    }

    const product = session.line_items?.data[0]?.price?.product as Stripe.Product | null;
    const isTrainingClass = session.metadata?.product_type === 'training';
    let purchaseData = null;
    let productName = null;

    if (isTrainingClass) {
      // Update class_enrollments table for training classes
      const { error: enrollmentError } = await supabase
        .from('class_enrollments')
        .update({
          payment_status: 'paid',
          stripe_session_id: session.id,
        })
        .eq('stripe_session_id', session.id);

      if (enrollmentError) {
        console.error('Error updating class enrollment:', enrollmentError);
        throw new Error(`Failed to update class enrollment: ${enrollmentError.message}`);
      }
      productName = session.metadata?.productName || 'Training Class';
    } else {
      // Only insert into purchases table for non-training products
      const { data, error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          user_id: user.id,
          first_name: customerData.first_name,
          last_name: customerData.last_name,
          email: customerData.email,
          product_id:
            session.metadata?.productId || (product && 'id' in product ? product.id : null),
          product_name:
            session.metadata?.productName || (product && 'name' in product ? product.name : null),
          amount: session.amount_total ? session.amount_total / 100 : null,
          currency: session.currency,
          status: session.payment_status,
          payment_intent_id: session.payment_intent as string,
          stripe_session_id: session.id,
        })
        .select();

      if (purchaseError) {
        console.error('Error inserting purchase:', purchaseError);
        throw new Error(`Failed to record purchase: ${purchaseError.message}`);
      }

      purchaseData = data[0];
      productName = purchaseData.product_name || 'your item';
    }

    // Update customer payment status and last payment date
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        payment_status: 'active',
        last_payment_date: new Date().toISOString(),
      })
      .eq('user_uuid', user.id);

    if (updateError) {
      console.error('Error updating customer payment status:', updateError);
      // Don't throw an error here, as the purchase was successful
    }

    return NextResponse.json({
      success: true,
      purchase: purchaseData,
      productName: productName,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
  }
}
