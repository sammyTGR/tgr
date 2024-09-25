import { NextResponse } from "next/server";
import { syncStripeData } from "@/utils/stripe/syncStripeData";
import { createClient } from "@/utils/supabase/server";

const SYNC_INTERVAL = 60 * 60 * 1000; // 60 minutes in milliseconds

export async function GET(req: Request) {
  const supabase = createClient();

  try {
    // Check last sync time from database
    const { data: syncInfo, error: fetchError } = await supabase
      .from("stripe_sync_info")
      .select("last_sync_time")
      .single();

    if (fetchError) {
      console.error("Error fetching last sync time:", fetchError);
      throw new Error("Failed to fetch last sync time");
    }

    const now = Date.now();
    const lastSyncTime = syncInfo?.last_sync_time || 0;

    if (now - lastSyncTime < SYNC_INTERVAL) {
      return NextResponse.json({ message: "Using cached Stripe data" });
    }

    // Perform sync
    await syncStripeData();

    // Update last sync time in database
    const { error: updateError } = await supabase
      .from("stripe_sync_info")
      .upsert({ id: 1, last_sync_time: now });

    if (updateError) {
      console.error("Error updating last sync time:", updateError);
      throw new Error("Failed to update last sync time");
    }

    return NextResponse.json({ message: "Stripe data synced successfully" });
  } catch (error) {
    console.error("Error syncing Stripe data:", error);
    return NextResponse.json(
      { error: "Failed to sync Stripe data" },
      { status: 500 }
    );
  }
}
