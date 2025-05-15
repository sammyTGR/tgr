import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const { count, error } = await supabase
      .from('chat_messages')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;

    return NextResponse.json({ unreadCount: count });
  } catch (error) {
    console.error('Error fetching unread messages:', error);
    return NextResponse.json({ error: 'Failed to fetch unread messages' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    },
  });
}
