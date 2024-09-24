import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";

export async function POST(request: Request) {
  try {
    const { pageIndex, pageSize, filters, sorting } = await request.json();

    let query = supabase.from("certifications").select("*", { count: "exact" });

    if (filters && filters.length > 0) {
      filters.forEach((filter: { id: string; value: string }) => {
        if (filter.id === "action_status" && Array.isArray(filter.value)) {
          query = query.in(filter.id, filter.value);
        } else if (filter.id === "number") {
          query = query.eq(filter.id, filter.value);
        } else {
          query = query.ilike(filter.id, `%${filter.value}%`);
        }
      });
    }

    if (sorting && sorting.length > 0) {
      sorting.forEach((sort: { id: string; desc: boolean }) => {
        query = query.order(sort.id, { ascending: !sort.desc });
      });
    } else {
      query = query.order("expiration", { ascending: false });
    }

    const { data, count, error } = await query.range(
      pageIndex * pageSize,
      (pageIndex + 1) * pageSize - 1
    );

    if (error) throw error;

    return NextResponse.json({ data, count });
  } catch (error) {
    console.error("Error fetching filtered certifications data:", error);
    return NextResponse.json(
      { error: "Failed to fetch filtered certifications data" },
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
