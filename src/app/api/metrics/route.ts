import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { toZonedTime as zonedTimeToUtc } from "date-fns-tz";

const TIMEZONE = "America/Los_Angeles";

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    // console.log("Starting metrics fetch...");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      // console.log("No user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      // Verify connection with the new table
      const { data: testData, error: testError } = await supabase
        .from("detailed_sales_data")
        .select("count")
        .single();

      if (testError) {
        console.error("Database connection test error:", testError);
        return NextResponse.json(
          { error: "Database connection error", details: testError },
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
    // Convert dates to UTC with timezone consideration
    const startDateTemp = new Date(startDate);
    startDateTemp.setHours(0, 0, 0, 0);
    const utcStartDate = zonedTimeToUtc(startDateTemp, TIMEZONE);

    const endDateTemp = new Date(endDate);
    endDateTemp.setHours(23, 59, 59, 999);
    const utcEndDate = zonedTimeToUtc(endDateTemp, TIMEZONE);

    const { data: salesData, error: salesError } = await supabase
      .from("detailed_sales_data")
      .select("*")
      .gte("SoldDate", utcStartDate.toISOString())
      .lte("SoldDate", utcEndDate.toISOString());

    if (salesError || !salesData || salesData.length === 0) {
      // console.log(`No sales data found for ${startDate} to ${endDate}`);
      return getDefaultMetrics();
    }

    // Calculate metrics using the new table structure
    const monthlyGrossRevenue = salesData.reduce(
      (acc: number, sale: any) => acc + (Number(sale.total_gross) || 0),
      0
    );

    const monthlyNetRevenue = salesData.reduce(
      (acc: number, sale: any) => acc + (Number(sale.Margin) || 0),
      0
    );

    // Calculate categories performance using CatDesc
    const categoryPerformance = salesData.reduce((acc: any, sale: any) => {
      const category = sale.CatDesc || "Uncategorized";
      if (!acc[category]) acc[category] = 0;
      acc[category] += Number(sale.total_gross) || 0;
      return acc;
    }, {});

    const topPerformingCategories = Object.entries(categoryPerformance)
      .map(([category, revenue]) => ({ category, revenue: revenue as number }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Calculate peak hours with timezone consideration
    const hourlyTransactions = salesData.reduce((acc: any, sale: any) => {
      const saleDate = new Date(sale.SoldDate);
      const localDate = new Date(
        saleDate.toLocaleString("en-US", { timeZone: TIMEZONE })
      );
      const hour = localDate.getHours();
      if (!acc[hour]) acc[hour] = 0;
      acc[hour]++;
      return acc;
    }, {});

    const peakHours = Object.entries(hourlyTransactions)
      .map(([hour, transactions]) => ({
        hour: parseInt(hour),
        transactions: transactions as number,
        formattedHour: `${parseInt(hour) % 12 || 12}${parseInt(hour) < 12 ? "AM" : "PM"}`,
      }))
      .sort((a, b) => b.transactions - a.transactions)
      .slice(0, 5);

    // Customer frequency calculation with timezone consideration
    const customerTransactions = salesData.reduce(
      (acc: Record<string, any[]>, sale: any) => {
        if (sale.Acct) {
          const customerKey = sale.Acct.toString();
          if (!acc[customerKey]) {
            acc[customerKey] = [];
          }
          const saleDate = new Date(sale.SoldDate);
          const localDate = new Date(
            saleDate.toLocaleString("en-US", { timeZone: TIMEZONE })
          );
          acc[customerKey].push({
            date: localDate,
            monthKey: localDate.toISOString().slice(0, 7),
          });
        }
        return acc;
      },
      {}
    );
    const customerVisitFrequency = Object.entries(customerTransactions).reduce<
      Record<string, number>
    >((acc, [customerId, transactions]) => {
      const monthlyVisits = (transactions as any[]).reduce<
        Record<string, number>
      >((monthAcc, trans) => {
        monthAcc[trans.monthKey] = (monthAcc[trans.monthKey] || 0) + 1;
        return monthAcc;
      }, {});

      const avgVisitsPerMonth = Math.round(
        Object.values(monthlyVisits).reduce(
          (sum: number, visits: number) => sum + visits,
          0
        ) / Object.keys(monthlyVisits).length
      );

      acc[customerId] = avgVisitsPerMonth;
      return acc;
    }, {});

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

    // Calculate customer frequency percentages
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
