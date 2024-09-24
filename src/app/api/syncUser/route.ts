import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";

export async function POST(request: Request) {
  const user = await request.json();

  const user_uuid = user.id;
  const email = user.email.toLowerCase();
  const first_name = user.user_metadata.full_name?.split(" ")[0] || "";
  const last_name = user.user_metadata.full_name?.split(" ")[1] || "";

  try {
    const { data, error } = await supabase.from("customers").insert({
      user_uuid,
      email,
      first_name,
      last_name,
      role: "customer",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error inserting customer:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: "Customer inserted successfully",
      data,
    });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
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
