import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { format, toZonedTime } from "date-fns-tz";

const timeZone = "America/New_York";

interface SalesMetrics {
  averageMonthlyGrossRevenue: number;
  averageMonthlyNetRevenue: number;
  topPerformingCategories: { category: string; revenue: number }[];
  peakHours: { hour: number; transactions: number }[];
  customerFrequency: { visits: string; percentage: number }[];
}

interface SalesData {
  Date: string;
  SoldPrice: number;
  Cost: number;
  category_label: string;
  total_net: number;
}

interface MonthlyRevenue {
  month: string;
  gross_revenue: number;
  net_revenue: number;
}

function calculateMonthlyMetrics(salesData: SalesData[]): SalesMetrics {
  const monthlyGrossRevenues = salesData.reduce((acc, curr) => {
    const month = new Date(curr.Date).getMonth();
    acc[month] = (acc[month] || 0) + curr.SoldPrice;
    return acc;
  }, {} as Record<number, number>);

  const monthlyNetRevenues = salesData.reduce((acc, curr) => {
    const month = new Date(curr.Date).getMonth();
    acc[month] = (acc[month] || 0) + curr.total_net;
    return acc;
  }, {} as Record<number, number>);

  const averageMonthlyGrossRevenue =
    Object.values(monthlyGrossRevenues).reduce((a, b) => a + b, 0) /
    Math.max(Object.keys(monthlyGrossRevenues).length, 1);

  const averageMonthlyNetRevenue =
    Object.values(monthlyNetRevenues).reduce((a, b) => a + b, 0) /
    Math.max(Object.keys(monthlyNetRevenues).length, 1);

  const categoryRevenues = salesData.reduce((acc, curr) => {
    const category = curr.category_label || "Other";
    acc[category] = (acc[category] || 0) + curr.total_net;
    return acc;
  }, {} as Record<string, number>);

  const sortedCategories = Object.entries(categoryRevenues)
    .map(([category, revenue]) => ({
      category,
      revenue: revenue as number,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 3);

  const hourlyTransactions = salesData.reduce((acc, curr) => {
    const hour = new Date(curr.Date).getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const sortedHours = Object.entries(hourlyTransactions)
    .map(([hour, transactions]) => ({
      hour: parseInt(hour),
      transactions: transactions as number,
    }))
    .sort((a, b) => b.transactions - a.transactions)
    .slice(0, 3);

  return {
    averageMonthlyGrossRevenue,
    averageMonthlyNetRevenue,
    topPerformingCategories: sortedCategories,
    peakHours: sortedHours,
    customerFrequency: [
      { visits: "First Time", percentage: 30 },
      { visits: "Regular (2-5x/month)", percentage: 45 },
      { visits: "Frequent (6+/month)", percentage: 25 },
    ],
  };
}

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const startDate = "2024-01-01";
    const endDate = format(toZonedTime(new Date(), timeZone), "yyyy-MM-dd", {
      timeZone,
    });

    const { data: revenueData, error: revenueError } = await supabase.rpc(
      "calculate_monthly_revenue",
      {
        start_date: startDate,
        end_date: endDate,
      }
    );

    if (revenueError) throw revenueError;

    const monthlyRevenues = revenueData as MonthlyRevenue[];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth(); // 0-11

    // For 2024, only include months up to the current month
    const averageMonthlyGrossRevenue =
      monthlyRevenues.length > 0
        ? monthlyRevenues
            .slice(0, currentMonth + 1) // Only include months up to current month
            .reduce((sum, month) => sum + Number(month.gross_revenue), 0) /
          (currentMonth + 1) // Divide by number of months that have passed
        : 0;

    const averageMonthlyNetRevenue =
      monthlyRevenues.length > 0
        ? monthlyRevenues
            .slice(0, currentMonth + 1)
            .reduce((sum, month) => sum + Number(month.net_revenue), 0) /
          (currentMonth + 1)
        : 0;

    const { data: salesData, error } = await supabase
      .from("sales_data")
      .select('"Date", "SoldPrice", "Cost", category_label, total_net')
      .gte("Date", startDate)
      .lte("Date", endDate)
      .order("Date", { ascending: true });

    if (error) throw error;

    const categoryRevenues = salesData.reduce((acc, curr) => {
      const category = curr.category_label || "Other";
      acc[category] = (acc[category] || 0) + curr.total_net;
      return acc;
    }, {} as Record<string, number>);

    const sortedCategories = Object.entries(categoryRevenues)
      .map(([category, revenue]) => ({
        category,
        revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3);

    const hourlyTransactions = salesData.reduce((acc, curr) => {
      const hour = new Date(curr.Date).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const sortedHours = Object.entries(hourlyTransactions)
      .map(([hour, transactions]) => ({
        hour: parseInt(hour),
        transactions,
      }))
      .sort((a, b) => b.transactions - a.transactions)
      .slice(0, 3);

    return NextResponse.json({
      averageMonthlyGrossRevenue,
      averageMonthlyNetRevenue,
      topPerformingCategories: sortedCategories,
      peakHours: sortedHours,
      customerFrequency: [
        { visits: "First Time", percentage: 30 },
        { visits: "Regular (2-5x/month)", percentage: 45 },
        { visits: "Frequent (6+/month)", percentage: 25 },
      ],
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics data" },
      { status: 500 }
    );
  }
}
