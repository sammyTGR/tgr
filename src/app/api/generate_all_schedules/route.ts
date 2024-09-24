import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";

export async function POST(request: Request) {
  try {
    const { weeks } = await request.json();

    if (!weeks || typeof weeks !== "number") {
      console.error("Invalid weeks parameter:", weeks);
      return NextResponse.json(
        { error: "Invalid weeks parameter" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc(
      "generate_schedules_for_all_employees",
      { weeks }
    );

    if (error) {
      console.error("Error generating schedules:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: "Schedules generated successfully",
      data,
    });
  } catch (error: any) {
    console.error("Unhandled error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
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
