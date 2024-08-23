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
      }
    };

    const handleNewMessage = async (payload: any, isAdminChat = false) => {
      try {
        if (
          (payload.new.receiver_id === user.id || isAdminChat) &&
          payload.new.message.trim() !== ""
        ) {
          const senderName = await fetchSender(payload.new.sender_id);

          // Check if the user is on the chat page
          const isOnChatPage = pathname === "/TGR/crew/chat";

          // Fetch the current chat context from localStorage
          const currentChat = localStorage.getItem("currentChat");

          if (
            !isOnChatPage ||
            document.hidden ||
            (currentChat !== payload.new.sender_id && !isAdminChat)
          ) {
            toast(`New message from ${senderName}`, {
              description: payload.new.message,
              action: {
                label: "Open",
                onClick: () => {
                  router.push(
                    `/TGR/crew/chat${isAdminChat ? "" : `?dm=${payload.new.sender_id}`}`
                  );
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
          handleNewMessage(payload);
        }
      )
      .subscribe();

    const adminChatChannel = client
      .channel("admin-chat", {
        config: {
          broadcast: {
            self: true,
          },
        },
      })
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        async (payload) => {
          handleNewMessage(payload, true);
        }
      )
      .subscribe();

    return () => {
      directMessageChannel?.unsubscribe();
      adminChatChannel?.unsubscribe();
    };
  }, [user, pathname, router]);
};

export default useRealtimeNotifications;