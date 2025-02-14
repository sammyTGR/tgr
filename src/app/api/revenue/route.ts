// src/app/api/revenue/route.ts
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
    const startDateTemp = new Date("2024-01-01");
    startDateTemp.setHours(0, 0, 0, 0);
    const startDate = toZonedTime(startDateTemp, TIMEZONE);

    const now = new Date();
    now.setHours(23, 59, 59, 999);
    const endDate = toZonedTime(now, TIMEZONE);

    const { data, error } = await supabase.rpc("calculate_monthly_revenue", {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
    });

    if (error) {
      console.error("Supabase query error:", error);
      throw error;
    }

    // Initialize all months with 0
    const months = [
      "Jan 2024",
      "Feb 2024",
      "Mar 2024",
      "Apr 2024",
      "May 2024",
      "Jun 2024",
      "Jul 2024",
      "Aug 2024",
      "Sep 2024",
      "Oct 2024",
      "Nov 2024",
      "Dec 2024",
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
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch revenue data" },
      { status: 500 }
    );
  }
}
