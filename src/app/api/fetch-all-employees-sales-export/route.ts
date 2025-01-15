import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { formatInTimeZone } from "date-fns-tz";
import { parseISO } from "date-fns";
import { Database } from "@/types_db";

const TIMEZONE = "America/Los_Angeles";
const PAGE_SIZE = 1000;

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies });

  try {
    const body = await request.json().catch(() => ({}));
    const { dateRange, employeeLanids } = body;

    if (!dateRange) {
      return NextResponse.json(
        { error: "Missing date range" },
        { status: 400 }
      );
    }

    // First get active employees
    const { data: activeEmployees, error: employeesError } = await supabase
      .from("employees")
      .select("lanid, name")
      .eq("status", "active")
      .in("department", ["Sales", "Range", "Operations"]);

    if (employeesError) {
      throw employeesError;
    }

    // Create a map of lanid to employee name for easier lookup
    const employeeMap = new Map(
      activeEmployees?.map((emp) => [emp.lanid?.toLowerCase(), emp.name]) || []
    );

    // Get total count first using the same conditions as the RPC
    const { count } = await supabase
      .from("sales_data")
      .select("*", { count: "exact", head: true })
      .gte("Date", dateRange.from)
      .lte("Date", dateRange.to)
      .in("Lanid", employeeLanids || activeEmployees?.map((e) => e.lanid) || [])
      .not("total_net", "is", null) // Match RPC conditions
      .not("total_gross", "is", null); // Match RPC conditions

    if (!count) {
      return NextResponse.json({ data: [] });
    }

    // Calculate number of pages needed
    const pages = Math.ceil(count / PAGE_SIZE);
    let allData: any[] = [];

    // Fetch data page by page with the same conditions as the RPC
    for (let page = 0; page < pages; page++) {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data: pageData, error: pageError } = await supabase
        .from("sales_data")
        .select(
          `
          "Date",
          "Lanid",
          "Invoice",
          "Sku",
          "Desc",
          "SoldPrice",
          "SoldQty",
          "Cost",
          "Type",
          category_label,
          subcategory_label,
          total_gross,
          total_net
        `
        )
        .gte("Date", dateRange.from)
        .lte("Date", dateRange.to)
        .in(
          "Lanid",
          employeeLanids || activeEmployees?.map((e) => e.lanid) || []
        )
        .not("total_net", "is", null) // Match RPC conditions
        .not("total_gross", "is", null) // Match RPC conditions
        .order("Date", { ascending: true })
        .range(from, to);

      if (pageError) {
        throw pageError;
      }

      if (pageData) {
        allData = [...allData, ...pageData];
      }
    }

    // Transform all the collected data
    const transformedData = allData
      .filter((sale) => sale.Date && sale.Lanid)
      .map((sale) => ({
        ...sale,
        Date: formatInTimeZone(parseISO(sale.Date), TIMEZONE, "yyyy-MM-dd"),
        employee_name:
          employeeMap.get(sale.Lanid?.toLowerCase() || "") || "Unknown",
      }))
      .filter((row) => row.employee_name !== "Unknown");

    // Add debug information
    console.log("Export Summary:", {
      totalRecords: transformedData.length,
      totalGross: transformedData.reduce(
        (sum, row) => sum + (row.total_gross || 0),
        0
      ),
      totalNet: transformedData.reduce(
        (sum, row) => sum + (row.total_net || 0),
        0
      ),
    });

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
