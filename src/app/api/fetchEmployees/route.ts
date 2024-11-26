import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import type { PostgrestFilterBuilder } from "@supabase/postgrest-js";

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { searchParams } = new URL(request.url);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let query = supabase.from("employees").select(
      searchParams.get("select") || "*"
    ) as PostgrestFilterBuilder<any, any, any>;

    // Handle ordering
    const order = searchParams.get("order");
    if (order) {
      const [column, direction] = order.split(".");
      query = query.order(column, { ascending: direction === "asc" });
    } else {
      // Default ordering by lanid if no order specified
      query = query.order("lanid", { ascending: true });
    }

    // Handle filtering parameters including equals conditions
    Array.from(searchParams.entries()).forEach(([key, value]) => {
      if (!["select", "order", "single"].includes(key)) {
        // Handle equals condition in the format "field:value"
        if (key === "equals") {
          const [field, fieldValue] = value.split(":");
          query = query.eq(field, fieldValue);
        } else {
          query = query.eq(key, value);
        }
      }
    });

    const { data, error } = await (searchParams.get("single") === "true"
      ? query.single()
      : query);

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in fetchEmployees:', error);
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}