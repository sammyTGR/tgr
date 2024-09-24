import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.split(" ")[1];
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);
  if (userError || !user) {
    console.error(
      "Error fetching user with token:",
      userError?.message || "No user data"
    );
    return NextResponse.json(
      { error: userError?.message || "Unauthorized" },
      { status: 401 }
    );
  }

  const { date_of_walk, lanes, lanes_with_problems, description, role } =
    await request.json();

  try {
    const { error: insertError } = await supabase
      .from("range_walk_reports")
      .insert([
        {
          user_uuid: user.id,
          user_name: user.user_metadata.full_name || user.email,
          date_of_walk,
          lanes,
          lanes_with_problems,
          description,
          role,
        },
      ]);

    if (insertError) {
      console.error("Error inserting data:", insertError.message);
      throw insertError;
    }

    return NextResponse.json({ message: "Report submitted successfully." });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error handling request:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      console.error("Unknown error handling request:", error);
      return NextResponse.json(
        { error: "An unknown error occurred." },
        { status: 500 }
      );
    }
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
