import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { PostgrestFilterBuilder } from '@supabase/postgrest-js';

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    let query = supabase
      .from('employees')
      .select(searchParams.get('select') || '*') as PostgrestFilterBuilder<any, any, any>;

    // Handle ordering
    const order = searchParams.get('order');
    if (order) {
      const [column, direction] = order.split('.');
      query = query.order(column, { ascending: direction === 'asc' });
    } else {
      // Default ordering by lanid if no order specified
      query = query.order('lanid', { ascending: true });
    }

    // Handle filtering parameters including equals conditions
    Array.from(searchParams.entries()).forEach(([key, value]) => {
      if (!['select', 'order', 'single'].includes(key)) {
        // Handle equals condition in the format "field:value"
        if (key === 'equals') {
          const [field, fieldValue] = value.split(':');
          query = query.eq(field, fieldValue);
        } else if (key === 'pay_type') {
          // Handle pay_type filter to include both hourly and salary
          query = query.in('pay_type', value.split(','));
        } else {
          query = query.eq(key, value);
        }
      }
    });

    // If no specific pay_type filter is provided, include both hourly and salary
    if (!searchParams.has('pay_type')) {
      query = query.in('pay_type', ['hourly', 'salary']);
    }

    const { data, error } = await (searchParams.get('single') === 'true' ? query.single() : query);

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Error in fetchEmployees:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
