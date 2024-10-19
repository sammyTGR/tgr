"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/utils/supabase/client";

interface UnreadCountsContextType {
  totalUnreadCount: number;
  resetUnreadCounts: () => Promise<void>;
  setTotalUnreadCount: (
    countOrUpdater: number | ((prevCount: number) => number)
  ) => void;
  isChatPage: boolean;
}

const defaultContextValue: UnreadCountsContextType = {
  totalUnreadCount: 0,
  resetUnreadCounts: async () => {},
  setTotalUnreadCount: () => {},
  isChatPage: false,
};

const UnreadCountsContext =
  createContext<UnreadCountsContextType>(defaultContextValue);

export const UnreadCountsProvider: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();
  const isChatPage = pathname === "/TGR/crew/chat";
  const subscriptionsRef = useRef<{ unsubscribe: () => void }[]>([]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: userData, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error.message);
        return;
      }
      if (userData && userData.user) {
        setUser(userData.user);
        // console.log("User set in UnreadCountsProvider:", userData.user);
      }
    };
    fetchUser();
  }, []);

  const fetchUnreadCounts = useCallback(async () => {
    if (!user) {
      // console.log("No user, skipping fetchUnreadCounts");
      return;
    }

    // console.log("Fetching unread counts for user:", user.id);

    // Fetch unread direct messages
    const { data: dmData, error: dmError } = await supabase
      .from("direct_messages")
      .select("sender_id, is_read")
      .eq("receiver_id", user.id)
      .eq("is_read", false);

    // Fetch unread group messages
    const { data: groupData, error: groupError } = await supabase
      .from("group_chat_messages")
      .select("id, group_chat_id, read_by")
      .not("read_by", "cs", `{${user.id}}`);

    if (dmError) {
      console.error("Error fetching unread direct messages:", dmError.message);
    }

    if (groupError) {
      console.error(
        "Error fetching unread group messages:",
        groupError.message
      );
    }

    let totalUnread = (dmData?.length || 0) + (groupData?.length || 0);
    // console.log("Total unread messages:", totalUnread);
    setTotalUnreadCount(totalUnread);
  }, [user]);

  const resetUnreadCounts = useCallback(async () => {
    if (!user) {
      // console.log("No user, skipping resetUnreadCounts");
      return;
    }

    // console.log("Resetting unread counts for user:", user.id);

    // Reset unread direct messages
    const { error: dmError } = await supabase
      .from("direct_messages")
      .update({ is_read: true })
      .eq("receiver_id", user.id)
      .eq("is_read", false);

    if (dmError) {
      console.error("Error resetting unread direct messages:", dmError.message);
    }

    // Reset unread group messages
    const { data: groupData, error: groupFetchError } = await supabase
      .from("group_chat_messages")
      .select("id, read_by")
      .not("read_by", "cs", `{${user.id}}`);

    if (groupFetchError) {
      console.error(
        "Error fetching unread group messages:",
        groupFetchError.message
      );
    } else if (groupData) {
      for (const message of groupData) {
        const updatedReadBy = [...(message.read_by || []), user.id];
        const { error: groupUpdateError } = await supabase
          .from("group_chat_messages")
          .update({ read_by: updatedReadBy })
          .eq("id", message.id);

        if (groupUpdateError) {
          console.error(
            "Error updating group message:",
            groupUpdateError.message
          );
        }
      }
    }

    // console.log("Unread counts reset, setting total to 0");
    setTotalUnreadCount(0);
  }, [user]);

  useEffect(() => {
    if (user) {
      // console.log("User available, setting up subscriptions");
      if (isChatPage) {
        // console.log("On chat page, resetting unread counts");
        resetUnreadCounts();
      } else {
        // console.log("Not on chat page, fetching unread counts");
        fetchUnreadCounts();
      }

      const setupSubscriptions = async () => {
        try {
          const { data: groupChats, error } = await supabase
            .from("group_chats")
            .select("id")
            .contains("users", [user.id]);

          if (error) {
            throw new Error();
            // `Error fetching user's group chats: ${error.message}`
          }

          const userGroupChats = groupChats.map((chat) => chat.id);
          // console.log("User group chats:", userGroupChats);

          const groupChatMessageSubscription = supabase
            .channel("group_chat_messages")
            .on(
              "postgres_changes",
              {
                event: "INSERT",
                schema: "public",
                table: "group_chat_messages",
              },
              (payload) => {
                // console.log("New group chat message:", payload);
                if (
                  payload.new.sender_id !== user.id &&
                  (!payload.new.read_by ||
                    !payload.new.read_by.includes(user.id)) &&
                  userGroupChats.includes(payload.new.group_chat_id)
                ) {
                  // console.log("Incrementing unread count for group message");
                  setTotalUnreadCount((prev) => prev + 1);
                }
              }
            )
            .subscribe((status) => {
              // console.log("Group chat subscription status:", status);
            });

          const directMessageSubscription = supabase
            .channel("direct_messages")
            .on(
              "postgres_changes",
              { event: "INSERT", schema: "public", table: "direct_messages" },
              (payload) => {
                // console.log("New direct message:", payload);
                if (
                  payload.new.receiver_id === user.id &&
                  !payload.new.is_read
                ) {
                  // console.log("Incrementing unread count for direct message");
                  setTotalUnreadCount((prev) => prev + 1);
                }
              }
            )
            .subscribe((status) => {
              // console.log("Direct message subscription status:", status);
            });

          subscriptionsRef.current = [
            groupChatMessageSubscription,
            directMessageSubscription,
          ];
        } catch (error) {
          // console.error("Error setting up subscriptions:", error);
        }
      };

      setupSubscriptions();

      return () => {
        // console.log("Cleaning up subscriptions");
        subscriptionsRef.current.forEach((subscription) =>
          subscription.unsubscribe()
        );
      };
    }
  }, [user, isChatPage, fetchUnreadCounts, resetUnreadCounts]);

  const updateTotalUnreadCount = useCallback(
    (countOrUpdater: number | ((prevCount: number) => number)) => {
      if (typeof countOrUpdater === "function") {
        setTotalUnreadCount((prevCount) => {
          const newCount = countOrUpdater(prevCount);
          // console.log("Updating total unread count:", newCount);
          return newCount;
        });
      } else {
        // console.log("Setting total unread count:", countOrUpdater);
        setTotalUnreadCount(countOrUpdater);
      }
    },
    []
  );

  // console.log("Current total unread count:", totalUnreadCount);

  return (
    <UnreadCountsContext.Provider
      value={{
        totalUnreadCount,
        resetUnreadCounts,
        setTotalUnreadCount: updateTotalUnreadCount,
        isChatPage,
      }}
    >
      {children}
    </UnreadCountsContext.Provider>
  );
};

export const useUnreadCounts = () => {
  return useContext(UnreadCountsContext);
};
