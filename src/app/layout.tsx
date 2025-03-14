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
import { ReactElement } from "react";
import SupabaseProvider from "@/providers/supabase-provider";
import RealTimeNotificationsWrapper from "@/components/RealTimeNotificationsWrapper";
import { TooltipProvider } from "@/components/ui/tooltip";
import { createClient } from "@/utils/supabase/server";
import { FeatureFlagsProvider } from "@/context/FeatureFlagsContext";
import { headers } from "next/headers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TGR",
  description: "Everything TGR",
};

const clientId = process.env.GOOGLE_CLIENT_ID!;
if (!clientId) {
  throw new Error("Missing Google Client ID");
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = createClient();

  // Only get the session first
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("Session fetch error:", sessionError);
  }

  const shouldInjectToolbar = process.env.NODE_ENV === "development";

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SupabaseProvider initialUser={null}>
          <QueryProvider>
            <TooltipProvider>
              <GoogleOAuthProvider clientId={clientId}>
                <FeatureFlagsProvider>
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
                      <RoleProvider initialSession={session}>
                        <RealTimeNotificationsWrapper />
                        <Header />
                        <main className="min-h-screen">
                          {children as ReactElement}
                          {shouldInjectToolbar && <VercelToolbar />}
                          <Analytics />
                        </main>
                        <Toaster position="top-center" />
                      </RoleProvider>
                    </NotificationsProvider>
                  </ThemeProvider>
                </FeatureFlagsProvider>
              </GoogleOAuthProvider>
            </TooltipProvider>
          </QueryProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
