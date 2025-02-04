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
import QueryProvider from "@/providers/QueryProvider";
import { Analytics } from "@vercel/analytics/react";
import { VercelToolbar } from "@vercel/toolbar/next";
import flagsmith from "flagsmith/isomorphic";
import { IState } from "flagsmith/types";
import FlagsmithWrapper from "@/FlagsmithWrapper";
import { ReactElement } from "react";
import SupabaseProvider from "@/providers/supabase-provider";
import RealTimeNotificationsWrapper from "@/components/RealTimeNotificationsWrapper";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TGR",
  description: "Everything TGR",
};

const clientId = process.env.GOOGLE_CLIENT_ID!;
if (!clientId) {
  throw new Error("Missing Google Client ID");
}

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
      identity: "my_user_id",
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
  const flagsmithState = await initializeFlagsmith();
  const shouldInjectToolbar = process.env.NODE_ENV === "development";

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SupabaseProvider>
          <QueryProvider>
            <TooltipProvider>
              <RoleProvider>
                <GoogleOAuthProvider clientId={clientId}>
                  <FlagsmithWrapper flagsmithState={flagsmithState}>
                    <NextSSRPlugin
                      routerConfig={extractRouterConfig(ourFileRouter)}
                    />
                    <ThemeProvider
                      attribute="class"
                      defaultTheme="system"
                      enableSystem
                      disableTransitionOnChange
                    >
                      <NotificationsProvider>
                        <RealTimeNotificationsWrapper />
                        <Header />
                        <main>
                          {children as ReactElement}
                          {shouldInjectToolbar && <VercelToolbar />}
                          <Analytics />
                        </main>
                        <Toaster />
                      </NotificationsProvider>
                    </ThemeProvider>
                  </FlagsmithWrapper>
                </GoogleOAuthProvider>
              </RoleProvider>
            </TooltipProvider>
          </QueryProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
