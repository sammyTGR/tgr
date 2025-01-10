import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { startOfDay, endOfDay } from "date-fns";
import { toZonedTime, formatInTimeZone } from "date-fns-tz";

const TIMEZONE = "America/Los_Angeles";

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { pageIndex, pageSize, filters, sorting, dateRange, employeeLanids } =
      await request.json();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
        total_net,
        "LastName"
      `,
        { count: "exact" }
      )
      .not("Date", "is", null);

    // Apply employee filter for multiple employees
    if (employeeLanids && !employeeLanids.includes("all")) {
      query = query.in("Lanid", employeeLanids);
    }

    // Apply date range filter with precise timezone handling
    if (dateRange?.from) {
      query = query.gte("Date", dateRange.from);
    }

    if (dateRange?.to) {
      query = query.lte("Date", dateRange.to);
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

    if (!totalCount) {
      return NextResponse.json({
        data: [],
        count: 0,
      });
    }

    // Calculate pagination range
    const from = Math.min(pageIndex * pageSize, totalCount);
    const to = Math.min(from + pageSize - 1, totalCount);

    // Apply pagination
    query = query.range(from, to);

    // Execute the final query
    const { data: salesData, error: salesError } = await query;

    if (salesError) {
      throw salesError;
    }

    // Fetch employee names for the sales data
    const lanids = salesData?.map((sale) => sale.Lanid).filter(Boolean) || [];
    const { data: employeeData } = await supabase
      .from("employees")
      .select("lanid, name, last_name")
      .in("lanid", lanids);

    // Create a map of lanid to employee names
    const employeeMap = new Map(
      employeeData?.map((emp) => [
        emp.lanid,
        `${emp.name || ""} ${emp.last_name || ""}`.trim(),
      ]) || []
    );

    // Transform dates in the response and add employee names
    const transformedData = salesData
      ?.filter((sale) => sale.Date)
      .map((sale: any) => ({
        ...sale,
        Date: toZonedTime(new Date(sale.Date), TIMEZONE).toISOString(),
        employee_name:
          employeeMap.get(sale.Lanid) || sale.LastName || "Unknown",
      }));

    return NextResponse.json({
      data: transformedData || [],
      count: totalCount,
    });
  } catch (error) {
    console.error("Failed to fetch sales data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch sales data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
