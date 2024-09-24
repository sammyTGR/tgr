import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";

export async function POST(request: Request) {
  const { request_id } = await request.json();

  if (!request_id) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const { error } = await supabase
      .from("time_off_requests")
      .update({ is_read: true, status: "duplicate" })
      .eq("request_id", request_id);

    if (error) {
      console.error("Error marking request as duplicate:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Request marked as duplicate" });
  } catch (err: any) {
    console.error("Unexpected error marking request as duplicate:", err);
    return NextResponse.json(
      {
        error: "Unexpected error marking request as duplicate",
        details: err.message,
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
