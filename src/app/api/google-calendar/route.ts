import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET() {
  const calendar = google.calendar({
    version: "v3",
    auth: process.env.GOOGLE_CALENDAR_API_KEY,
  });

  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  try {
    const response = await calendar.events.list({
      calendarId,
      singleEvents: true,
      orderBy: "startTime",
    });

    // console.log("Fetched events:", response.data.items);
    return NextResponse.json({ events: response.data.items });
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        "Error fetching calendar events:",
        error.message,
        error.stack
      );
    } else {
      console.error("Unexpected error fetching calendar events:", error);
    }
    return NextResponse.json(
      { error: "Failed to fetch events" },
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
