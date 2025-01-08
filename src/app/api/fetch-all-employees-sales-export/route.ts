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

    // Use the exact dates provided from the client
    const fromDate = dateRange.from;
    const toDate = dateRange.to;

    let countQuery = supabase
      .from("sales_data")
      .select("*", { count: "exact", head: true })
      .not("Date", "is", null);

    if (employeeLanid && employeeLanid !== "all") {
      countQuery = countQuery.eq("Lanid", employeeLanid);
    }

    if (fromDate) {
      countQuery = countQuery.gte("Date", fromDate);
    }

    if (toDate) {
      countQuery = countQuery.lte("Date", toDate);
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

      if (employeeLanid && employeeLanid !== "all") {
        query = query.eq("Lanid", employeeLanid);
      }

      if (fromDate) {
        query = query.gte("Date", fromDate);
      }

      if (toDate) {
        query = query.lte("Date", toDate);
      }

      const { data: pageData, error: pageError } = await query;

      if (pageError) {
        throw pageError;
      }

      if (pageData) {
        allData = [...allData, ...pageData];
      }
    }

    // Transform dates in the response
    const transformedData = allData
      .filter((sale) => sale.Date)
      .map((sale) => ({
        ...sale,
        Date: formatInTimeZone(parseISO(sale.Date), TIMEZONE, "yyyy-MM-dd"),
        employeeName: sale.LastName || "Unknown",
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
