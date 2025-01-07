import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { startOfDay, endOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export async function POST(request: Request) {
  const { employeeId, pageIndex, pageSize, filters, sorting, dateRange } =
    await request.json();
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First get the employee's lanid
    const { data: employeeData, error: employeeError } = await supabase
      .from("employees")
      .select("lanid")
      .eq("employee_id", employeeId)
      .single();

    if (employeeError || !employeeData) {
      console.error("Employee lookup error:", employeeError);
      return NextResponse.json(
        { error: employeeError?.message || "Employee not found" },
        { status: employeeError ? 400 : 404 }
      );
    }

    const lanid = employeeData.lanid;

    // Build the base query
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
        total_net
      `,
        { count: "exact" }
      )
      .eq("Lanid", lanid);

    // Apply date range filter if provided
    if (dateRange?.from) {
      // Convert to start of day in Pacific time
      const fromDate = toZonedTime(
        startOfDay(new Date(dateRange.from)),
        "America/Los_Angeles"
      );
      query = query.gte("Date", fromDate.toISOString());
    }

    if (dateRange?.to) {
      // Convert to end of day in Pacific time
      const toDate = toZonedTime(
        endOfDay(new Date(dateRange.to)),
        "America/Los_Angeles"
      );
      query = query.lte("Date", toDate.toISOString());
    }

    // Apply filters if any
    if (filters && filters.length > 0) {
      filters.forEach((filter: any) => {
        if (filter.value) {
          query = query.ilike(filter.id, `%${filter.value}%`);
        }
      });
    }

    // Apply sorting
    if (sorting && sorting.length > 0) {
      const { id, desc } = sorting[0];
      query = query.order(id, { ascending: !desc });
    } else {
      query = query.order("Date", { ascending: false });
    }

    // Get total count first
    const { count: totalCount } = await query;

    // Calculate pagination range
    const from = Math.min(pageIndex * pageSize, totalCount || 0);
    const to = Math.min(from + pageSize - 1, totalCount || 0);

    // Apply pagination
    query = query.range(from, to);

    // Execute the final query
    const { data: salesData, error: salesError } = await query;

    if (salesError) {
      console.error("Sales data lookup error:", salesError);
      throw salesError;
    }

    return NextResponse.json({
      data: salesData,
      count: totalCount,
      debug: {
        employeeId,
        lanid,
        pageIndex,
        pageSize,
        from,
        to,
        dateRange,
        totalRecords: totalCount,
      },
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
