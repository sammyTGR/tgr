import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("orderlist")
      .select("customer_type")
      .neq("customer_type", null)
      .order("customer_type", { ascending: true });
    // console.log("Raw data from Supabase:", data); // Add this line

    if (error) throw error;

    // Filter out distinct customer types and remove empty strings
    const distinctCustomerTypes = Array.from(
      new Set(data.map((item) => item.customer_type))
    ).filter((type) => type && type.trim() !== "");

    return NextResponse.json(distinctCustomerTypes);
  } catch (error: any) {
    console.error("Error fetching customer types:", error.message);
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
