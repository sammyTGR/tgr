import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { toZonedTime, format as formatTZ } from "date-fns-tz";

const timeZone = "America/Los_Angeles";

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const startDate = "2025-01-01";
    const endDate = "2025-12-31";

    const { data, error } = await supabase.rpc("calculate_monthly_revenue", {
      start_date: startDate,
      end_date: endDate,
    });

    if (error) {
      console.error("Supabase query error:", error);
      throw error;
    }

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

    const monthlyRevenue = months.reduce((acc, month) => {
      acc[month] = { grossRevenue: 0, netRevenue: 0 };
      return acc;
    }, {} as Record<string, { grossRevenue: number; netRevenue: number }>);

    // Fill in the actual revenue data
    data?.forEach((row: any) => {
      const date = toZonedTime(new Date(row.month), timeZone);
      date.setDate(date.getDate() + 1);
      const monthKey = formatTZ(date, "MMM yyyy", { timeZone });
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
      { error: "Failed to fetch future revenue data" },
      { status: 500 }
    );
  }
}
