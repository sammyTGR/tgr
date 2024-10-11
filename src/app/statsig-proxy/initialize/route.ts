// app/statsig-proxy/initialize/route.ts

import { StatsigUser } from "statsig-node";

import { generateBootstrapValues } from "@/app/statsig-backend";

export async function POST(request: Request): Promise<Response> {
  const json = await request.json();

  if (!json || typeof json !== "object") {
    return new Response(null, { status: 400 });
  }

  const body = json as { user: StatsigUser };

  const { data } = await generateBootstrapValues();
  return new Response(data);
}