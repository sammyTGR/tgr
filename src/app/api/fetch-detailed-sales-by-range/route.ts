import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    console.log("Date range:", { start, end });

    if (!start || !end) {
      return NextResponse.json(
        { error: "Start and end dates are required" },
        { status: 400 }
      );
    }

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
      .gte("SoldDate", start)
      .lte("SoldDate", end)
      .order("SoldDate", { ascending: true });

    console.log("Query result:", { data: data?.length, error });

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
      const category = sale.CatDesc || "Uncategorized"; // Using CatDesc instead of category_label
      const grossValue = sale.total_gross || 0;
      const netValue = sale.total_net || 0;

      if (!acc[lanid]) {
        acc[lanid] = {
          Lanid: lanid, // Keep uppercase for consistency
          last_name: sale.Last || "Unknown", // Using Last instead of last_name
          Total: 0,
          TotalMinusExclusions: 0,
        };
      }

      if (!acc[lanid][category]) {
        acc[lanid][category] = 0;
      }

      acc[lanid][category] += netValue;
      acc[lanid].Total += netValue;

      // Define categories to exclude based on Cat and Sub values
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

    return NextResponse.json(Object.values(processedData));
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
