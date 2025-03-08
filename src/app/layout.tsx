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
import FlagsmithWrapper from "@/FlagsmithWrapper";
import { ReactElement } from "react";
import SupabaseProvider from "@/providers/supabase-provider";
import RealTimeNotificationsWrapper from "@/components/RealTimeNotificationsWrapper";
import { TooltipProvider } from "@/components/ui/tooltip";
import { createClient } from "@/utils/supabase/server";

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
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const shouldInjectToolbar = process.env.NODE_ENV === "development";

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SupabaseProvider initialSession={session}>
          <QueryProvider>
            <TooltipProvider>
              <GoogleOAuthProvider clientId={clientId}>
                <FlagsmithWrapper>
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
                      <RoleProvider>
                        <RealTimeNotificationsWrapper />
                        <Header />
                        <main>
                          {children as ReactElement}
                          {shouldInjectToolbar && <VercelToolbar />}
                          <Analytics />
                        </main>
                        <Toaster />
                      </RoleProvider>
                    </NotificationsProvider>
                  </ThemeProvider>
                </FlagsmithWrapper>
              </GoogleOAuthProvider>
            </TooltipProvider>
          </QueryProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
