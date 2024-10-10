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
  let flagsmithState: IState<string> | undefined = undefined;

  const environmentID = process.env.NEXT_PUBLIC_FLAGSMITH_ENVIRONMENT_ID!;

  if (environmentID) {
    try {
      flagsmithState = await flagsmith
        .init({
          environmentID,
          identity: "my_user_id",
        })
        .then(() => {
          return flagsmith.getState();
        });
    } catch (error) {
      console.error("Failed to initialize Flagsmith:", error);
    }
  } else {
    console.warn("Flagsmith environment ID is not set");
  }
  const shouldInjectToolbar = process.env.NODE_ENV === "development";
  return (
    <RoleProvider>
      <GoogleOAuthProvider clientId={clientId}>
        <html lang="en" suppressHydrationWarning>
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
                      <Provider flagsmithState={flagsmithState}>
                        {children}
                      </Provider>

                      {shouldInjectToolbar && <VercelToolbar />}
                      <Analytics />
                    </main>
                    <Toaster />
                  </NotificationsProvider>
                </UnreadCountsProvider>
              </ThemeProvider>
            </QueryProvider>
          </body>
        </html>
      </GoogleOAuthProvider>
    </RoleProvider>
  );
}
