import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    // console.log("Starting metrics fetch...");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) {
      console.error("User auth error:", userError);
      return NextResponse.json(
        { error: "Authentication error", details: userError },
        { status: 401 }
      );
    }

    if (!user) {
      // console.log("No user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      // Fetch sales data first to verify the connection
      const { data: testData, error: testError } = await supabase
        .from("sales_data")
        .select("count")
        .single();

      if (testError) {
        console.error("Database connection test error:", testError);
        return NextResponse.json(
          {
            error: "Database connection error",
            details: testError,
          },
          { status: 500 }
        );
      }

      // console.log("Database connection successful, proceeding with metrics...");

      // Fetch metrics with better error handling
      const [metrics2024Result, metrics2025Result] = await Promise.allSettled([
        fetchYearMetrics(supabase, "2024-01-01", "2024-12-31"),
        fetchYearMetrics(supabase, "2025-01-01", "2025-12-31"),
      ]);

      const metrics2024 =
        metrics2024Result.status === "fulfilled"
          ? metrics2024Result.value
          : null;
      const metrics2025 =
        metrics2025Result.status === "fulfilled"
          ? metrics2025Result.value
          : null;

      // console.log("Metrics fetched:", {
      //   metrics2024Status: metrics2024Result.status,
      //   metrics2025Status: metrics2025Result.status,
      // });

      return NextResponse.json({
        metrics2024: metrics2024 || getDefaultMetrics(),
        metrics2025: metrics2025 || getDefaultMetrics(),
      });
    } catch (error) {
      console.error("Metrics calculation error:", error);
      return NextResponse.json(
        {
          error: "Metrics calculation failed",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        error: "API error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Helper function for default metrics
function getDefaultMetrics() {
  return {
    averageMonthlyGrossRevenue: 0,
    averageMonthlyNetRevenue: 0,
    topPerformingCategories: [],
    peakHours: [],
    customerFrequency: [
      { visits: "First Time", percentage: 0 },
      { visits: "Regular (2-5x/month)", percentage: 0 },
      { visits: "Frequent (6+/month)", percentage: 0 },
    ],
  };
}

async function fetchYearMetrics(
  supabase: any,
  startDate: string,
  endDate: string
) {
  try {
    // console.log(`Fetching metrics for ${startDate} to ${endDate}`);

    const { data: salesData, error: salesError } = await supabase
      .from("sales_data")
      .select("*")
      .gte("Date", startDate)
      .lte("Date", endDate);

    if (salesError) {
      console.error(
        `Sales data fetch error for ${startDate}-${endDate}:`,
        salesError
      );
      return getDefaultMetrics();
    }

    if (!salesData || salesData.length === 0) {
      // console.log(`No sales data found for ${startDate} to ${endDate}`);
      return getDefaultMetrics();
    }

    // Calculate metrics
    const monthlyGrossRevenue = salesData.reduce(
      (acc: any, sale: any) => acc + (parseFloat(sale.SoldPrice) || 0),
      0
    );
    const monthlyNetRevenue = salesData.reduce((acc: any, sale: any) => {
      const soldPrice = parseFloat(sale.SoldPrice) || 0;
      const cost = parseFloat(sale.Cost) || 0;
      return acc + (soldPrice - cost);
    }, 0);

    // Calculate categories performance
    const categoryPerformance = salesData.reduce((acc: any, sale: any) => {
      const category = sale.category_label || "Uncategorized";
      if (!acc[category]) acc[category] = 0;
      acc[category] += parseFloat(sale.SoldPrice) || 0;
      return acc;
    }, {});

    const topPerformingCategories = Object.entries(categoryPerformance)
      .map(([category, revenue]) => ({ category, revenue: revenue as number }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Calculate peak hours
    const hourlyTransactions = salesData.reduce((acc: any, sale: any) => {
      const hour = new Date(sale.Date).getHours();
      if (!acc[hour]) acc[hour] = 0;
      acc[hour]++;
      return acc;
    }, {});

    const peakHours = Object.entries(hourlyTransactions)
      .map(([hour, transactions]) => ({
        hour: parseInt(hour),
        transactions: transactions as number,
        formattedHour: `${parseInt(hour) % 12 || 12}${
          parseInt(hour) < 12 ? "AM" : "PM"
        }`,
      }))
      .sort((a, b) => b.transactions - a.transactions)
      .slice(0, 5);

    // First, get all transactions for each customer
    const customerTransactions = salesData.reduce(
      (acc: Record<string, any[]>, sale: any) => {
        if (sale.Acct) {
          const customerKey = sale.Acct.toString();
          if (!acc[customerKey]) {
            acc[customerKey] = [];
          }
          acc[customerKey].push({
            date: new Date(sale.Date),
            monthKey: new Date(sale.Date).toISOString().slice(0, 7),
          });
        }
        return acc;
      },
      {}
    );

    // Calculate monthly visit frequency for each customer
    const customerVisitFrequency = Object.entries(customerTransactions).reduce(
      (
        acc: Record<string, number>,
        [customerId, transactions]: [string, unknown]
      ) => {
        // Group transactions by month
        const monthlyVisits = (
          transactions as Array<{ monthKey: string }>
        ).reduce((monthAcc: Record<string, number>, trans) => {
          const monthKey = trans.monthKey;
          monthAcc[monthKey] = (monthAcc[monthKey] || 0) + 1;
          return monthAcc;
        }, {});

        // Calculate average monthly visits
        const months = Object.values(monthlyVisits);
        const avgVisitsPerMonth = Math.round(
          months.reduce((sum: any, visits: any) => sum + visits, 0) /
            months.length
        );

        acc[customerId] = avgVisitsPerMonth;
        return acc;
      },
      {}
    );

    // console.log(
    //   "Customer visit frequency sample:",
    //   Object.entries(customerVisitFrequency).slice(0, 5)
    // );

    const totalCustomers = Object.keys(customerVisitFrequency).length;

    if (totalCustomers === 0) {
      // console.log("No customer data found");
      return {
        ...getDefaultMetrics(),
        averageMonthlyGrossRevenue: monthlyGrossRevenue / 12,
        averageMonthlyNetRevenue: monthlyNetRevenue / 12,
        topPerformingCategories,
        peakHours,
      };
    }

    // Categorize customers based on their average monthly visits
    const firstTimeCount = Object.values(customerVisitFrequency).filter(
      (visits: number) => visits === 1
    ).length;
    const regularCount = Object.values(customerVisitFrequency).filter(
      (visits: number) => visits >= 2 && visits <= 5
    ).length;
    const frequentCount = Object.values(customerVisitFrequency).filter(
      (visits: number) => visits >= 6
    ).length;

    // console.log("Customer frequency counts:", {
    //   firstTimeCount,
    //   regularCount,
    //   frequentCount,
    //   totalCustomers,
    //   sampleFrequencies: Object.values(customerVisitFrequency).slice(0, 5),
    // });

    const customerFrequency = [
      {
        visits: "First Time (1 visit/month)",
        percentage: Math.round((firstTimeCount / totalCustomers) * 100),
      },
      {
        visits: "Regular (2-5 visits/month)",
        percentage: Math.round((regularCount / totalCustomers) * 100),
      },
      {
        visits: "Frequent (6+ visits/month)",
        percentage: Math.round((frequentCount / totalCustomers) * 100),
      },
    ];

    // console.log("Final customer frequency:", customerFrequency);

    return {
      averageMonthlyGrossRevenue: monthlyGrossRevenue / 12,
      averageMonthlyNetRevenue: monthlyNetRevenue / 12,
      topPerformingCategories,
      peakHours,
      customerFrequency,
    };
  } catch (error) {
    console.error(
      `Error calculating metrics for ${startDate}-${endDate}:`,
      error
    );
    return getDefaultMetrics();
  }
}
