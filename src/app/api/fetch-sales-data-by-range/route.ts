import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";
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

    const { data, error } = await supabase.rpc("get_sales_by_range", {
      start_date: start,
      end_date: end,
    });

    if (error) {
      console.error("Error fetching data from Supabase:", error);
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in fetchSalesDataByRange API:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales data by date range" },
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
