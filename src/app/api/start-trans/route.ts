import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase/client';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('pointslist')
      .select('start_trans')
      .neq('start_trans', null)
      .order('start_trans', { ascending: true });

    if (error) throw error;

    const distinctStartTrans = Array.from(new Set(data.map((item) => item.start_trans)));

    return NextResponse.json(distinctStartTrans);
  } catch (error: any) {
    console.error('Error fetching start_trans:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
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
