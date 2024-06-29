"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/utils/supabase/client";
import { useRole } from "@/context/RoleContext";
import { usePathname } from "next/navigation";

const useRealtimeNotifications = () => {
  const { user } = useRole();
  const pathname = usePathname();

  useEffect(() => {
    if (!user) return;

    const client = supabase;

    const fetchSender = async (senderId: string) => {
      try {
        const { data: senderData, error: senderError } = await supabase
          .from("employees")
          .select("user_uuid, name, is_online")
          .eq("user_uuid", senderId)
          .single();

        if (senderError) {
          console.error("Error fetching sender:", senderError?.message);
        }

        return senderData?.name || senderId;
      } catch (error) {
        console.error("Error in fetchSender:", error);
      }
    };

    const directMessageChannel = client
      .channel("direct-messages", {
        config: {
          broadcast: {
            self: true,
          },
        },
      })
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_messages" },
        async (payload) => {
          try {
            if (payload.new.receiver_id === user.id) {
              const senderName = await fetchSender(payload.new.sender_id);

              // Check if the user is on the chat page
              const isOnChatPage = pathname === "/TGR/crew/chat";

              // Fetch the current chat context from localStorage
              const currentChat = localStorage.getItem("currentChat");

              if (
                !isOnChatPage ||
                document.hidden ||
                currentChat !== payload.new.sender_id
              ) {
                toast(`New message from ${senderName}`, {
                  description: payload.new.message,
                  action: {
                    label: "Okay",
                    onClick: () => {
                      // Acknowledge action
                    },
                  },
                });

                if (Notification.permission === "granted") {
                  new Notification(`New message from ${senderName}`, {
                    body: payload.new.message,
                  });
                }
              }
            }
          } catch (error) {
            console.error("Error handling direct message:", error);
          }
        }
      )
      .subscribe();

    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    return () => {
      directMessageChannel?.unsubscribe();
    };
  }, [user, pathname]);
};

export default useRealtimeNotifications;
