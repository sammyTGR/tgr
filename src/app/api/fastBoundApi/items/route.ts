//returns results but not the correct ones
"use server";

import { headers } from "next/headers";
import { NextResponse, NextRequest } from "next/server";
import { createFastBoundHeaders, FASTBOUND_CONFIG } from "@/utils/fastbound";

const BASE_URL = "https://cloud.fastbound.com"; // This is the correct base URL for FastBound
const ACCOUNT_NUMBER = process.env.FASTBOUND_ACCOUNT_NUMBER;
if (!ACCOUNT_NUMBER) {
  throw new Error(
    "FASTBOUND_ACCOUNT_NUMBER is not set in environment variables"
  );
}
const API_KEY = process.env.FASTBOUND_API_KEY;
const AUDIT_USER = process.env.FASTBOUND_AUDIT_USER;

class RateLimiter {
  private lastRequestTime: number = 0;
  private requestCount: number = 0;
  private readonly resetInterval: number = 60000; // 1 minute in milliseconds

  async limit() {
    const now = Date.now();
    if (now - this.lastRequestTime >= this.resetInterval) {
      this.requestCount = 0;
      this.lastRequestTime = now;
    }

    if (this.requestCount >= 60) {
      const waitTime = this.resetInterval - (now - this.lastRequestTime);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      this.requestCount = 0;
      this.lastRequestTime = Date.now();
    }

    this.requestCount++;
  }
}

const rateLimiter = new RateLimiter();

async function fetchItems(url: string, options: RequestInit): Promise<any> {
  await rateLimiter.limit();
  try {
    // console.log("Requesting FastBound API:", url);
    const response = await fetch(url, options);

    const responseText = await response.text();
    // console.log("FastBound API response:", responseText);

    if (!response.ok) {
      console.error("FastBound API error response:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers),
        body: responseText,
      });
      throw new Error(
        `FastBound API error: ${response.status} ${responseText}`
      );
    }

    return JSON.parse(responseText);
  } catch (error) {
    console.error("Error fetching items from FastBound API:", error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    // console.log("Received search params:", Object.fromEntries(searchParams));

    const skip = parseInt(searchParams.get("skip") || "0", 10);
    const take = parseInt(searchParams.get("take") || "10", 10);
    const search = searchParams.get("search");

    // Build the search URL
    const apiUrl = new URL(
      `${FASTBOUND_CONFIG.BASE_URL}/${FASTBOUND_CONFIG.ACCOUNT_NUMBER}/api/Items`
    );

    const searchFormData = new URLSearchParams();
    searchFormData.append("$top", take.toString());
    searchFormData.append("$skip", skip.toString());

    // Parse search parameters
    if (search) {
      const searchTerms = search.split(" AND ");
      const filters: string[] = [];

      searchTerms.forEach((term) => {
        const [key, value] = term.split(":");
        if (key && value) {
          const cleanValue = value.replace(/['"]/g, "").trim();

          switch (key) {
            case "Model":
              filters.push(`model eq '${cleanValue}'`);
              break;
            case "Manufacturer":
              filters.push(`manufacturer eq '${cleanValue}'`);
              break;
            case "Serial":
              filters.push(`serial eq '${cleanValue}'`);
              break;
            case "Deleted":
              filters.push(`deleted eq ${cleanValue.toLowerCase()}`);
              break;
            case "DoNotDispose":
              filters.push(`doNotDispose eq ${cleanValue.toLowerCase()}`);
              break;
          }
        }
      });

      if (filters.length > 0) {
        searchFormData.append("$filter", filters.join(" and "));
      }
    }

    // Add the search parameters to the URL
    apiUrl.search = searchFormData.toString();

    const headers = createFastBoundHeaders({
      "Content-Type": "application/json",
    });

    // Filter out undefined values and ensure all values are strings
    const validHeaders = Object.entries(headers)
      .filter(([_, value]) => value !== undefined)
      .reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: value as string,
        }),
        {} as Record<string, string>
      );

    const fetchOptions: RequestInit = {
      method: "GET",
      headers: new Headers(validHeaders),
    };

    const data = await fetchItems(apiUrl.toString(), fetchOptions);
    // console.log("FastBound API response data:", data);

    return NextResponse.json({
      items: data.items || [],
      totalItems: data.records || 0,
      currentPage: Math.floor(skip / take) + 1,
      totalPages: Math.ceil((data.records || 0) / take),
      itemsPerPage: take,
      records: data.records || 0,
      skip,
    });
  } catch (error: any) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
