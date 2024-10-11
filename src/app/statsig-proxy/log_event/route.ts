// app/statsig-proxy/initialize/route.ts

import { LogEventObject } from "statsig-node";



type LogEventBody = {
  events: LogEventObject[];
};

export async function POST(request: Request): Promise<Response> {
  const json = await request.json();

  if (!json || typeof json !== "object" || !Array.isArray(json.events)) {
    return new Response(null, { status: 400 });
  }

  const body = json as LogEventBody;



  return new Response(JSON.stringify({ success: true }));
}