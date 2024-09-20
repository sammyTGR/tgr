import { NextResponse } from 'next/server';
import { syncStripeData } from '@/utils/stripe/syncStripeData';

export async function GET(req: Request) {
  try {
    await syncStripeData();
    return NextResponse.json({ message: 'Stripe data synced successfully' });
  } catch (error) {
    console.error('Error syncing Stripe data:', error);
    return NextResponse.json({ error: 'Failed to sync Stripe data' }, { status: 500 });
  }
}