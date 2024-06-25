// src/pages/api/fetch-unread.ts
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { corsHeaders } from '@/utils/cors';

const useUnreadMessages = (userId: string) => {
  
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadMessages = async () => {
    const { count, error } = await supabase
      .from("chat_messages")
      .select("id", { count: "exact" })
      .eq("user_id", userId)
      .eq("is_read", false); // Assuming 'is_read' is now a boolean column

    if (error) {
      console.error("Error fetching unread messages:", error);
    } else {
      setUnreadCount(count || 0);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUnreadMessages();

      const subscription = supabase
        .channel('chat_messages')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, payload => {
          fetchUnreadMessages();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [userId]);

  return unreadCount;
};

export default useUnreadMessages;
