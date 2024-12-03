import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { format } from 'date-fns';

interface MonthlyRevenue {
  [key: string]: number;
}

interface SaleData {
  Date: string;
  SoldPrice: number;
  Cost: number;
}

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    
    const { data, error } = await supabase
      .from('sales_data')
      .select('*')
      .gte('Date', format(sixMonthsAgo, 'yyyy-MM-dd'))
      .order('Date', { ascending: true });

    if (error) throw error;

    const monthlyRevenue: MonthlyRevenue = (data as SaleData[]).reduce((acc, sale) => {
      const monthKey = format(new Date(sale.Date), 'MMM yyyy');
      if (!acc[monthKey]) {
        acc[monthKey] = 0;
      }
      acc[monthKey] += Number(sale.SoldPrice) - Number(sale.Cost);
      return acc;
    }, {} as MonthlyRevenue);

    const formattedData = Object.entries(monthlyRevenue).map(([month, revenue]) => ({
      month,
      revenue: Number(revenue.toFixed(2))
    }));

    return NextResponse.json(formattedData);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch revenue data' }, { status: 500 });
  }
}