import { NextResponse } from "next/server";
import {
  supabase,
  createFastBoundHeaders,
  FASTBOUND_CONFIG,
} from "@/utils/fastbound";

export async function GET() {
  try {
    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Authentication error:", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Make request to FastBound API
    const response = await fetch(
      `${FASTBOUND_CONFIG.BASE_URL}/${FASTBOUND_CONFIG.ACCOUNT_NUMBER}/api/Account`,
      {
        headers: new Headers({
          Authorization: `Basic ${Buffer.from(
            `${FASTBOUND_CONFIG.API_KEY}:`
          ).toString("base64")}`,
          "Content-Type": "application/json",
          "X-AuditUser": FASTBOUND_CONFIG.ACCOUNT_EMAIL || "",
        }),
      }
    );

    const responseText = await response.text();
    console.log("FastBound API response:", responseText);

    if (!response.ok) {
      console.error("FastBound API error:", {
        status: response.status,
        statusText: response.statusText,
        response: responseText,
      });
      throw new Error(
        `FastBound API error: ${response.status} ${responseText}`
      );
    }

    try {
      const accountInfo = JSON.parse(responseText);
      return NextResponse.json(accountInfo);
    } catch (parseError) {
      console.error("Error parsing FastBound API response:", parseError);
      throw new Error("Invalid JSON response from FastBound API");
    }
  } catch (error: any) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error.message,
      },
      {
        status: 500,
      }
    );
  }
}
