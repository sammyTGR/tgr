"use client";
import { createClient } from "@supabase/supabase-js";

// Export the function itself
export function createClerkSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: async (url, options = {}) => {
          const clerkSession = window.Clerk.session;
          const clerkToken = await clerkSession?.getToken({
            template: "supabase"
          });

          const headers = new Headers(options.headers);
          if (clerkToken) {
            headers.set("Authorization", `Bearer ${clerkToken}`);
          }

          // Use the native fetch to proceed with the modified headers
          return fetch(url, {
            ...options,
            headers,
          });
        },
      },
    }
  );
}
export const supabase = createClerkSupabaseClient()
export default supabase