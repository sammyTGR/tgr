import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { toZonedTime, format as formatTZ } from 'date-fns-tz';

const timeZone = 'America/Los_Angeles';

// Helper functions
function calculateMonthlyGrowthRate(salesData: any[]) {
  if (salesData.length < 2) return 0;

  const monthlyTotals = salesData.reduce((acc, curr) => {
    const month = new Date(curr.date).toISOString().slice(0, 7);
    acc[month] = (acc[month] || 0) + curr.amount;
    return acc;
  }, {});

  const months = Object.keys(monthlyTotals).sort();
  const lastMonth = monthlyTotals[months[months.length - 1]];
  const previousMonth = monthlyTotals[months[months.length - 2]];

  return (lastMonth - previousMonth) / previousMonth;
}

// Revenue endpoint
export async function GET(req: Request) {
  const url = new URL(req.url);
  const endpoint = url.pathname.split('/').pop();
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle revenue endpoint
    if (endpoint === 'revenue') {
      const startDate = '2024-01-01';
      const endDate = formatTZ(toZonedTime(new Date(), timeZone), 'yyyy-MM-dd', { timeZone });

      const { data, error } = await supabase.rpc('calculate_monthly_revenue', {
        start_date: startDate,
        end_date: endDate,
      });

      if (error) throw error;

      const months = [
        'Jan 2024',
        'Feb 2024',
        'Mar 2024',
        'Apr 2024',
        'May 2024',
        'Jun 2024',
        'Jul 2024',
        'Aug 2024',
        'Sep 2024',
        'Oct 2024',
        'Nov 2024',
        'Dec 2024',
      ];

      const monthlyRevenue = months.reduce(
        (acc, month) => {
          acc[month] = 0;
          return acc;
        },
        {} as Record<string, number>
      );

      data?.forEach((row: any) => {
        const date = toZonedTime(new Date(row.month), timeZone);
        date.setDate(date.getDate() + 1);
        const monthKey = formatTZ(date, 'MMM yyyy', { timeZone });
        monthlyRevenue[monthKey] = Number(row.revenue);
      });

      const formattedData = months.map((month) => ({
        month,
        revenue: Number(monthlyRevenue[month].toFixed(2)),
      }));

      return NextResponse.json(formattedData);
    }

    // Handle metrics endpoint
    if (endpoint === 'metrics') {
      const { data: salesData, error } = await supabase
        .from('sales_data')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const metrics = {
        revenue: salesData.reduce((acc, curr) => acc + curr.amount, 0),
        totalTransactions: salesData.length,
        avgTransactionValue:
          salesData.reduce((acc, curr) => acc + curr.amount, 0) / salesData.length,
        monthlyGrowthRate: calculateMonthlyGrowthRate(salesData),
      };

      return NextResponse.json(metrics);
    }

    return NextResponse.json({ error: 'Invalid endpoint' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
