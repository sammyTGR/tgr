import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { pageIndex, pageSize, filters, sorting } = await request.json();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get active employees first
    const { data: activeEmployees } = await supabase
      .from("employees")
      .select("name")
      .eq("status", "active");

    const activeEmployeeNames = activeEmployees?.map((emp) => emp.name) || [];

    // Query certifications for active employees
    let query = supabase.from("certifications").select("*", { count: "exact" });

    // Only include certifications for active employees
    if (activeEmployeeNames.length > 0) {
      query = query.in("name", activeEmployeeNames);
    }

    // Apply other filters
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

    // Apply sorting
    if (sorting && sorting.length > 0) {
      sorting.forEach((sort: { id: string; desc: boolean }) => {
        query = query.order(sort.id, { ascending: !sort.desc });
      });
    } else {
      query = query.order("expiration", { ascending: false });
    }

    // Apply pagination
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
