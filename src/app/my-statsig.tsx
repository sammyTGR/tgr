// app/my-statsig.tsx

"use client";

import {
  LogLevel,
  StatsigProvider,
  StatsigUser,
  // useClientAsyncInit, // <- Remove this
  useClientBootstrapInit, // <- Add this
} from "@statsig/react-bindings";
import { runStatsigAutoCapture } from "@statsig/web-analytics";
import React, { useEffect } from "react";

export default function MyStatsig({
  children,
  bootstrapValues,
}: {
  bootstrapValues: { data: string; user: StatsigUser; key: string };
  children: React.ReactNode;
}) {
  // Update to using useClientBootstrapInit instead of useClientAsyncInit
  const client = useClientBootstrapInit(
    bootstrapValues.key,
    bootstrapValues.user,
    bootstrapValues.data,
    { logLevel: LogLevel.Debug } // Optional - Prints debug logs to the console
  );

  useEffect(() => {
    runStatsigAutoCapture(client);
  }, [client]);

  return <StatsigProvider client={client}>{children}</StatsigProvider>;
}