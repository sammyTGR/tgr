import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase/client';

export async function GET() {
  try {
    const { data, error } = await supabase.rpc('fetch_aggregated_sales_data');

    if (error) throw error;

    const result = data.map((row: { category_label: string; total_sales: number }) => ({
      name: row.category_label || 'Unknown',
      value: row.total_sales,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching aggregated sales data:', error);
    return NextResponse.json({ error: 'Failed to fetch aggregated sales data' }, { status: 500 });
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
