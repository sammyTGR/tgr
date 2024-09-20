import { NextResponse } from "next/server";
import { syncStripeData } from "@/utils/stripe/syncStripeData";

let lastSyncTime = 0;
const SYNC_INTERVAL = 60 * 60 * 1000; // 60 minutes in milliseconds

export async function GET(req: Request) {
  const now = Date.now();

  try {
    if (now - lastSyncTime < SYNC_INTERVAL) {
      // If less than 5 minutes have passed since the last sync, return cached result
      return NextResponse.json({ message: "Using cached Stripe data" });
    }

    await syncStripeData();
    lastSyncTime = now;
    return NextResponse.json({ message: "Stripe data synced successfully" });
  } catch (error) {
    console.error("Error syncing Stripe data:", error);
    return NextResponse.json(
      { error: "Failed to sync Stripe data" },
      { status: 500 }
    );
  }
}
