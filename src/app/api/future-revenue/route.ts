import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { toZonedTime, format as formatTZ } from "date-fns-tz";

const TIMEZONE = "America/Los_Angeles";

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Convert dates to UTC with timezone consideration
    try {
      const startDateTemp = new Date("2025-01-01");
      startDateTemp.setHours(0, 0, 0, 0);
      const startDate = toZonedTime(startDateTemp, TIMEZONE);

      const endDateTemp = new Date("2025-12-31");
      endDateTemp.setHours(23, 59, 59, 999);
      const endDate = toZonedTime(endDateTemp, TIMEZONE);

      console.log("Date conversion:", {
        startDateTemp: startDateTemp.toISOString(),
        endDateTemp: endDateTemp.toISOString(),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      const { data, error } = await supabase.rpc("calculate_monthly_revenue", {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      });

      if (error) {
        console.error("RPC Error:", error);
        throw error;
      }

      console.log("RPC Response:", {
        rowCount: data?.length,
        firstRow: data?.[0],
        lastRow: data?.[data?.length - 1],
      });

      // Initialize all months with 0
      const months = [
        "Jan 2025",
        "Feb 2025",
        "Mar 2025",
        "Apr 2025",
        "May 2025",
        "Jun 2025",
        "Jul 2025",
        "Aug 2025",
        "Sep 2025",
        "Oct 2025",
        "Nov 2025",
        "Dec 2025",
      ];

      const monthlyRevenue = months.reduce(
        (acc, month) => {
          acc[month] = { grossRevenue: 0, netRevenue: 0 };
          return acc;
        },
        {} as Record<string, { grossRevenue: number; netRevenue: number }>
      );

      // Fill in the actual revenue data
      data?.forEach((row: any) => {
        const date = toZonedTime(new Date(row.month), TIMEZONE);
        date.setDate(date.getDate() + 1);
        const monthKey = formatTZ(date, "MMM yyyy", { timeZone: TIMEZONE });
        monthlyRevenue[monthKey] = {
          grossRevenue: Number(row.gross_revenue || 0),
          netRevenue: Number(row.net_revenue || 0),
        };
      });

      const formattedData = months.map((month) => ({
        month,
        grossRevenue: Number(monthlyRevenue[month].grossRevenue.toFixed(2)),
        netRevenue: Number(monthlyRevenue[month].netRevenue.toFixed(2)),
      }));

      return NextResponse.json(formattedData);
    } catch (dateError) {
      console.error("Date processing error:", dateError);
      throw dateError;
    }
  } catch (error) {
    console.error("API Error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      error,
    });
    return NextResponse.json(
      {
        error: "Failed to fetch future revenue data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
