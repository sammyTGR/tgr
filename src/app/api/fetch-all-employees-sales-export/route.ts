import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { formatInTimeZone } from "date-fns-tz";
import { parseISO } from "date-fns";
import { Database } from "@/types_db";
import { toZonedTime } from "date-fns-tz";

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

    // Convert dates to UTC with timezone consideration
    const fromDateTemp = new Date(dateRange.from);
    fromDateTemp.setHours(0, 0, 0, 0);
    const fromDate = toZonedTime(fromDateTemp, TIMEZONE);

    const toDateTemp = new Date(dateRange.to);
    toDateTemp.setHours(23, 59, 59, 999);
    const toDate = toZonedTime(toDateTemp, TIMEZONE);

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

    // Get total count first
    let query = supabase
      .from("detailed_sales_data")
      .select("*", { count: "exact", head: true })
      .gte("SoldDate", fromDate.toISOString())
      .lte("SoldDate", toDate.toISOString())
      .not("SoldDate", "is", null);

    // Apply employee filter
    if (employeeLanids && !employeeLanids.includes("all")) {
      query = query.in("Lanid", employeeLanids);
    }

    // Add description search
    if (descriptionSearch) {
      query = query.or(
        `Desc.ilike.${descriptionSearch}%,Desc.ilike.%${descriptionSearch}%,Sku.ilike.${descriptionSearch}%`
      );
    }

    const { count } = await query;

    if (!count) {
      return NextResponse.json({ data: [] });
    }

    // Calculate number of pages needed
    const pages = Math.ceil(count / PAGE_SIZE);
    let allData: any[] = [];

    // Fetch data page by page
    for (let page = 0; page < pages; page++) {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let pageQuery = supabase
        .from("detailed_sales_data")
        .select(
          `
          "SoldDate",
          "Lanid",
          "SoldRef",
          "Sku",
          "Desc",
          "SoldPrice",
          "Qty",
          "Cost",
          "Type",
          "CatDesc",
          "SubDesc",
          total_gross,
          "Margin",
          "Full_Name"
        `
        )
        .gte("SoldDate", fromDate.toISOString())
        .lte("SoldDate", toDate.toISOString())
        .not("SoldDate", "is", null)
        .order("SoldDate", { ascending: true })
        .range(from, to);

      if (employeeLanids && !employeeLanids.includes("all")) {
        pageQuery = pageQuery.in("Lanid", employeeLanids);
      }

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
      }
    }

    // Transform the data with proper timezone handling
    const transformedData = allData
      .filter((sale) => sale.SoldDate)
      .map((sale) => {
        const saleDate = toZonedTime(new Date(sale.SoldDate), TIMEZONE);
        return {
          ...sale,
          Date: formatInTimeZone(saleDate, TIMEZONE, "yyyy-MM-dd"),
          Invoice: sale.SoldRef,
          employee_name:
            employeeMap.get(sale.Lanid?.toLowerCase() || "") ||
            sale.Full_Name ||
            "Unknown",
          Category: sale.CatDesc,
          Subcategory: sale.SubDesc,
          "Sold Quantity": sale.Qty,
          total_net: sale.Margin,
        };
      });

    // Add debug logging
    // console.log("Export Query Parameters:", {
    //   dateRange: {
    //     from: fromDate.toISOString(),
    //     to: toDate.toISOString(),
    //   },
    //   resultCount: transformedData.length,
    //   sampleDates: transformedData.slice(0, 3).map((d) => d.Date),
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
