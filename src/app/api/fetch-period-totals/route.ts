import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { dateRange, employeeLanids } = await request.json();

    // Build the base query exactly like the sales API
    let query = supabase
      .from("sales_data")
      .select(
        `
        id,
        "Lanid",
        total_gross,
        total_net
      `
      )
      .not("Date", "is", null);

    // Apply date range filter with proper indexing
    if (dateRange?.from) {
      const fromDate = new Date(dateRange.from);
      fromDate.setUTCHours(0, 0, 0, 0);
      query = query.gte("Date", fromDate.toISOString());
    }

    if (dateRange?.to) {
      const toDate = new Date(dateRange.to);
      toDate.setUTCHours(23, 59, 59, 999);
      query = query.lte("Date", toDate.toISOString());
    }

    // Apply employee filter
    if (employeeLanids && !employeeLanids.includes("all")) {
      query = query.in("Lanid", employeeLanids);
    }

    // Execute the query without pagination
    const { data: salesData, error: salesError } = await query;

    if (salesError) {
      console.error("Sales Query Error:", salesError);
      throw salesError;
    }

    // Log data for debugging
    console.log("Total records:", salesData?.length);
    console.log(
      "Unique Lanids:",
      new Set(salesData?.map((sale) => sale.Lanid))
    );

    // Calculate totals from the retrieved data
    const totals = salesData?.reduce(
      (acc, curr) => ({
        totalNet: acc.totalNet + Number(curr.total_net || 0),
        totalGross: acc.totalGross + Number(curr.total_gross || 0),
      }),
      { totalNet: 0, totalGross: 0 }
    ) || { totalNet: 0, totalGross: 0 };

    // Round to 2 decimal places for consistency
    const response = {
      totalNet: Math.round(totals.totalNet * 100) / 100,
      totalGross: Math.round(totals.totalGross * 100) / 100,
    };

    // Log final totals
    console.log("Final totals:", response);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch period totals:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch period totals",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
