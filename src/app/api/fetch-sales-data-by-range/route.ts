import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const TIMEZONE = "America/Los_Angeles";

interface SalesDataRow {
  Lanid: string | null;
  LastName: string | null;
  category_label: string | null;
  subcategory_label: string | null;
  total_gross: number;
  total_net: number;
}

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    if (!start || !end) {
      return NextResponse.json(
        { error: "Invalid date parameters" },
        { status: 400 }
      );
    }

    // Apply date range filter with timezone handling
    const fromDate = new Date(start);
    fromDate.setUTCHours(0, 0, 0, 0);
    const toDate = new Date(end);
    toDate.setUTCHours(23, 59, 59, 999);

    let query = supabase
      .from("detailed_sales_data")
      .select(
        `
        "Lanid",
        "CatDesc",
        "SubDesc",
        "Margin",
        total_gross
      `
      )
      .not("SoldDate", "is", null)
      .gte("SoldDate", fromDate.toISOString())
      .lte("SoldDate", toDate.toISOString())
      .not("CatDesc", "is", null);

    // Fetch employee data separately
    const { data: employees } = await supabase
      .from("employees")
      .select("lanid, last_name");

    // Create employee lookup map
    const employeeMap = new Map(
      employees?.map((emp) => [emp.lanid?.toLowerCase(), emp.last_name]) || []
    );

    // Fetch all records using pagination
    let page = 0;
    const pageSize = 1000;
    let allSalesData: any[] = [];

    while (true) {
      const {
        data: salesData,
        error: salesError,
        count,
      } = await query.range(page * pageSize, (page + 1) * pageSize - 1);

      if (salesError) {
        console.error("Sales Query Error:", salesError);
        throw salesError;
      }

      if (!salesData || salesData.length === 0) break;

      allSalesData = allSalesData.concat(salesData);

      if (salesData.length < pageSize) break;
      page++;
    }

    // Group and aggregate the data
    const groupedData = allSalesData.reduce((acc: any[], curr) => {
      const key = `${curr.Lanid}-${curr.CatDesc}-${curr.SubDesc}`;
      const existing = acc.find(
        (item) =>
          item.Lanid === curr.Lanid &&
          item.category_label === curr.CatDesc &&
          item.subcategory_label === curr.SubDesc
      );

      if (existing) {
        existing.total_gross += Number(curr.total_gross) || 0;
        existing.total_net += Number(curr.Margin) || 0;
      } else {
        acc.push({
          Lanid: curr.Lanid,
          LastName: employeeMap.get(curr.Lanid?.toLowerCase() || "") || null,
          category_label: curr.CatDesc,
          subcategory_label: curr.SubDesc,
          total_gross: Number(curr.total_gross) || 0,
          total_net: Number(curr.Margin) || 0,
        });
      }
      return acc;
    }, []);

    // Round numeric values for consistency
    const formattedData = groupedData.map((row) => ({
      ...row,
      total_gross: Math.round(row.total_gross * 100) / 100,
      total_net: Math.round(row.total_net * 100) / 100,
    }));

    // console.log("Query successful, returned rows:", formattedData.length);
    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("Detailed error in fetchSalesDataByRange API:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch sales data by date range",
        details: error instanceof Error ? error.message : String(error),
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
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    },
  });
}
