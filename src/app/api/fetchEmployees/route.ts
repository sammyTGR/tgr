import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { PostgrestFilterBuilder } from "@supabase/postgrest-js";

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    const { searchParams } = new URL(request.url)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let query = supabase
      .from("employees")
      .select("*") as PostgrestFilterBuilder<any, any, any>;

    // Convert searchParams to array and iterate
    Array.from(searchParams.entries()).forEach(([key, value]) => {
      if (key !== "single") {
        query = query.eq(key, value);
      }
    });

    const { data, error } = await (searchParams.get("single") === "true"
      ? query.single()
      : query);

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
