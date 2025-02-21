import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { startDate, endDate } = await request.json();

    if (!startDate || !endDate) {
      throw new Error("Start date or end date is missing");
    }

    // Set precise UTC time boundaries
    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);
    const formattedStartDate = start.toISOString();

    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);
    const formattedEndDate = end.toISOString();

    // Add debug logging
    // console.log("API Date Range:", {
    //   start: formattedStartDate,
    //   end: formattedEndDate,
    // });

    const { data, error, count } = await supabase
      .from("detailed_sales_data")
      .select("*", { count: "exact" })
      .gte("SoldDate", formattedStartDate)
      .lt("SoldDate", formattedEndDate);

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    return NextResponse.json({ data, count });
  } catch (error: any) {
    console.error("Failed to fetch sales data:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales data", details: error.message },
      { status: 500 }
    );
  }
}
