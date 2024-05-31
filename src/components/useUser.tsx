"use client";
import { supabase as supabaseBrowser } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";
import React from "react";

const initUser = {
  created_at: "",
  display_name: "",
  email: "",
  id: "",
  image_url: "",
};

export default function useUser() {
  return useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data } = await supabaseBrowser.auth.getSession();
      if (data.session?.user) {
        // fetch user information profile
        const { data: user } = await supabaseBrowser
          .from("profiles")
          .select("*")
          .eq("id", data.session.user.id)
          .single();

        return user;
      }
      return initUser;
    },
  });
}
