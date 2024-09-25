import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { corsHeaders } from "@/utils/cors";

export async function GET() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("time_off_reasons")
      .select("id, reason")
      .order('reason', { ascending: true });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      // console.log("No time off reasons found");
      return NextResponse.json([]);
    }

    const timeOffReasons = data.map(item => ({ id: item.id, reason: item.reason }));
    // console.log("Fetched time off reasons:", timeOffReasons);

    return NextResponse.json(timeOffReasons);
  } catch (err) {
    console.error("Unexpected error fetching time off reasons:", err);
    return NextResponse.json(
      { error: "Unexpected error fetching time off reasons" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
}
