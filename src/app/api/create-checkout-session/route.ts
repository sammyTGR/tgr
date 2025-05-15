'use server';

import { NextResponse } from 'next/server';
import { stripe } from '@/utils/stripe/config';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types_db';

export async function POST(req: Request) {
  try {
    const { classId } = await req.json();
    //console.log("Received classId:", classId);

    const supabase = createServerComponentClient<Database>({ cookies });

    // Get the current user's session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('User authentication error:', userError);
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Fetch the class details
    const { data: classData, error: classError } = await supabase
      .from('class_schedules')
      .select('*')
      .eq('id', classId)
      .single();

    if (classError) {
      console.error('Supabase error fetching class:', classError);
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    if (!classData) {
      console.error('Class data is null for classId:', classId);
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    //console.log("Class data:", JSON.stringify(classData, null, 2));

    if (!classData.stripe_price_id) {
      console.error('Stripe price ID is missing for the class:', classId);
      return NextResponse.json({ error: 'Invalid class data' }, { status: 400 });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: classData.stripe_price_id,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get(
        'origin'
      )}/success?session_id={CHECKOUT_SESSION_ID}&class_id=${classId}`,
      cancel_url: `${req.headers.get('origin')}/public/classes`,
      metadata: {
        class_id: classId.toString(),
      },
      client_reference_id: user.id,
    });

    //console.log("Stripe session created:", session.id);
    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (err: any) {
    console.error('Detailed error:', err);
    return NextResponse.json(
      { error: 'Error creating checkout session', details: err.message },
      { status: 500 }
    );
  }
}
