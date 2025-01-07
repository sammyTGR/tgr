import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { formatInTimeZone } from "date-fns-tz";

const TIMEZONE = "America/Los_Angeles";

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // Ensure request body is properly parsed
    const body = await request.json().catch(() => ({}));
    const { dateRange, employeeLanid } = body;

    if (!dateRange) {
      return NextResponse.json(
        { error: "Missing date range" },
        { status: 400 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let query = supabase
      .from("sales_data")
      .select(
        `
        id,
        "Lanid",
        "Invoice",
        "Sku",
        "Desc",
        "SoldPrice",
        "SoldQty",
        "Cost",
        "Date",
        "Type",
        category_label,
        subcategory_label,
        total_gross,
        total_net,
        "LastName"
      `
      )
      .not("Date", "is", null);

    // Apply employee filter
    if (employeeLanid && employeeLanid !== "all") {
      query = query.eq("Lanid", employeeLanid);
    }

    // Apply date range filters with timezone handling
    if (dateRange?.from) {
      query = query.gte("Date", dateRange.from);
    }

    if (dateRange?.to) {
      query = query.lte("Date", dateRange.to);
    }

    // Order by date ascending for exports
    query = query.order("Date", { ascending: true });

    // Execute query
    const { data: salesData, error: salesError } = await query;

    if (salesError) {
      throw salesError;
    }

    // Transform dates in the response
    const transformedData = salesData
      ?.filter((sale) => sale.Date)
      .map((sale: any) => ({
        ...sale,
        Date: formatInTimeZone(new Date(sale.Date), TIMEZONE, "yyyy-MM-dd"),
        employeeName: sale.LastName || "Unknown",
      }));

    return NextResponse.json({
      data: transformedData || [],
    });
  } catch (error) {
    console.error("Failed to fetch export data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch export data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
