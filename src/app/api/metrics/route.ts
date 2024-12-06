import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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

    const { data: salesData, error } = await supabase
      .from("sales_data")
      .select('"Date", "SoldPrice", "Cost", category_label, total_net')
      .gte(
        "Date",
        new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
      )
      .order("Date", { ascending: true });

    if (error) {
      console.error("Supabase query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!salesData || salesData.length === 0) {
      return NextResponse.json({
        averageMonthlyGrossRevenue: 0,
        averageMonthlyNetRevenue: 0,
        topPerformingCategories: [],
        peakHours: [],
        customerFrequency: [],
      });
    }

    const metrics = calculateMonthlyMetrics(salesData as SalesData[]);

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics data" },
      { status: 500 }
    );
  }
}
