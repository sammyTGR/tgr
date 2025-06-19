import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// In-memory cache
let cachedData: { rows: any[]; total: number } | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60 * 60 * 24 * 1000; // 1 day

export async function GET(req: NextRequest) {
  const now = Date.now();
  if (cachedData && now - cacheTimestamp < CACHE_TTL) {
    return NextResponse.json(cachedData);
  }

  const supabase = createRouteHandlerClient({ cookies });
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error, count } = await supabase
      .from('approved_devices')
      .select('manufacturer, model, type, description', { count: 'exact' })
      .order('manufacturer', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    cachedData = { rows: data, total: count || 0 };
    cacheTimestamp = now;
    return NextResponse.json(cachedData);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
