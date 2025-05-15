import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .eq('is_read', false)
      .eq('status', 'pending');

    if (ordersError) {
      console.error('Error fetching unread orders:', ordersError.message);
      return NextResponse.json({ error: ordersError.message }, { status: 500 });
    }

    return NextResponse.json({
      unreadOrderCount: orders?.length || 0,
    });
  } catch (error: any) {
    console.error('Error fetching unread orders:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch unread orders',
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
