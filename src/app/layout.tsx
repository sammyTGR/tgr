import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import Header from "../app/header";
import { RoleProvider } from "../context/RoleContext";
import NotificationsProvider from "@/components/NotificationsProvider";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/api/uploadthing/core";
import { UnreadCountsProvider } from "../components/UnreadCountsContext";
import QueryProvider from "@/providers/QueryProvider";
import { Analytics } from "@vercel/analytics/react";
import { VercelToolbar } from "@vercel/toolbar/next";
import Provider from "./provider";
import flagsmith from "flagsmith/isomorphic";
import { IState } from "flagsmith/types";
import dynamic from "next/dynamic";
import MyStatsig from "./my-statsig";
import { generateBootstrapValues } from "./statsig-backend";
import FlagsmithWrapper from "@/FlagsmithWrapper";
import { ReactElement } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TGR",
  description: "Everything TGR",
};

const clientId = process.env.GOOGLE_CLIENT_ID!;
if (!clientId) {
  throw new Error("Missing Google Client ID");
}

const DynamicProvider = dynamic(() => import("./provider"), { ssr: false });

async function initializeFlagsmith(): Promise<IState<string> | undefined> {
  const environmentID = process.env.NEXT_PUBLIC_FLAGSMITH_ENVIRONMENT_ID!;
  if (!environmentID) {
    console.warn("Flagsmith environment ID is not set");
    return undefined;
  }

  try {
    await flagsmith.init({
      environmentID,
      // Use a default identity or consider using a dynamic one based on the user
      identity: "default_user",
    });
    return flagsmith.getState();
  } catch (error) {
    console.error("Failed to initialize Flagsmith:", error);
    return undefined;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const bootstrapValues = await generateBootstrapValues();
  const flagsmithState = await initializeFlagsmith();
  const shouldInjectToolbar = process.env.NODE_ENV === "development";

  return (
    <RoleProvider>
      <GoogleOAuthProvider clientId={clientId}>
        <html lang="en" suppressHydrationWarning>
          {/* <MyStatsig bootstrapValues={bootstrapValues}> */}
          <FlagsmithWrapper flagsmithState={flagsmithState}>
            <body className={inter.className}>
              <QueryProvider>
                <NextSSRPlugin
                  routerConfig={extractRouterConfig(ourFileRouter)}
                />
                <ThemeProvider
                  attribute="class"
                  defaultTheme="system"
                  enableSystem
                  disableTransitionOnChange
                >
                  <UnreadCountsProvider>
                    <NotificationsProvider>
                      <Header />
                      <main>
                        {children as ReactElement}

                        {shouldInjectToolbar && <VercelToolbar />}
                        <Analytics />
                      </main>
                      <Toaster />
                    </NotificationsProvider>
                  </UnreadCountsProvider>
                </ThemeProvider>
              </QueryProvider>
            </body>
          </FlagsmithWrapper>
          {/* </MyStatsig> */}
        </html>
      </GoogleOAuthProvider>
    </RoleProvider>
  );
}
