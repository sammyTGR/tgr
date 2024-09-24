import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { corsHeaders } from "@/utils/cors";

// Initialize Supabase client (make sure to use server-side initialization)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  // Handle CORS
  if (request.method === "OPTIONS") {
    return new NextResponse("ok", { headers: corsHeaders });
  }

  try {
    // Extract userId from query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Fetch unread messages count
    const { count, error } = await supabase
      .from("chat_messages")
      .select("id", { count: "exact" })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      throw error;
    }

    // Return the count
    return NextResponse.json({ unreadCount: count }, { headers: corsHeaders });
  } catch (error) {
    console.error("Error fetching unread messages:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
