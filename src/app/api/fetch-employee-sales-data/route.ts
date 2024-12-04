import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Create server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const { employeeId } = await request.json();
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First get the employee's lanid
    const { data: employeeData, error: employeeError } = await supabase
      .from("employees")
      .select("lanid")
      .eq("employee_id", employeeId)
      .single();

    if (employeeError) {
      console.error("Employee lookup error:", employeeError);
      return NextResponse.json(
        { error: employeeError.message },
        { status: 400 }
      );
    }

    if (!employeeData) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    const lanid = employeeData.lanid;
    console.log("Found LANID:", lanid); // Debug log

    // Get sales data
    const { data: salesData, error: salesError } = await supabase
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
        total_net
      `
      )
      .eq("Lanid", lanid)
      .order("Date", { ascending: false });

    if (salesError) {
      console.error("Sales data lookup error:", salesError);
      throw salesError;
    }

    // console.log("Sales data count:", salesData?.length); // Debug log
    // console.log("First few sales records:", salesData?.slice(0, 3)); // Debug log

    return NextResponse.json({
      data: salesData,
      count: salesData?.length ?? 0,
      debug: {
        employeeId,
        lanid,
        recordsFound: salesData?.length ?? 0,
      },
    });
  } catch (error) {
    console.error("Failed to fetch employee sales data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch employee sales data",
        details: error instanceof Error ? error.message : "Unknown error",
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
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    },
  });
}
