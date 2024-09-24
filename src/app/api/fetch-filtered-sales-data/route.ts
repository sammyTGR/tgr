import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";

export async function POST(request: Request) {
  try {
    const { pageIndex, pageSize, filters } = await request.json();

    let query = supabase
      .from("sales_data")
      .select("*", { count: "exact" })
      .range(pageIndex * pageSize, (pageIndex + 1) * pageSize - 1);

    if (filters && filters.length > 0) {
      filters.forEach((filter: { column: string; value: string }) => {
        query = query.ilike(filter.column, `%${filter.value}%`);
      });
    }

    const { data, count, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data, count });
  } catch (error) {
    console.error("Error fetching filtered sales data:", error);
    return NextResponse.json(
      { error: "Failed to fetch filtered sales data" },
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
