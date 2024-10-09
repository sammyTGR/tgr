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

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TGR",
  description: "Everything TGR",
};

const clientId = process.env.GOOGLE_CLIENT_ID!;
if (!clientId) {
  throw new Error("Missing Google Client ID");
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
                      {children}
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
