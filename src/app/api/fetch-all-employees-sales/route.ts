import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { startOfDay, endOfDay } from "date-fns";
import { toZonedTime, formatInTimeZone } from "date-fns-tz";

const TIMEZONE = "America/Los_Angeles";

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const {
      pageIndex,
      pageSize,
      filters,
      sorting,
      dateRange,
      employeeLanids,
      descriptionSearch,
    } = await request.json();

    // Build the base query with an optimized approach
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

    // Apply description search if provided - optimize the search
    if (descriptionSearch) {
      // Create an index on the Desc column if you haven't already
      // Add textSearch function for better performance
      query = query.or(
        `Desc.ilike.${descriptionSearch}%,Desc.ilike.%${descriptionSearch}%,Sku.ilike.${descriptionSearch}%`
      );
    }

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

    // Split the count query and the data query for better performance
    const countQuery = query;
    const { count } = await countQuery;

    if (!count) {
      return NextResponse.json({
        data: [],
        count: 0,
      });
    }

    // Calculate pagination
    const from = pageIndex * pageSize;
    const to = from + pageSize - 1;

    // Apply sorting and pagination to the data query
    if (sorting && sorting.length > 0) {
      const { id, desc } = sorting[0];
      query = query.order(id, { ascending: !desc });
    } else {
      query = query.order("Date", { ascending: false });
    }

    // Add pagination
    query = query.range(from, to);

    // Execute the data query
    const { data: salesData, error: salesError } = await query;

    if (salesError) {
      console.error("Sales Query Error:", salesError);
      throw salesError;
    }

    // Optimize employee data fetch by using a Set for unique lanids
    const uniqueLanids = new Set(
      salesData?.map((sale) => sale.Lanid).filter(Boolean)
    );

    const { data: employeeData } = await supabase
      .from("employees")
      .select("lanid, name, last_name")
      .in("lanid", Array.from(uniqueLanids));

    // Use Map for O(1) lookup
    const employeeMap = new Map(
      employeeData?.map((emp) => [
        emp.lanid,
        `${emp.name || ""} ${emp.last_name || ""}`.trim(),
      ]) || []
    );

    const transformedData = salesData?.map((sale: any) => ({
      ...sale,
      Date: sale.Date
        ? toZonedTime(new Date(sale.Date), TIMEZONE).toISOString()
        : null,
      employee_name: employeeMap.get(sale.Lanid) || sale.LastName || "Unknown",
    }));

    return NextResponse.json({
      data: transformedData || [],
      count,
      debug: {
        pageInfo: { from, to, pageIndex, pageSize },
        totalCount: count,
        returnedRows: salesData?.length || 0,
      },
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
