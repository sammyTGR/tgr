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

    const fetchGroupChatName = async (groupChatId: number) => {
      try {
        const { data, error } = await supabase
          .from("group_chats")
          .select("name")
          .eq("id", groupChatId)
          .single();

        if (error) throw error;
        return data.name;
      } catch (error) {
        console.error("Error fetching group chat name:", error);
        return "Group Chat";
      }
    };

    const handleNewMessage = async (payload: any, isAdminChat = false, isGroupChat = false) => {
      try {
        if (
          ((payload.new.receiver_id === user.id || isAdminChat || (isGroupChat && payload.new.sender_id !== user.id)) &&
          payload.new.message.trim() !== "")
        ) {
          const senderName = await fetchSender(payload.new.sender_id);
          const chatName = isGroupChat ? await fetchGroupChatName(payload.new.group_chat_id) : senderName;

          // Check if the user is on the chat page
          const isOnChatPage = pathname === "/TGR/crew/chat";

          // Fetch the current chat context from localStorage
          const currentChat = localStorage.getItem("currentChat");

          if (
            !isOnChatPage ||
            document.hidden ||
            (currentChat !== (isGroupChat ? `group_${payload.new.group_chat_id}` : payload.new.sender_id) && !isAdminChat)
          ) {
            toast(`New message in ${isGroupChat ? chatName : `from ${chatName}`}`, {
              description: payload.new.message,
              action: {
                label: "Open",
                onClick: () => {
                  router.push(
                    `/TGR/crew/chat${isAdminChat ? "" : isGroupChat ? `?group=${payload.new.group_chat_id}` : `?dm=${payload.new.sender_id}`}`
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
      .channel("direct-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_messages" },
        async (payload) => {
          handleNewMessage(payload);
        }
      )
      .subscribe();

    const adminChatChannel = client
      .channel("admin-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        async (payload) => {
          handleNewMessage(payload, true);
        }
      )
      .subscribe();

    const groupChatChannel = client
      .channel("group-chat-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "group_chat_messages" },
        async (payload) => {
          handleNewMessage(payload, false, true);
        }
      )
      .subscribe();

    return () => {
      directMessageChannel?.unsubscribe();
      adminChatChannel?.unsubscribe();
      groupChatChannel?.unsubscribe();
    };
  }, [user, pathname, router]);
};


export default useRealtimeNotifications;