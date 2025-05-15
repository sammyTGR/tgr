import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase/client';

export async function GET() {
  try {
    const today = new Date();
    const previousDay = new Date(today);
    previousDay.setDate(today.getDate() - 1);

    const { data, error } = await supabase
      .from('sales_data')
      .select('Lanid, category_label, SoldPrice, SoldQty, Date')
      .eq('Date', previousDay.toISOString().split('T')[0]);

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch previous day sales data:', error);
    return NextResponse.json({ error: 'Failed to fetch previous day sales data' }, { status: 500 });
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
