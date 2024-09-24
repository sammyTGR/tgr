import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";
import { corsHeaders } from "@/utils/cors";

export async function GET() {
  try {
    const { data, error } = await supabase.from("employees").select("name");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Unexpected error fetching employees:", err);
    return NextResponse.json(
      { error: "Unexpected error fetching employees" },
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
