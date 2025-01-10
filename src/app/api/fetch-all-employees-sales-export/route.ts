import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { formatInTimeZone } from "date-fns-tz";
import { parseISO } from "date-fns";

const TIMEZONE = "America/Los_Angeles";
const PAGE_SIZE = 1000;

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const body = await request.json().catch(() => ({}));
    const { dateRange, employeeLanids } = body;

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

    // First, get total count
    let countQuery = supabase
      .from("sales_data")
      .select("*", { count: "exact", head: true })
      .not("Date", "is", null);

    // Apply employee filter for multiple employees
    if (employeeLanids && !employeeLanids.includes("all")) {
      countQuery = countQuery.in("Lanid", employeeLanids);
    }

    if (dateRange?.from) {
      countQuery = countQuery.gte("Date", dateRange.from);
    }

    if (dateRange?.to) {
      countQuery = countQuery.lte("Date", dateRange.to);
    }

    const { count } = await countQuery;

    if (!count) {
      return NextResponse.json({ data: [] });
    }

    // Calculate number of pages needed
    const pages = Math.ceil(count / PAGE_SIZE);
    let allData: any[] = [];

    // Fetch data page by page
    for (let page = 0; page < pages; page++) {
      const from = page * PAGE_SIZE;
      const to = Math.min((page + 1) * PAGE_SIZE - 1, count - 1);

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
        .not("Date", "is", null)
        .order("Date", { ascending: true })
        .range(from, to);

      // Apply employee filter for multiple employees
      if (employeeLanids && !employeeLanids.includes("all")) {
        query = query.in("Lanid", employeeLanids);
      }

      if (dateRange?.from) {
        query = query.gte("Date", dateRange.from);
      }

      if (dateRange?.to) {
        query = query.lte("Date", dateRange.to);
      }

      const { data: pageData, error: pageError } = await query;

      if (pageError) {
        throw pageError;
      }

      if (pageData) {
        allData = [...allData, ...pageData];
      }
    }

    // Fetch employee names for all the sales data
    const lanids = allData.map((sale) => sale.Lanid).filter(Boolean);
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
    const transformedData = allData
      .filter((sale) => sale.Date)
      .map((sale) => ({
        ...sale,
        Date: formatInTimeZone(parseISO(sale.Date), TIMEZONE, "yyyy-MM-dd"),
        employee_name:
          employeeMap.get(sale.Lanid) || sale.LastName || "Unknown",
      }));

    return NextResponse.json({
      data: transformedData,
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
