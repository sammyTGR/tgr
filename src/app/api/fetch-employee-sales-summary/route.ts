import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { Database } from "@/types_db";

interface RequestBody {
  dateRange: {
    from: string;
    to: string;
  };
  employeeLanids: string[] | null;
}

interface SalesAggregation {
  Lanid: string | null;
  total_gross: number;
  total_net: number;
}

// Add validation and debug logging for date ranges
const validateDateRange = (from: string, to: string) => {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const daysDifference = Math.ceil(
    (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // console.log("Date Range Validation:", {
  //   from,
  //   to,
  //   fromDate: fromDate.toISOString(),
  //   toDate: toDate.toISOString(),
  //   daysDifference,
  // });

  return {
    isValid: daysDifference >= 0,
    daysDifference,
  };
};

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const body: RequestBody = await req.json();

    // Validate date range
    const { isValid } = validateDateRange(
      body.dateRange.from,
      body.dateRange.to
    );

    if (!isValid) {
      console.error("Invalid date range:", body.dateRange);
      return NextResponse.json(
        { error: "Invalid date range" },
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
      console.error("Error fetching employees:", employeesError);
      throw employeesError;
    }

    // Create a map of lanid to employee name for easier lookup
    const employeeMap = new Map(
      activeEmployees?.map((emp) => [emp.lanid?.toLowerCase(), emp.name]) || []
    );

    // Get aggregated sales data
    const { data: salesData, error: salesError } = (await supabase.rpc(
      "get_employee_sales_summary",
      {
        start_date: body.dateRange.from,
        end_date: body.dateRange.to,
        employee_lanids:
          body.employeeLanids || activeEmployees?.map((e) => e.lanid) || [],
      }
    )) as { data: SalesAggregation[] | null; error: any };

    // Debug logging
    // console.log("Query Parameters:", {
    //   dateRange: body.dateRange,
    //   employeeLanids:
    //     body.employeeLanids || activeEmployees?.map((e) => e.lanid) || [],
    //   results: salesData,
    // });

    if (salesError) {
      console.error("Error fetching sales data:", salesError);
      throw salesError;
    }

    // Process the pre-aggregated data
    const processedData = (salesData || [])
      .map((row: SalesAggregation) => ({
        Lanid: row.Lanid || "",
        employee_name: employeeMap.get(row.Lanid?.toLowerCase() || "") || "",
        total_gross: Number(row.total_gross) || 0,
        total_net: Number(row.total_net) || 0,
      }))
      .filter((row) => row.employee_name); // Only include rows with matching employees

    return NextResponse.json(processedData);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch employee summary",
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
