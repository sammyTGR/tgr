import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "edge";
export const fetchCache = "force-cache";
export const revalidate = 3600; // Cache for 1 hour

export async function GET(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error: fetchError } = await supabase
      .from("manufacturers")
      .select("make")
      .order("make")
      .not("make", "eq", "")
      .range(0, 5000);

    if (fetchError) throw fetchError;

    // Filter and clean the makes array
    const makes =
      data
        ?.map((item) => item.make)
        .filter((make): make is string => Boolean(make) && make.trim() !== "")
        .sort((a, b) => a.localeCompare(b)) || [];

    return NextResponse.json(
      { makes },
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    console.error("Error in GET route:", error);
    return NextResponse.json(
      { error: "Error fetching manufacturers" },
      { status: 500 }
    );
  }
}
