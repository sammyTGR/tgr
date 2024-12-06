import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "../../../types/supabase";

let supabaseInstance: ReturnType<typeof createBrowserClient<Database>> | null =
  null;

export function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return supabaseInstance;
}

// For backwards compatibility
export const supabase = getSupabaseClient();
