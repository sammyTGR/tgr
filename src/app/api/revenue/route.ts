// src/app/api/revenue/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { toZonedTime, format as formatTZ } from 'date-fns-tz';

const timeZone = 'America/Los_Angeles';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Set the date range to include all data
    const startDate = '2023-12-01';
    const endDate = formatTZ(toZonedTime(new Date(), timeZone), 'yyyy-MM-dd', { timeZone });
    
    // console.log('Query dates:', { startDate, endDate });

    const { data, error } = await supabase
      .rpc('calculate_monthly_revenue', {
        start_date: startDate,
        end_date: endDate
      });

    // console.log('Raw RPC response:', data);

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    // Initialize all months with 0
    const months = [
      'Dec 2023',
      'Jan 2024', 'Feb 2024', 'Mar 2024', 'Apr 2024', 
      'May 2024', 'Jun 2024', 'Jul 2024', 'Aug 2024',
      'Sep 2024', 'Oct 2024', 'Nov 2024', 'Dec 2024'
    ];
    
    const monthlyRevenue = months.reduce((acc, month) => {
      acc[month] = 0;
      return acc;
    }, {} as Record<string, number>);

    // Fill in the actual revenue data
    data?.forEach((row: any) => {
      // console.log('Processing row:', row);
      const date = toZonedTime(new Date(row.month), timeZone);
      date.setDate(date.getDate() + 1);
      const monthKey = formatTZ(date, 'MMM yyyy', { timeZone });
      // console.log('Date conversion:', { date, monthKey });
      monthlyRevenue[monthKey] = Number(row.revenue);
    });

    // console.log('Final monthly revenue:', monthlyRevenue);

    const formattedData = months.map(month => ({
      month,
      revenue: Number(monthlyRevenue[month].toFixed(2))
    }));

    // console.log('Formatted response:', formattedData);

    return NextResponse.json(formattedData);

  } catch (error) {
    // console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch revenue data' }, { status: 500 });
  }
}