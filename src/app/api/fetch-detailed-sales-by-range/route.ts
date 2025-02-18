import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { toZonedTime } from "date-fns-tz";

const TIMEZONE = "America/Los_Angeles";

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    console.log("Raw date range:", { start, end });

    if (!start || !end) {
      return NextResponse.json(
        { error: "Start and end dates are required" },
        { status: 400 }
      );
    }

    // Convert dates to UTC with timezone consideration
    const startDateTemp = new Date(start);
    startDateTemp.setHours(0, 0, 0, 0);
    const startDate = toZonedTime(startDateTemp, TIMEZONE);

    const endDateTemp = new Date(end);
    endDateTemp.setHours(23, 59, 59, 999);
    const endDate = toZonedTime(endDateTemp, TIMEZONE);

    console.log("Converted date range:", {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    // Fetch detailed sales data with the correct column names
    const { data, error } = await supabase
      .from("detailed_sales_data")
      .select(
        `
          "Lanid",
          "Last",
          "SoldPrice",
          "Cost",
          "Margin",
          "Cat",
          "Sub",
          "CatDesc",
          "SubDesc",
          total_gross,
          "SoldDate"
        `
      )
      .gte("SoldDate", startDate.toISOString())
      .lte("SoldDate", endDate.toISOString())
      .order("SoldDate", { ascending: true });

    console.log("Query result:", {
      recordCount: data?.length,
      error,
      sampleDates: data?.slice(0, 3).map((d) => d.SoldDate),
    });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Error fetching sales data" },
        { status: 500 }
      );
    }

    // Create a map to track unique transactions
    const uniqueTransactions = new Map();

    // Filter out duplicate entries based on a unique identifier
    const uniqueData = data.filter((sale) => {
      const transactionKey = `${sale.Lanid}-${sale.SoldDate}-${sale.CatDesc}-${sale.SoldPrice}`;
      if (uniqueTransactions.has(transactionKey)) {
        return false;
      }
      uniqueTransactions.set(transactionKey, true);
      return true;
    });

    // Process the filtered data
    const processedData = uniqueData.reduce((acc: any, sale: any) => {
      const lanid = sale.Lanid || "Unknown";
      const category = sale.CatDesc || "Uncategorized";
      const grossValue = Number(sale.total_gross) || 0;
      const netValue = Number(sale.Margin) || 0;

      if (!acc[lanid]) {
        acc[lanid] = {
          Lanid: lanid,
          last_name: sale.Last || "Unknown",
          Total: 0,
          TotalMinusExclusions: 0,
        };
      }

      // Ensure we're not adding duplicate categories
      if (!acc[lanid][category]) {
        acc[lanid][category] = 0;
      }

      acc[lanid][category] += netValue;
      acc[lanid].Total += netValue;

      const excludeFromTotal = [
        "CA Tax Gun Transfer",
        "CA Tax Adjust",
        "CA Excise Tax",
        "CA Excise Tax Adjustment",
      ];

      if (!excludeFromTotal.includes(category)) {
        acc[lanid].TotalMinusExclusions += netValue;
      }

      return acc;
    }, {});

    // Add debug logging
    console.log("Data processing stats:", {
      originalCount: data.length,
      uniqueCount: uniqueData.length,
      processedCount: Object.keys(processedData).length,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    });

    const result = Object.values(processedData);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
