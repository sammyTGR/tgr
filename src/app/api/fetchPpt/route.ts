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

    let allData: Manufacturer[] = [];
    let lastId = 0;
    let hasMore = true;

    // Keep fetching until we have all records
    while (hasMore) {
      const { data, error } = await supabase
        .from("manufacturers")
        .select("id, make")
        .gt("id", lastId)
        .order("id")
        .not("make", "eq", "")
        .limit(1000);

      if (error) throw error;

      if (!data || data.length === 0) {
        hasMore = false;
        continue;
      }

      allData = [...allData, ...data];
      lastId = data[data.length - 1].id;

      // If we got less than 1000 records, we've reached the end
      if (data.length < 1000) {
        hasMore = false;
      }
    }

    // Transform all the data
    const manufacturers = allData.map((item) => ({
      value: item.make.trim(),
      label: item.make.trim(),
    }));

    // Remove duplicates (if any)
    const uniqueManufacturers = Array.from(
      new Map(manufacturers.map((item) => [item.value, item])).values()
    );

    // Sort alphabetically
    uniqueManufacturers.sort((a, b) => a.label.localeCompare(b.label));

    console.log(`Total manufacturers fetched: ${uniqueManufacturers.length}`);

    return NextResponse.json(
      { manufacturers: uniqueManufacturers },
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
