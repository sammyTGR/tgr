import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { corsHeaders } from "@/utils/cors";

export async function GET() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("employees")
      .select("name")
      .order('name', { ascending: true });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      console.log("No employees found");
      return NextResponse.json([]);
    }

    const employeeNames = data.map(employee => employee.name);
    console.log("Fetched employee names:", employeeNames);

    return NextResponse.json(employeeNames);
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
      ...corsHeaders,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
}
