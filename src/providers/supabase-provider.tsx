"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../types/supabase";
import { supabase } from "@/utils/supabase/client";

type SupabaseContextType = {
  supabase: typeof supabase;
  user: User | null;
};

const Context = createContext<SupabaseContextType | undefined>(undefined);

export default function SupabaseProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: User | null;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(initialUser);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN") {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
        router.refresh();
      }
      if (event === "SIGNED_OUT") {
        setUser(null);
        router.refresh();
        router.push("/sign-in");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

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
