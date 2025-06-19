import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// In-memory cache
let cachedData: { rows: any[]; total: number } | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60 * 60 * 24 * 1000; // 1 day

export async function GET(req: NextRequest) {
  const now = Date.now();
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const manufacturer = searchParams.get('manufacturer');
  const model = searchParams.get('model');

  // Don't use cache if there are filters
  if (!manufacturer && !model && cachedData && now - cacheTimestamp < CACHE_TTL) {
    return NextResponse.json(cachedData);
  }

  const supabase = createRouteHandlerClient({ cookies });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query = supabase
      .from('approved_devices')
      .select('manufacturer, model, type, description', { count: 'exact' })
      .order('manufacturer', { ascending: true });

    // Apply filters if they exist
    if (manufacturer && manufacturer !== 'all-manufacturers') {
      query = query.eq('manufacturer', manufacturer);
    }
    if (model) {
      query = query.ilike('model', `%${model}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Only cache unfiltered results
    if (!manufacturer && !model) {
      cachedData = { rows: data, total: count || 0 };
      cacheTimestamp = now;
    }

    return NextResponse.json({ rows: data, total: count || 0 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
