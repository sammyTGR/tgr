import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "edge";
export const fetchCache = "force-cache";
export const revalidate = 3600; // Cache for 1 hour

// Add interface for manufacturer data
interface Manufacturer {
  id: number;
  make: string;
}

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
      .select("id, make")
      .order("make")
      .not("make", "eq", "")
      .limit(10000);

    if (fetchError) throw fetchError;

    // console.log("Database response:", data);

    const manufacturers =
      data?.map((item) => ({
        value: item.id.toString(),
        label: item.make.trim(),
      })) || [];

    manufacturers.sort((a, b) => a.label.localeCompare(b.label));

    // console.log("Transformed manufacturers:", manufacturers);
    // console.log(`Total manufacturers: ${manufacturers.length}`);

    return NextResponse.json(
      { manufacturers },
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
