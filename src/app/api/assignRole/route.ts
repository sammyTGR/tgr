import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";

export async function POST(request: Request) {
  const { email, role } = await request.json();

  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("email", email);

    if (error) throw error;

    return NextResponse.json({ message: "Role assigned successfully" });
  } catch (error: any) {
    console.error("Error assigning role:", error.message);
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
