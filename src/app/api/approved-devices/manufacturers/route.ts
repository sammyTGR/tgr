import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// In-memory cache
let cachedManufacturers: string[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60 * 60 * 24 * 1000; // 1 day

export async function GET(req: NextRequest) {
  const now = Date.now();
  if (cachedManufacturers && now - cacheTimestamp < CACHE_TTL) {
    return NextResponse.json(cachedManufacturers);
  }

  const supabase = createRouteHandlerClient({ cookies });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let allManufacturers: any[] = [];
    let page = 0;
    const pageSize = 1000; // Supabase default limit
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('approved_devices')
        .select('manufacturer')
        .not('manufacturer', 'is', null)
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      if (data && data.length > 0) {
        allManufacturers.push(...data);
        page++;
      } else {
        hasMore = false;
      }
    }

    // Extract unique manufacturers and sort them
    const manufacturers = Array.from(
      new Set(
        allManufacturers
          .map((row) => row.manufacturer)
          .filter((m): m is string => typeof m === 'string' && m.trim() !== '')
      )
    ).sort();

    cachedManufacturers = manufacturers;
    cacheTimestamp = now;
    return NextResponse.json(manufacturers);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
