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
    const startDateTemp = new Date("2023-01-01");
    startDateTemp.setHours(0, 0, 0, 0);
    const startDate = toZonedTime(startDateTemp, TIMEZONE);

    const endDateTemp = new Date("2023-12-31");
    endDateTemp.setHours(23, 59, 59, 999);
    const endDate = toZonedTime(endDateTemp, TIMEZONE);

    const { data, error } = await supabase.rpc("calculate_historical_revenue", {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
    });

    if (error) {
      console.error("Supabase query error:", error);
      throw error;
    }

    const months = [
      "Jan 2023",
      "Feb 2023",
      "Mar 2023",
      "Apr 2023",
      "May 2023",
      "Jun 2023",
      "Jul 2023",
      "Aug 2023",
      "Sep 2023",
      "Oct 2023",
      "Nov 2023",
      "Dec 2023",
    ];

    const monthlyRevenue = months.reduce(
      (acc, month) => {
        acc[month] = { grossRevenue: 0, netRevenue: 0 };
        return acc;
      },
      {} as Record<string, { grossRevenue: number; netRevenue: number }>
    );

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
      month: month.split(" ")[0], // Only keep month name for comparison
      grossRevenue: Number(monthlyRevenue[month].grossRevenue.toFixed(2)),
      netRevenue: Number(monthlyRevenue[month].netRevenue.toFixed(2)),
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch historical revenue data" },
      { status: 500 }
    );
  }
}
