import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";

export async function GET() {
  try {
    const { count, error } = await supabase
      .from("time_off_requests")
      .select("request_id", { count: "exact" })
      .eq("is_read", false);

    if (error) {
      console.error("Error fetching unread time-off requests:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ unreadTimeOffCount: count || 0 });
  } catch (err) {
    console.error("Unexpected error fetching unread time-off requests:", err);
    return NextResponse.json(
      { error: "Unexpected error fetching unread time-off requests" },
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
