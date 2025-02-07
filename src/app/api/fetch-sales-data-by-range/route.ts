import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

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

    console.log("Calling RPC with params:", {
      start_date: start,
      end_date: end,
    });

    const { data, error } = await supabase.rpc("get_sales_by_range", {
      start_date: start,
      end_date: end,
    });

    if (error) {
      console.error("Supabase RPC Error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return NextResponse.json(
        {
          error: "Database error",
          details: error.message,
          hint: error.hint,
        },
        { status: 500 }
      );
    }

    if (!data) {
      console.log("No data returned from RPC");
      return NextResponse.json({ data: [] });
    }

    console.log("RPC successful, returned rows:", data.length);
    return NextResponse.json(data);
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
