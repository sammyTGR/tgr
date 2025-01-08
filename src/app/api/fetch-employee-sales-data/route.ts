import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { startOfDay, endOfDay, format } from "date-fns";
import { toZonedTime, formatInTimeZone } from "date-fns-tz";

const TIMEZONE = "America/Los_Angeles";

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // Validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error("Failed to parse request body:", error);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { employeeId, pageIndex, pageSize, filters, sorting, dateRange } =
      body;

    // Validate required parameters
    if (employeeId === undefined) {
      return NextResponse.json(
        { error: "employeeId is required" },
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

    // Get employee's lanid with error handling
    const { data: employeeData, error: employeeError } = await supabase
      .from("employees")
      .select("lanid")
      .eq("employee_id", employeeId)
      .single();

    if (employeeError || !employeeData?.lanid) {
      console.error("Employee lookup error:", employeeError);
      return NextResponse.json(
        { error: employeeError?.message || "Employee not found" },
        { status: employeeError ? 400 : 404 }
      );
    }

    // Build base query with explicit type casting
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
      `,
        { count: "exact" }
      )
      .eq("Lanid", employeeData.lanid)
      .not("Date", "is", null);

    // Apply date range filter with timezone handling
    if (dateRange?.from) {
      const fromDate = format(new Date(dateRange.from), "yyyy-MM-dd");
      query = query.gte("Date", fromDate);
    }

    if (dateRange?.to) {
      const toDate = format(new Date(dateRange.to), "yyyy-MM-dd");
      query = query.lte("Date", toDate);
    }

    // Apply filters
    if (filters?.length > 0) {
      filters.forEach((filter: any) => {
        if (filter.value) {
          query = query.ilike(filter.id, `%${filter.value}%`);
        }
      });
    }

    // Apply sorting
    if (sorting?.length > 0) {
      const { id, desc } = sorting[0];
      query = query.order(id, { ascending: !desc });
    } else {
      query = query.order("Date", { ascending: false });
    }

    // Get total count
    const { count } = await query;

    if (!count) {
      return NextResponse.json({
        data: [],
        count: 0,
      });
    }

    // Apply pagination
    const from = Math.max(0, pageIndex * pageSize);
    const to = Math.min(from + pageSize - 1, count - 1);

    // Execute final query
    const { data: salesData, error: salesError } = await query.range(from, to);

    if (salesError) {
      throw salesError;
    }

    // Transform dates
    const transformedData = salesData
      ?.filter((sale) => sale.Date)
      .map((sale: any) => ({
        ...sale,
        Date: toZonedTime(new Date(sale.Date), TIMEZONE).toISOString(),
        employeeName: sale.LastName || "Unknown",
      }));

    return NextResponse.json({
      data: transformedData || [],
      count: count || 0,
    });
  } catch (error) {
    console.error("Failed to fetch employee sales data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch employee sales data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    },
  });
}
