"use server";

import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Return all manufacturers without a limit
    const { data, error: fetchError } = await supabase
      .from("manufacturers")
      .select("*")
      .order("make")
      .limit(100000); // Set a very high limit to get all records

    if (fetchError) {
      console.error("Error fetching manufacturers:", fetchError);
      throw fetchError;
    }

    // Log the number of manufacturers returned
    console.log(`Number of manufacturers returned: ${data?.length}`);

    // Transform the data to match the expected format in your component
    const transformedData = data?.reduce((acc, manufacturer) => {
      acc[manufacturer.make] = []; // Empty array since we don't have models yet
      return acc;
    }, {} as Record<string, string[]>);

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error("Error in GET route:", error);
    return NextResponse.json(
      { error: "Error fetching manufacturers" },
      { status: 500 }
    );
  }
}
