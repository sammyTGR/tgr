import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '../components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { NextSSRPlugin } from '@uploadthing/react/next-ssr-plugin';
import { extractRouterConfig } from 'uploadthing/server';
import { ourFileRouter } from '@/app/api/uploadthing/core';
import QueryProvider from '@/providers/QueryProvider';
import { Analytics } from '@vercel/analytics/react';
import { VercelToolbar } from '@vercel/toolbar/next';
import { ReactElement } from 'react';
import SupabaseProvider from '@/providers/supabase-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { createClient } from '@/utils/supabase/server';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { cookies } from 'next/headers';
import { RoleProvider } from '@/context/RoleContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TGR',
  description: 'Everything TGR',
};

const clientId = process.env.GOOGLE_CLIENT_ID!;
if (!clientId) {
  throw new Error('Missing Google Client ID');
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const shouldInjectToolbar = process.env.NODE_ENV === 'development';

  // Get the sidebar state from cookies
  const cookieStore = cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SupabaseProvider initialUser={user}>
          <QueryProvider>
            <TooltipProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
                <RoleProvider>
                  <SidebarProvider defaultOpen={defaultOpen}>
                    <AppSidebar />
                    <main>
                      <SidebarTrigger />
                      {children as ReactElement}
                      {shouldInjectToolbar && <VercelToolbar />}
                      <Analytics />
                    </main>
                  </SidebarProvider>
                </RoleProvider>
                <Toaster />
              </ThemeProvider>
            </TooltipProvider>
          </QueryProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
