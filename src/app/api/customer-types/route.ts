import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = createClient();
    // console.log("Fetching customer types...");
    
    const { data, error } = await supabase
      .from("orderlist")
      .select("customer_type")
      .neq("customer_type", null)
      .order("customer_type", { ascending: true });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("Raw data from Supabase:", data);

    if (!data || data.length === 0) {
      // console.log("No data returned from Supabase");
      return NextResponse.json([]);
    }

    const distinctTypes = Array.from(
      new Set(data.map((item) => item.customer_type))
    ).filter((type) => type && type.trim() !== "");

    // console.log("Distinct customer types:", distinctTypes);

    return NextResponse.json(distinctTypes);
  } catch (err: any) {
    console.error("Unexpected error fetching customer types:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}