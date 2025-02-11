import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { dateRange, employeeLanids } = await request.json();

    // Debug log the incoming date range
    // console.log("Incoming date range:", dateRange);

    // Build the base query for detailed_sales_data
    let query = supabase
      .from("detailed_sales_data")
      .select(
        `
        id,
        "Lanid",
        "SoldPrice",
        "Margin",
        total_gross,
        "SoldDate"
      `,
        { count: "exact" } // Add exact count
      )
      .not("SoldDate", "is", null);

    // Apply date range filter with UTC handling
    if (dateRange?.from) {
      const fromDate = new Date(dateRange.from);
      fromDate.setUTCHours(0, 0, 0, 0);
      query = query.gte("SoldDate", fromDate.toISOString());
      // console.log("From date:", fromDate.toISOString());
    }

    if (dateRange?.to) {
      const toDate = new Date(dateRange.to);
      toDate.setUTCHours(23, 59, 59, 999);
      query = query.lte("SoldDate", toDate.toISOString());
      // console.log("To date:", toDate.toISOString());
    }

    // Apply employee filter
    if (employeeLanids && !employeeLanids.includes("all")) {
      query = query.in("Lanid", employeeLanids);
    }

    // Initialize totals
    let totalNet = 0;
    let totalGross = 0;
    let totalRecords = 0;

    // Fetch all records using pagination
    let page = 0;
    const pageSize = 1000;

    while (true) {
      const {
        data: salesData,
        error: salesError,
        count,
      } = await query.range(page * pageSize, (page + 1) * pageSize - 1);

      if (salesError) {
        console.error("Sales Query Error:", salesError);
        throw salesError;
      }

      if (!salesData || salesData.length === 0) break;

      // Calculate totals for this page
      const pageTotals = salesData.reduce(
        (acc, curr) => ({
          totalNet: acc.totalNet + (Number(curr.Margin) || 0),
          totalGross: acc.totalGross + (Number(curr.total_gross) || 0),
        }),
        { totalNet: 0, totalGross: 0 }
      );

      totalNet += pageTotals.totalNet;
      totalGross += pageTotals.totalGross;
      totalRecords += salesData.length;

      // Break if we've fetched all records
      if (salesData.length < pageSize || (count && totalRecords >= count))
        break;

      page++;
    }

    // Round to 2 decimal places for consistency
    const response = {
      totalNet: Math.round(totalNet * 100) / 100,
      totalGross: Math.round(totalGross * 100) / 100,
      recordCount: totalRecords,
      dateRange: { from: dateRange.from, to: dateRange.to },
    };

    // Log final response
    // console.log("Final response:", response);

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
