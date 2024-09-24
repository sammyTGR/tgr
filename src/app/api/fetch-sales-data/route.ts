import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";
import { format } from "date-fns";

export async function POST(request: Request) {
  try {
    const { startDate, endDate } = await request.json();

    if (!startDate || !endDate) {
      throw new Error("Start date or end date is missing");
    }

    // Convert to Date objects and adjust for UTC
    const utcStartDate = new Date(startDate);
    const utcEndDate = new Date(endDate);
    utcEndDate.setUTCHours(23, 59, 59, 999);

    const formattedStartDate = format(utcStartDate, "yyyy-MM-dd");
    const formattedEndDate = format(utcEndDate, "yyyy-MM-dd");

    const { data, error, count } = await supabase
      .from("sales_data")
      .select("*", { count: "exact" })
      .gte("Date", formattedStartDate)
      .lte("Date", formattedEndDate);

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
