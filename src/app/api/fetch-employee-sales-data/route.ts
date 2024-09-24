import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";

export async function POST(request: Request) {
  const { employeeId, pageIndex, pageSize, filters, sorting } =
    await request.json();

  try {
    const { data: employeeData, error: employeeError } = await supabase
      .from("employees")
      .select("lanid")
      .eq("employee_id", employeeId)
      .single();

    if (employeeError) throw employeeError;

    const lanid = employeeData.lanid;

    const currentDate = new Date();
    const startDate = new Date(currentDate.setMonth(currentDate.getMonth() - 3))
      .toISOString()
      .split("T")[0];
    const endDate = new Date().toISOString().split("T")[0];

    let query = supabase
      .from("sales_data")
      .select("*, total_gross, total_net", { count: "exact" })
      .eq("Lanid", lanid)
      .gte("Date", startDate)
      .lte("Date", endDate)
      .range(pageIndex * pageSize, (pageIndex + 1) * pageSize - 1);

    filters.forEach((filter: any) => {
      query = query.ilike(filter.id, `%${filter.value}%`);
    });

    sorting.forEach((sort: any) => {
      query = query.order(sort.id, { ascending: !sort.desc });
    });

    const { data, count, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data, count });
  } catch (error) {
    console.error("Failed to fetch employee sales data:", error);
    return NextResponse.json(
      { error: "Failed to fetch employee sales data" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    },
  });
}
