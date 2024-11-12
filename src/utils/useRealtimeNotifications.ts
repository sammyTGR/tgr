"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/utils/supabase/client";
import { useRole } from "@/context/RoleContext";
import { usePathname, useRouter } from "next/navigation";

const useRealtimeNotifications = () => {
  const { user } = useRole();
  const pathname = usePathname();
  const router = useRouter();

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
        return senderId;
      }
    };

    const handleNewMessage = async (payload: any, isAdminChat = false) => {
      try {
        let shouldNotify = false;

        if (isAdminChat) {
          shouldNotify = true;
        } else {
          // Direct message
          shouldNotify = payload.new.receiver_id === user.id;
        }

        if (shouldNotify && payload.new.message.trim() !== "") {
          const senderName = await fetchSender(payload.new.sender_id);
          const chatName = senderName;

          // Check if the user is on the chat page
          const isOnChatPage = pathname === "/TGR/crew/chat";

          // Fetch the current chat context from localStorage
          const currentChat = localStorage.getItem("currentChat");
          const isChatActive = localStorage.getItem("isChatActive") === "true";

          // console.log("Notification context:", {
          //   isOnChatPage,
          //   currentChat,
          //   chatId: payload.new.sender_id,
          //   isChatActive,
          // });

          if (
            !isOnChatPage ||
            document.hidden ||
            !isChatActive ||
            (currentChat !== payload.new.sender_id && !isAdminChat)
          ) {
            // console.log("Showing toast notification");
            toast(`New message from ${chatName}`, {
              description: payload.new.message,
              action: {
                label: "Open",
                onClick: () => {
                  router.push(`/TGR/crew/chat?dm=${payload.new.sender_id}`);
                },
              },
            });
          }
        }
      } catch (error) {
        console.error("Error handling message:", error);
      }
    };

    const directMessageChannel = client
      .channel("direct-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload) => {
          handleNewMessage(payload);
        }
      )
      .subscribe();

    return () => {
      directMessageChannel?.unsubscribe();
    };
  }, [user, pathname, router]);

  return {}; // Return the function so it can be called externally
};

export default useRealtimeNotifications;
