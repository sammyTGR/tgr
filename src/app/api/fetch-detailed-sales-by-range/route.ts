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
          "Cat",
          "Sub",
          "CatDesc",
          "SubDesc",
          total_gross,
          total_net,
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

    // Process the data to group by lanid and category
    const processedData = data.reduce((acc: any, sale: any) => {
      const lanid = sale.Lanid || "Unknown";
      const category = sale.CatDesc || "Uncategorized";
      const grossValue = Number(sale.total_gross) || 0;
      const netValue = Number(sale.total_net) || 0;

      if (!acc[lanid]) {
        acc[lanid] = {
          Lanid: lanid,
          last_name: sale.Last || "Unknown",
          Total: 0,
          TotalMinusExclusions: 0,
        };
      }

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

    const result = Object.values(processedData);
    console.log("Processed data:", {
      employeeCount: result.length,
      sampleEmployee: result[0],
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
