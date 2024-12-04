import { NextResponse } from "next/server";
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { count, error } = await supabase
      .from("time_off_requests")
      .select("request_id", { count: "exact" })
      .eq("is_read", false)
      .eq("status", "pending");  // Only count pending requests

    if (error) {
      console.error("Error fetching unread time-off requests:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ unreadTimeOffCount: count || 0 });
  } catch (err) {
    console.error("Unexpected error fetching unread time-off requests:", err);
    return NextResponse.json(
      { error: "Unexpected error fetching unread time-off requests" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    },
  });
}
