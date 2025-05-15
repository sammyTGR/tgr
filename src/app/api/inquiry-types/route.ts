import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('orderlist')
      .select('inquiry_type')
      .neq('inquiry_type', null)
      .order('inquiry_type', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // console.log("Raw data from Supabase:", data);

    if (!data || data.length === 0) {
      //console.log("No data returned from Supabase");
      return NextResponse.json([]);
    }

    const distinctTypes = Array.from(new Set(data.map((item) => item.inquiry_type))).filter(
      (type) => type && type.trim() !== ''
    );

    // console.log("Distinct inquiry types:", distinctTypes);

    return NextResponse.json(distinctTypes);
  } catch (err: any) {
    console.error('Unexpected error fetching inquiry types:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
