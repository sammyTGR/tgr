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
