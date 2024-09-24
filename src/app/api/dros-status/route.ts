import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("pointslist")
      .select("dros_status")
      .neq("dros_status", null)
      .order("dros_status", { ascending: true });

    if (error) throw error;

    const distinctDrosStatus = Array.from(
      new Set(data.map((item) => item.dros_status))
    );

    return NextResponse.json(distinctDrosStatus);
  } catch (error: any) {
    console.error("Error fetching DROS status:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
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
