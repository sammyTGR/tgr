// app/statsig-backend.ts

import Statsig, { StatsigUser } from "statsig-node";

const isStatsigReady = Statsig.initialize(process.env.STATSIG_SERVER_KEY!, {
  environment: { tier: "development" },
});

export async function generateBootstrapValues(): Promise<{
  data: string;
  user: StatsigUser;
  key: string;
}> {
  await isStatsigReady;

  const user = { userID: "a-user" };
  const key = process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY!;

  const values = Statsig.getClientInitializeResponse(user, key, {
    hash: "djb2", //🔥 'djb2' is required. By default this would be 'sha256'.
  });

  return {
    data: JSON.stringify(values),
    user,
    key,
  };
}