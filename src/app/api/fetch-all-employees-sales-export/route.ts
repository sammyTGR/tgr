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
    const { dateRange, employeeLanids, descriptionSearch } = body;

    if (!dateRange) {
      return NextResponse.json(
        { error: "Missing date range" },
        { status: 400 }
      );
    }

    // First get active employees
    const { data: activeEmployees, error: employeesError } = await supabase
      .from("employees")
      .select("lanid, name, last_name")
      .eq("status", "active")
      .in("department", ["Sales", "Range", "Operations"]);

    if (employeesError) {
      throw employeesError;
    }

    // Create a map of lanid to employee name for easier lookup
    const employeeMap = new Map(
      activeEmployees?.map((emp) => [
        emp.lanid?.toLowerCase(),
        `${emp.name || ""} ${emp.last_name || ""}`.trim(),
      ]) || []
    );

    // Get total count first with the exact same conditions as the display query
    let query = supabase
      .from("sales_data")
      .select("*", { count: "exact", head: true })
      .gte("Date", dateRange.from)
      .lte("Date", dateRange.to)
      .not("Date", "is", null);

    // Apply employee filter only if specific employees are selected
    if (employeeLanids && !employeeLanids.includes("all")) {
      query = query.in("Lanid", employeeLanids);
    }

    // Add description search if provided - match the display query exactly
    if (descriptionSearch) {
      query = query.or(
        `Desc.ilike.${descriptionSearch}%,Desc.ilike.%${descriptionSearch}%,Sku.ilike.${descriptionSearch}%`
      );
    }

    const { count } = await query;
    // console.log("Initial count:", count);

    if (!count) {
      return NextResponse.json({ data: [] });
    }

    // Calculate number of pages needed
    const pages = Math.ceil(count / PAGE_SIZE);
    let allData: any[] = [];

    // Fetch data page by page with the exact same conditions
    for (let page = 0; page < pages; page++) {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let pageQuery = supabase
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
        .not("Date", "is", null)
        .order("Date", { ascending: true })
        .range(from, to);

      // Apply employee filter only if specific employees are selected
      if (employeeLanids && !employeeLanids.includes("all")) {
        pageQuery = pageQuery.in("Lanid", employeeLanids);
      }

      // Add description search if provided - match the display query exactly
      if (descriptionSearch) {
        pageQuery = pageQuery.or(
          `Desc.ilike.${descriptionSearch}%,Desc.ilike.%${descriptionSearch}%,Sku.ilike.${descriptionSearch}%`
        );
      }

      const { data: pageData, error: pageError } = await pageQuery;

      if (pageError) {
        console.error(`Error fetching page ${page}:`, pageError);
        throw pageError;
      }

      if (pageData) {
        allData = [...allData, ...pageData];
        // console.log(
        //   `Fetched page ${page + 1}/${pages}, rows: ${pageData.length}`
        // );
      }
    }

    // Transform the data without filtering out any rows
    const transformedData = allData
      .filter((sale) => sale.Date) // Only filter out null dates
      .map((sale) => ({
        ...sale,
        Date: formatInTimeZone(parseISO(sale.Date), TIMEZONE, "yyyy-MM-dd"),
        employee_name:
          employeeMap.get(sale.Lanid?.toLowerCase() || "") ||
          sale.LastName ||
          "Unknown",
      }));

    // console.log("Export Summary:", {
    //   initialCount: count,
    //   fetchedRows: allData.length,
    //   transformedRows: transformedData.length,
    //   totalGross: transformedData.reduce(
    //     (sum, row) => sum + (row.total_gross || 0),
    //     0
    //   ),
    //   totalNet: transformedData.reduce(
    //     (sum, row) => sum + (row.total_net || 0),
    //     0
    //   ),
    // });

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
