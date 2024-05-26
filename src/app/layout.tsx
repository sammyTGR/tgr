import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/theme-provider";
import {
  ClerkProvider,
  SignInButton,
  SignOutButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { dark } from "@clerk/themes";
import Header from "../app/header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TGR Auditing",
  description: "Auditing Admin Resources",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
      <Header />
            <main>{children}</main>
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
    </>
  );
}
