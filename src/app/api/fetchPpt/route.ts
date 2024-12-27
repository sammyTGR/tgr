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

    // Set higher range and add order and filter conditions
    const { data, error: fetchError } = await supabase
      .from("manufacturers")
      .select("make")
      .order("make")
      .range(0, 10000);

    if (fetchError) {
      console.error("Error fetching manufacturers:", fetchError);
      throw fetchError;
    }

    // Transform the data more efficiently
    const transformedData = data?.reduce((acc, { make }) => {
      acc[make] = [];
      return acc;
    }, {} as Record<string, string[]>);

    return new NextResponse(JSON.stringify(transformedData), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Error in GET route:", error);
    return NextResponse.json(
      { error: "Error fetching manufacturers" },
      { status: 500 }
    );
  }
}
