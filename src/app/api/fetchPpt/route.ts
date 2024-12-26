import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const manufacturers = [
  { id: "-1", name: "Select Make" },
  { id: "3440", name: ".38 MASTER (AUTO) S&W" },
  { id: "5266", name: "17 DESIGN & MANUFACTURING" },
  { id: "712", name: "1991 A1 (BUDGET CIVILIAN .45)" },
  // ... continue with all manufacturers
  { id: "4033", name: "ZVI (ZBROJOVKA VSETIN-INDET)" },
];

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // Insert manufacturers if they don't exist
    const { error } = await supabase.from("manufacturers").upsert(
      manufacturers.map((m) => ({
        id: m.id,
        name: m.name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "id" }
    );

    if (error) throw error;

    // Return all manufacturers
    const { data, error: fetchError } = await supabase
      .from("manufacturers")
      .select("*")
      .order("name");

    if (fetchError) throw fetchError;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching manufacturers" },
      { status: 500 }
    );
  }
}
