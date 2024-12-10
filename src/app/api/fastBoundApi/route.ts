//returns results but not the correct ones

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BASE_URL = "https://cloud.fastbound.com";
const API_KEY = process.env.FASTBOUND_API_KEY!;
const ACCOUNT_NUMBER = process.env.FASTBOUND_ACCOUNT_NUMBER!;
const FASTBOUND_ACCOUNT_EMAIL = process.env.FASTBOUND_ACCOUNT_EMAIL!;

if (!API_KEY || !ACCOUNT_NUMBER) {
  throw new Error("FastBound API key or account number is not set");
}

// Add interface for header types
interface HeadersType {
  Authorization: string;
  "X-AuditUser": string;
  Accept: string;
  "X-Requested-With": string;
  "Content-Type"?: string;
  [key: string]: string | undefined;
}

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
    const response = await fetch(`${BASE_URL}/${ACCOUNT_NUMBER}/api/Account`, {
      headers: new Headers({
        Authorization: `Basic ${Buffer.from(`${API_KEY}:`).toString("base64")}`,
        "Content-Type": "application/json",
        "X-AuditUser": FASTBOUND_ACCOUNT_EMAIL || "",
      }),
    });

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

// Helper function to create FastBound headers
export function createFastBoundHeaders(
  additionalHeaders: Partial<HeadersType> = {}
) {
  const baseHeaders: HeadersType = {
    Authorization: `Basic ${Buffer.from(`${API_KEY}:`).toString("base64")}`,
    "X-AuditUser": FASTBOUND_ACCOUNT_EMAIL || "",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
    ...additionalHeaders,
  };

  if (!("Content-Type" in additionalHeaders)) {
    baseHeaders["Content-Type"] = "application/json";
  }

  return baseHeaders;
}

// Export constants for use in other routes
export const FASTBOUND_CONFIG = {
  BASE_URL,
  ACCOUNT_NUMBER,
  API_KEY,
  ACCOUNT_EMAIL: FASTBOUND_ACCOUNT_EMAIL,
};
