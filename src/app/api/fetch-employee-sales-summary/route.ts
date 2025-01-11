import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

interface RequestBody {
  dateRange: {
    from: string;
    to: string;
  };
  employeeLanids: string[] | null;
}

interface SalesRow {
  Lanid: string | null;
  employee_name: string | null;
  total_gross: string | null;
  total_net: string | null;
}

interface ProcessedSalesRow {
  employee_name: string;
  total_gross: number;
  total_net: number;
}

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body: RequestBody = await req.json();

    if (!body?.dateRange?.from || !body?.dateRange?.to) {
      return NextResponse.json(
        { error: "Invalid date range" },
        { status: 400 }
      );
    }

    // First get active sales employees with their names
    const { data: activeEmployees } = await supabase
      .from("employees")
      .select("lanid, name")
      .eq("status", "active")
      .eq("department", "Sales");

    const activeLanids = activeEmployees?.map((emp) => emp.lanid) || [];

    // Create a map of lanid to employee name
    const employeeNameMap =
      activeEmployees?.reduce((acc: { [key: string]: string }, emp) => {
        if (emp.lanid && emp.name) {
          acc[emp.lanid] = emp.name;
        }
        return acc;
      }, {}) || {};

    // Build the main query
    let query = supabase
      .from("sales_data")
      .select(
        `
        Lanid,
        total_gross,
        total_net
      `
      )
      .gte("Date", body.dateRange.from)
      .lte("Date", body.dateRange.to);

    // Filter by active sales employees
    if (activeLanids.length > 0) {
      query = query.in("Lanid", activeLanids);
    }

    // Add employee filter if specific employees are selected
    if (body.employeeLanids && body.employeeLanids.length > 0) {
      query = query.in("Lanid", body.employeeLanids);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Group and sum the data in JavaScript
    const groupedData = data?.reduce(
      (acc: { [key: string]: ProcessedSalesRow }, row) => {
        const lanid = row.Lanid || "Unknown";
        const employeeName = employeeNameMap[lanid] || lanid;

        if (!acc[lanid]) {
          acc[lanid] = {
            employee_name: employeeName,
            total_gross: 0,
            total_net: 0,
          };
        }
        acc[lanid].total_gross += Number(row.total_gross || 0);
        acc[lanid].total_net += Number(row.total_net || 0);
        return acc;
      },
      {}
    );

    const processedData = Object.values(groupedData || {});
    const sortedData = processedData.sort(
      (a, b) => b.total_gross - a.total_gross
    );

    return NextResponse.json(sortedData);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch employee summary" },
      { status: 500 }
    );
  }
}
