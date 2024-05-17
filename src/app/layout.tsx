import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import { ClerkProvider, SignInButton, SignOutButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { dark } from '@clerk/themes';
import Link from "next/link";
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
    <ClerkProvider
    appearance={{ baseTheme: dark }}>
    <html lang="en" suppressHydrationWarning>
    <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
      <body className={inter.className}>
      <header className="flex items-center justify-between p-4">
            <SignedOut>
              <SignInButton>
              <Button>Sign In</Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
            <Header />
          </header>
          <main>
        {children}
        </main>      
      </body>
      </ThemeProvider>
    </html>
    </ClerkProvider>
  );
}