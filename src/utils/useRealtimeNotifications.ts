"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/utils/supabase/client";
import { useRole } from "@/context/RoleContext";
import { usePathname, useRouter } from "next/navigation";
// import { useUnreadCounts } from "@/components/UnreadCountsContext";

const useRealtimeNotifications = () => {
  const { user } = useRole();
  const pathname = usePathname();
  const router = useRouter();
  const [userGroupChats, setUserGroupChats] = useState<number[]>([]);
  // const { setTotalUnreadCount } = useUnreadCounts();

  // const fetchUserGroupChats = useCallback(async () => {
  //   if (!user) return [];
  //   const { data, error } = await supabase
  //     .from("group_chats")
  //     .select("id")
  //     .contains("users", [user.id]);

  //   if (error) {
  //     return [];
  //   }
  //   const chatIds = data.map((chat) => chat.id);
  //   setUserGroupChats(chatIds); // Update state manually
  //   return chatIds;
  // }, [user]);

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

    const handleNewMessage = async (
      payload: any,
      isAdminChat = false,
      isGroupChat = false
    ) => {
      try {
        let shouldNotify = false;

        if (isAdminChat) {
          shouldNotify = true;
        } else if (isGroupChat) {
          shouldNotify = payload.new.sender_id !== user.id;
        } else {
          // Direct message
          shouldNotify = payload.new.receiver_id === user.id;
        }

        if (shouldNotify && payload.new.message.trim() !== "") {
          const senderName = await fetchSender(payload.new.sender_id);
          const chatName = isGroupChat
            ? "Group Chat"
            : senderName;

          // Check if the user is on the chat page
          const isOnChatPage = pathname === "/TGR/crew/chat";

          // Fetch the current chat context from localStorage
          const currentChat = localStorage.getItem("currentChat");
          const isChatActive = localStorage.getItem("isChatActive") === "true";

          console.log("Notification context:", {
            isOnChatPage,
            currentChat,
            isGroupChat,
            chatId: isGroupChat
              ? `group_${payload.new.group_chat_id}`
              : payload.new.sender_id,
            isChatActive,
          });

          if (
            !isOnChatPage ||
            document.hidden ||
            !isChatActive ||
            (currentChat !==
              (isGroupChat
                ? `group_${payload.new.group_chat_id}`
                : payload.new.sender_id) &&
              !isAdminChat)
          ) {
            console.log("Showing toast notification");
            toast(
              `New message in ${isGroupChat ? chatName : `from ${chatName}`}`,
              {
                description: payload.new.message,
                action: {
                  label: "Open",
                  onClick: () => {
                    router.push(
                      `/TGR/crew/chat${
                        isAdminChat
                          ? ""
                          : isGroupChat
                          ? `?group=${payload.new.group_chat_id}`
                          : `?dm=${payload.new.sender_id}`
                      }`
                    );
                  },
                },
              }
            );
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

    const groupChatChannel = client
      .channel("group-chat-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_chat_messages",
          filter: `group_chat_id=in.(${userGroupChats.join(",")})`,
        },
        async (payload) => {
          handleNewMessage(payload, false, true);
        }
      )
      .subscribe();

    const groupChatCreationChannel = client
      .channel("group-chat-creation")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_chats",
        },
        async (payload) => {
          if (payload.new.users.includes(user.id)) {
              // fetchUserGroupChats().then((chats) => {
              //   setUserGroupChats(chats);
              // });

            // Fetch the group chat name
            // const groupChatName = await fetchGroupChatName(payload.new.id);

            // Fetch the creator's name
            const creatorName = await fetchSender(payload.new.created_by);

            // Show notification only to the members of the new group chat
            if (user.id !== payload.new.created_by) {
              toast(`New Group Chat Created: ${payload.new.name}`, {
                description: `${creatorName} has added you to a new group chat.`,
                action: {
                  label: "Open",
                  onClick: () => {
                    router.push(`/TGR/crew/chat?group=${payload.new.id}`);
                  },
                },
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      directMessageChannel?.unsubscribe();
      groupChatChannel?.unsubscribe();
      groupChatCreationChannel?.unsubscribe();
    };
  }, [user, pathname, router, userGroupChats]);

  return { }; // Return the function so it can be called externally
};

export default useRealtimeNotifications;