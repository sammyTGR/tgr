"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../types/supabase";

type SupabaseContextType = {
  supabase: SupabaseClient<Database>;
  user: User | null;
};

const Context = createContext<SupabaseContextType | undefined>(undefined);

let supabaseInstance: SupabaseClient<Database> | null = null;

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [supabase] = useState(() => {
    if (!supabaseInstance) {
      supabaseInstance = createClientComponentClient<Database>();
    }
    return supabaseInstance;
  });

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === "SIGNED_IN") router.refresh();
      if (event === "SIGNED_OUT") {
        router.refresh();
        router.push("/auth/signin");
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  return (
    <Context.Provider value={{ supabase, user }}>{children}</Context.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error("useSupabase must be used inside SupabaseProvider");
  }
  return context;
};
