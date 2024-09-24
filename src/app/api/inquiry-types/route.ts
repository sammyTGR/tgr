import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("orderlist")
      .select("inquiry_type")
      .neq("inquiry_type", null)
      .order("inquiry_type", { ascending: true });
    // console.log("Raw data from Supabase:", data); // Add this line

    if (error) throw error;

    // Filter out distinct inquiry types and remove empty strings
    const distinctInquiryTypes = Array.from(
      new Set(data.map((item) => item.inquiry_type))
    ).filter((type) => type && type.trim() !== "");

    return NextResponse.json(distinctInquiryTypes);
  } catch (error: any) {
    console.error("Error fetching inquiry types:", error.message);
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
