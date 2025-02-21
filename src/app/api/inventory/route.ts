import { NextResponse } from "next/server";
import { searchInventory } from "../aim/servicestack-api";

export const maxDuration = 60; // Set max duration to 60 seconds

export async function POST(request: Request) {
  try {
    const searchParams = await request.json();
    // console.log("Received search params:", searchParams);

    const result = await searchInventory(searchParams);
    // console.log("Search result:", result);

    // Ensure we're only returning serializable data
    const serializableResult = JSON.parse(JSON.stringify(result));
    return NextResponse.json(serializableResult);
  } catch (error) {
    console.error("Search error:", error);

    // Enhanced error logging
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    }

    return NextResponse.json(
      {
        Status: {
          ErrorMessage:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
          StatusCode: "Error",
          ErrorCode:
            error instanceof Error && (error as any).code
              ? (error as any).code
              : "UNKNOWN_ERROR",
        },
      },
      { status: 500 }
    );
  }
}
