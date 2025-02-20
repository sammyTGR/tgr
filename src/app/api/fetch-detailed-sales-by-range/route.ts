import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { toZonedTime, formatInTimeZone } from "date-fns-tz";

const TIMEZONE = "America/Los_Angeles";

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    if (!start || !end) {
      return NextResponse.json(
        { error: "Date range is required" },
        { status: 400 }
      );
    }

    // Convert the input dates to Pacific time
    const startDatePacific = toZonedTime(new Date(start), TIMEZONE);
    const endDatePacific = toZonedTime(new Date(end), TIMEZONE);

    // Set the time components
    startDatePacific.setHours(0, 0, 0, 0);
    endDatePacific.setHours(23, 59, 59, 999);

    // Format the dates in Pacific time for the database query
    const startDate = formatInTimeZone(
      startDatePacific,
      TIMEZONE,
      "yyyy-MM-dd'T'HH:mm:ss.SSSXXX"
    );
    const endDate = formatInTimeZone(
      endDatePacific,
      TIMEZONE,
      "yyyy-MM-dd'T'HH:mm:ss.SSSXXX"
    );

    // console.log("Date processing:", {
    //   rawStart: start,
    //   rawEnd: end,
    //   startDatePacific: formatInTimeZone(
    //     startDatePacific,
    //     TIMEZONE,
    //     "yyyy-MM-dd HH:mm:ssXXX"
    //   ),
    //   endDatePacific: formatInTimeZone(
    //     endDatePacific,
    //     TIMEZONE,
    //     "yyyy-MM-dd HH:mm:ssXXX"
    //   ),
    //   startDate,
    //   endDate,
    // });

    // Set timezone for the database session
    await supabase.rpc("set_timezone", { timezone: TIMEZONE });

    const { data, error } = await supabase
      .from("detailed_sales_data")
      .select(
        `
        "Lanid",
        "Last",
        "SoldPrice",
        "Margin",
        "CatDesc",
        total_gross,
        "SoldDate"
      `
      )
      .gte("SoldDate", startDate)
      .lte("SoldDate", endDate)
      .order("SoldDate", { ascending: true });

    // console.log("Query result:", {
    //   recordCount: data?.length,
    //   error,
    //   dateRange: {
    //     start: startDate,
    //     end: endDate,
    //   },
    //   sampleDates: data?.slice(0, 3).map((d) => ({
    //     soldDate: d.SoldDate,
    //     lanid: d.Lanid,
    //     margin: d.Margin,
    //   })),
    // });

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
      const transactionKey = `${sale.Lanid}-${sale.SoldDate}-${sale.CatDesc}-${sale.SoldPrice}-${sale.Margin}`;
      if (uniqueTransactions.has(transactionKey)) {
        // console.log("Duplicate found:", {
        //   key: transactionKey,
        //   date: sale.SoldDate,
        //   margin: sale.Margin,
        // });
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

    // Add detailed debug logging
    // console.log("Data processing summary:", {
    //   originalCount: data.length,
    //   uniqueCount: uniqueData.length,
    //   processedCount: Object.keys(processedData).length,
    //   dateRange: {
    //     start: startDate,
    //     end: endDate,
    //   },
    //   totalMargin: uniqueData.reduce(
    //     (sum, sale) => sum + (Number(sale.Margin) || 0),
    //     0
    //   ),
    //   sampleTransactions: uniqueData.slice(0, 3).map((sale) => ({
    //     date: sale.SoldDate,
    //     lanid: sale.Lanid,
    //     category: sale.CatDesc,
    //     margin: sale.Margin,
    //     key: `${sale.Lanid}-${sale.SoldDate}-${sale.CatDesc}-${sale.SoldPrice}-${sale.Margin}`,
    //   })),
    // });

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
