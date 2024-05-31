"use client";
import React, { useState, useEffect } from "react";
import { supabase as supabaseBrowser } from "@/utils/supabase/client";

const initUser = {
  created_at: "",
  display_name: "",
  email: "",
  id: "",
  image_url: "",
};

export default function useUser() {
  const [user, setUser] = useState(initUser);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await supabaseBrowser.auth.getSession();
        if (data.session?.user) {
          const { data: userProfile, error: fetchError } = await supabaseBrowser
            .from("profiles")
            .select("*")
            .eq("id", data.session.user.id)
            .single();

          if (fetchError) {
            throw fetchError;
          }

          setUser(userProfile);
        } else {
          setUser(initUser);
        }
      } catch (err: any) {
        setError(err.message || "An error occurred while fetching the user.");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, loading, error };
}
