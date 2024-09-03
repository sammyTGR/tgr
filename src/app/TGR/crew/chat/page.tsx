"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { useRole } from "@/context/RoleContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrashIcon,
  Pencil1Icon,
  PlusIcon,
  ArrowUpIcon,
  DotFilledIcon,
  ChatBubbleIcon,
  CrossCircledIcon,
  DotsVerticalIcon,
} from "@radix-ui/react-icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/utils/supabase/client";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { debounce } from "lodash";
import { toast } from "sonner";

const title = "Ops Chat";

interface ChatMessage {
  group_chat_id?: number;
  id: number;
  user_name: string;
  message: string;
  created_at: string;
  user_id: string;
  is_read: boolean;
  receiver_id?: string;
  sender_id?: string;
  read_by?: string[];
}

interface User {
  id: string;
  name: string;
  is_online: boolean;
}

interface GroupChat {
  id: string;
  name: string;
  is_online: boolean;
  users: Record<string, string>;
  created_by: string;
}

interface GroupChatPayload {
  new?: {
    id: number;
    created_by: string;
    name: string;
    users: string[];
    created_at: string;
  };
  old?: {
    id: number;
    created_by: string;
    name: string;
    users: string[];
    created_at: string;
  };
  eventType: "INSERT" | "UPDATE" | "DELETE";
}

type DmUser = User | GroupChat;

function ChatContent() {
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [dmUsers, setDmUsers] = useState<(User | GroupChat)[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null); // Change initial state to null
  const { user, role, loading } = useRole();
  const [username, setUsername] = useState<string>("");
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingMessage, setEditingMessage] = useState<string>("");
  const [showUserList, setShowUserList] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [unreadStatus, setUnreadStatus] = useState<Record<string, boolean>>({});
  const channel = useRef<RealtimeChannel | null>(null);
  const presenceChannel = useRef<RealtimeChannel | null>(null);
  const groupChatChannelRef = useRef<RealtimeChannel | null>(null);
  const searchParams = useSearchParams();
  const dm = searchParams ? searchParams.get("dm") : null;
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [groupChatId, setGroupChatId] = useState<number | null>(null);
  const [chatType, setChatType] = useState<"dm" | "group">("dm");
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [isChatActive, setIsChatActive] = useState(true);
  const [showOptions, setShowOptions] = useState<string | null>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const [showDMOptions, setShowDMOptions] = useState<string | null>(null);
  const [showGroupOptions, setShowGroupOptions] = useState<string | null>(null);
  const debouncedSetMessages = useCallback(debounce(setMessages, 300), [
    setMessages,
  ]);
  const userDataRef = useRef<{ user: User | null }>({ user: null });
  const directMessageChannelRef = useRef<RealtimeChannel | null>(null);
  const debouncedScrollToBottom = useCallback(
    debounce(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 300),
    []
  );

  const setMessagesWithoutDuplicates = useCallback(
    (newMessages: ChatMessage[]) => {
      setMessages((prevMessages) => {
        const uniqueMessages = newMessages.filter(
          (newMsg) =>
            !prevMessages.some(
              (prevMsg) =>
                prevMsg.id === newMsg.id &&
                prevMsg.group_chat_id === newMsg.group_chat_id
            )
        );
        return [...prevMessages, ...uniqueMessages];
      });
    },
    []
  );

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Function to handle chat type selection
  const handleChatTypeSelection = (type: "dm" | "group") => {
    setChatType(type);
    setSelectedUsers([]);
  };

  const handleUserSelection = (user: User) => {
    if (chatType === "dm") {
      setSelectedUsers([user]); // Only allow one user for DM
    } else {
      setSelectedUsers((prevSelected) =>
        prevSelected.some((u) => u.id === user.id)
          ? prevSelected.filter((u) => u.id !== user.id)
          : [...prevSelected, user]
      );
    }
  };

  const fetchGroupChats = async () => {
    if (!user || !user.id) {
      console.error("User or user.id is not available");
      return;
    }

    const { data: groupChats, error } = await supabase
      .from("group_chats")
      .select("*")
      .filter("users", "cs", `{${user.id}}`);

    if (error) {
      console.error("Error fetching group chats:", error.message);
    } else if (groupChats) {
      setDmUsers((prev) => {
        const existingGroupChatIds = prev
          .filter((u) => u.id.startsWith("group_"))
          .map((u) => u.id);

        const newGroupChats = groupChats
          .filter((chat) => !existingGroupChatIds.includes(`group_${chat.id}`))
          .map((chat) => ({
            id: `group_${chat.id}`,
            name: chat.name,
            is_online: true,
            users: chat.users,
            created_by: chat.created_by,
          }));

        return [...prev, ...newGroupChats];
      });
    }
  };

  useEffect(() => {
    if (dmUsers.length > 0 && selectedChat) {
      handleChatClick(selectedChat);
    }
  }, [dmUsers, selectedChat]);

  useEffect(() => {
    if (user && user.id) {
      fetchGroupChats();

      const handleFocus = () => {
        fetchGroupChats();
      };

      window.addEventListener("focus", handleFocus);

      return () => {
        window.removeEventListener("focus", handleFocus);
      };
    }
  }, [user]);

  const handleGroupChatInsert = async (payload: GroupChatPayload) => {
    const newGroupChat = payload.new;

    // Check if the current user is part of this group chat
    if (user && newGroupChat?.users.includes(user.id)) {
      const validUserIds = newGroupChat.users.filter((id) => id !== null);
      const { data: usersData, error: usersError } = await supabase
        .from("employees")
        .select("user_uuid, name")
        .in("user_uuid", validUserIds);

      if (usersError) {
        console.error("Error fetching group chat users:", usersError.message);
        return;
      }

      if (usersData) {
        const userMap: Record<string, string> = usersData.reduce(
          (acc, user) => {
            acc[user.user_uuid] = user.name;
            return acc;
          },
          {} as Record<string, string>
        );

        setDmUsers((prev) => {
          const existingGroupChat = prev.find(
            (chat) => chat.id === `group_${newGroupChat.id}`
          );
          if (existingGroupChat) {
            return prev;
          }

          return [
            ...prev,
            {
              id: `group_${newGroupChat.id}`,
              name: newGroupChat.name,
              is_online: true,
              users: userMap,
              created_by: newGroupChat.created_by,
            },
          ];
        });
      }
    }
  };

  const handleGroupChatUpdate = async (payload: GroupChatPayload) => {
    const updatedGroupChat = payload.new;

    if (user && updatedGroupChat?.users.includes(user.id)) {
      const { data: groupChatData, error: groupChatError } = await supabase
        .from("group_chats")
        .select("*")
        .eq("id", updatedGroupChat.id)
        .single();

      if (groupChatError) {
        console.error(
          "Error fetching updated group chat:",
          groupChatError.message
        );
        return;
      }

      if (groupChatData) {
        setDmUsers((prev) => {
          const existingIndex = prev.findIndex(
            (chat) => chat.id === `group_${groupChatData.id}`
          );
          if (existingIndex !== -1) {
            // Update existing group chat
            const updatedDmUsers = [...prev];
            updatedDmUsers[existingIndex] = {
              ...updatedDmUsers[existingIndex],
              name: groupChatData.name,
              users: groupChatData.users,
            };
            return updatedDmUsers;
          } else {
            // Add new group chat
            return [
              ...prev,
              {
                id: `group_${groupChatData.id}`,
                name: groupChatData.name,
                is_online: true,
                users: groupChatData.users,
                created_by: groupChatData.created_by,
              },
            ];
          }
        });
      }
    }
  };

  const handleGroupChatDelete = async (payload: GroupChatPayload) => {
    const deletedGroupChatId = payload.old?.id;

    if (!deletedGroupChatId || !user) {
      console.log("Invalid payload or user not available");
      return;
    }

    setDmUsers((prev) => {
      const updatedDmUsers = prev.filter(
        (chat) => chat.id !== `group_${deletedGroupChatId}`
      );

      if (updatedDmUsers.length < prev.length) {
        console.log(`Group chat ${deletedGroupChatId} removed from dmUsers`);
      } else {
        console.log(`Group chat ${deletedGroupChatId} not found in dmUsers`);
      }

      return updatedDmUsers;
    });

    // If the deleted chat was the currently selected chat, clear the selection
    if (selectedChat === `group_${deletedGroupChatId}`) {
      setSelectedChat(null);
      setMessages([]); // Clear the messages
      console.log(
        `Cleared selection and messages for deleted group chat ${deletedGroupChatId}`
      );
    }

    console.log(`Group chat ${deletedGroupChatId} deletion handled`);
  };

  const handleEditGroupName = async (groupId: string, newName: string) => {
    const groupChatId = parseInt(groupId.split("_")[1], 10);
    const { error } = await supabase
      .from("group_chats")
      .update({ name: newName })
      .eq("id", groupChatId);

    if (error) {
      console.error("Error updating group name:", error.message);
    } else {
      setDmUsers((prev) =>
        prev.map((u) => (u.id === groupId ? { ...u, name: newName } : u))
      );
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        optionsRef.current &&
        !optionsRef.current.contains(event.target as Node)
      ) {
        setShowOptions(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setIsChatActive(true);

    // Dispatch a custom event to notify the header that the chat is active
    window.dispatchEvent(
      new CustomEvent("chatActiveChange", { detail: { isActive: true } })
    );

    return () => {
      setIsChatActive(false);
      // Dispatch a custom event to notify the header that the chat is inactive
      window.dispatchEvent(
        new CustomEvent("chatActiveChange", { detail: { isActive: false } })
      );
    };
  }, []);

  useEffect(() => {
    const fetchAllChats = async () => {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError) {
        console.error("Error fetching user:", userError.message);
        return;
      }

      if (userData?.user) {
        userDataRef.current = {
          user: {
            id: userData.user.id,
            name: "",
            is_online: false,
          },
        };

        const { data: userDetails, error: userDetailsError } = await supabase
          .from("employees")
          .select("user_uuid, name, is_online")
          .eq("user_uuid", userData.user.id)
          .single();

        if (userDetailsError) {
          console.error("Error fetching username:", userDetailsError.message);
        } else if (userDetails) {
          setUsername(userDetails.name);
          if (userDataRef.current.user) {
            userDataRef.current.user.name = userDetails.name;
            userDataRef.current.user.is_online = userDetails.is_online;
          }
          await supabase
            .from("employees")
            .update({ is_online: true })
            .eq("user_uuid", userData.user.id);
        }
      }

      // Fetch Direct Messages
      const { data: dmUsersData, error: dmUsersError } = await supabase
        .from("direct_messages")
        .select("receiver_id, sender_id, user_name")
        .or(
          `receiver_id.eq.${userData?.user?.id},sender_id.eq.${userData?.user?.id}`
        );

      if (dmUsersError) {
        console.error("Error fetching direct messages:", dmUsersError.message);
      } else {
        const userIds = dmUsersData.map((dm) =>
          dm.receiver_id === userData?.user?.id ? dm.sender_id : dm.receiver_id
        );
        const { data: dmUsersDetails, error: dmUsersDetailsError } =
          await supabase
            .from("employees")
            .select("user_uuid, name, is_online")
            .in("user_uuid", userIds);

        if (dmUsersDetails) {
          setDmUsers((prev) => {
            const newUsers = dmUsersDetails.map((user) => ({
              id: user.user_uuid,
              is_online: user.is_online,
              name: user.name,
            }));

            // Filter out duplicates
            const uniqueUsers = newUsers.filter(
              (newUser) =>
                !prev.some((existingUser) => existingUser.id === newUser.id)
            );

            return [...prev, ...uniqueUsers];
          });
        } else {
          console.error(
            "Error fetching DM users:",
            dmUsersDetailsError?.message
          );
        }
      }

      // Fetch Group Chats
      const { data: groupChats, error: groupChatsError } = await supabase
        .from("group_chats")
        .select("*")
        .filter("users", "cs", `{${userData?.user?.id}}`);

      if (groupChatsError) {
        console.error("Error fetching group chats:", groupChatsError.message);
      } else if (groupChats && groupChats.length > 0) {
        const groupChatUsers = await Promise.all(
          groupChats.map(async (chat) => {
            const { data: usersData, error: usersError } = await supabase
              .from("employees")
              .select("user_uuid, name")
              .in("user_uuid", chat.users);

            if (usersError) {
              console.error(
                "Error fetching group chat users:",
                usersError.message
              );
              return null;
            }

            const userMap = usersData.reduce<Record<string, string>>(
              (acc, user) => {
                acc[user.user_uuid] = user.name;
                return acc;
              },
              {}
            );

            return {
              id: `group_${chat.id}`,
              name: chat.name,
              is_online: true,
              users: userMap,
              created_by: chat.created_by,
            } as GroupChat;
          })
        );

        setDmUsers((prev) => [
          ...prev,
          ...groupChatUsers.filter((chat): chat is GroupChat => chat !== null),
        ]);

        // Fetch initial messages for all group chats
        for (const groupChat of groupChats) {
          const { data: groupMessages, error: groupMessagesError } =
            await supabase
              .from("group_chat_messages")
              .select("*")
              .eq("group_chat_id", groupChat.id)
              .order("created_at", { ascending: true });

          if (groupMessagesError) {
            console.error(
              "Error fetching group messages:",
              groupMessagesError.message
            );
          } else if (groupMessages) {
            setMessagesWithoutDuplicates(groupMessages);
          }
        }
      }

      // Fetch other users (admins, super admins, etc.)
      const { data: usersData, error: usersError } = await supabase
        .from("employees")
        .select("user_uuid, name, is_online")
        .or(
          "role.eq.admin,role.eq.super admin,role.eq.gunsmith,role.eq.auditor"
        );

      if (usersData) {
        setUsers(
          usersData.map((user) => ({
            id: user.user_uuid,
            name: user.name,
            is_online: user.is_online,
          }))
        );
      } else {
        console.error("Error fetching users:", usersError?.message);
      }

      // Set initial selected chat
      setDmUsers((prev) => {
        if (prev.length > 0) {
          setSelectedChat(prev[0].id);
        }
        return prev;
      });
    };

    if (user && user.id) {
      fetchAllChats();
    }
    scrollToBottom();

    // Set up isChatActive and event listeners
    setIsChatActive(true);
    localStorage.setItem("isChatActive", "true");
    window.dispatchEvent(
      new CustomEvent("chatActiveChange", { detail: { isActive: true } })
    );

    return () => {
      setIsChatActive(false);
      localStorage.setItem("isChatActive", "false");
      window.dispatchEvent(
        new CustomEvent("chatActiveChange", { detail: { isActive: false } })
      );
    };
  }, [user, setMessagesWithoutDuplicates]);

  useEffect(() => {
    const client = supabase;

    const setupSubscriptions = () => {
      if (!channel.current) {
        channel.current = client.channel("chat-room", {
          config: {
            broadcast: {
              self: true,
            },
          },
        });

        channel.current
          .on<ChatMessage>(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "chat_messages" },
            (payload) => {
              setMessages((prev) => [...prev, payload.new]);
            }
          )
          .on<ChatMessage>(
            "postgres_changes",
            { event: "DELETE", schema: "public", table: "chat_messages" },
            (payload) => {
              setMessages((prev) =>
                prev.filter((msg) => msg.id !== payload.old.id)
              );
            }
          )
          .on<ChatMessage>(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "chat_messages" },
            (payload) => {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === payload.new.id ? payload.new : msg
                )
              );
            }
          )
          .subscribe();
      }

      if (!directMessageChannelRef.current) {
        directMessageChannelRef.current = client
          .channel("direct-messages", {
            config: {
              broadcast: {
                self: true,
              },
            },
          })
          .on<ChatMessage>(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "direct_messages" },
            async (payload) => {
              setMessages((prev) => {
                // Check if the message already exists in the state
                if (prev.some((msg) => msg.id === payload.new.id)) {
                  return prev;
                }
                return [...prev, payload.new];
              });

              if (payload.new.receiver_id === userDataRef.current?.user?.id) {
                const senderId = payload.new.sender_id;

                if (typeof senderId === "string") {
                  setUnreadStatus((prevStatus) => ({
                    ...prevStatus,
                    [senderId]: true,
                  }));

                  if (!dmUsers.some((u) => u.id === senderId)) {
                    await fetchSender(senderId);
                  }
                }
              }
            }
          )
          .on<ChatMessage>(
            "postgres_changes",
            { event: "DELETE", schema: "public", table: "direct_messages" },
            (payload) => {
              setMessages((prev) =>
                prev.filter((msg) => msg.id !== payload.old.id)
              );
            }
          )
          .on<ChatMessage>(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "direct_messages" },
            (payload) => {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === payload.new.id ? payload.new : msg
                )
              );
            }
          )
          .subscribe();
      }

      if (!presenceChannel.current) {
        presenceChannel.current = client
          .channel("presence-channel")
          .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "employees" },
            (payload) => {
              const updatedUser = payload.new;
              setUsers((prevUsers) =>
                prevUsers.map((user) =>
                  user.id === updatedUser.user_uuid
                    ? { ...user, is_online: updatedUser.is_online }
                    : user
                )
              );
            }
          )
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "employees" },
            (payload) => {
              const newUser = payload.new;
              setUsers((prevUsers) => [
                ...prevUsers,
                {
                  id: newUser.user_uuid,
                  name: newUser.name,
                  is_online: newUser.is_online,
                },
              ]);
            }
          )
          .on(
            "postgres_changes",
            { event: "DELETE", schema: "public", table: "employees" },
            (payload) => {
              const deletedUser = payload.old;
              setUsers((prevUsers) =>
                prevUsers.filter((user) => user.id !== deletedUser.user_uuid)
              );
            }
          )
          .subscribe();
      }
    };

    if (!groupChatChannelRef.current) {
      groupChatChannelRef.current = client
        .channel("group-chats")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "group_chats" },
          (payload) => {
            const newGroupChat = payload.new;
            handleGroupChatInsert({ new: newGroupChat } as GroupChatPayload);
          }
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "group_chats" },
          (payload) => {
            const updatedGroupChat = payload.new;
            handleGroupChatUpdate({
              new: updatedGroupChat,
            } as GroupChatPayload);
          }
        )
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "group_chats" },
          (payload) => {
            const deletedGroupChat = payload.old;
            handleGroupChatDelete({
              old: deletedGroupChat,
            } as GroupChatPayload);
          }
        )
        .subscribe();
    }

    setupSubscriptions();

    return () => {
      channel.current?.unsubscribe();
      channel.current = null;
      presenceChannel.current?.unsubscribe();
      presenceChannel.current = null;
      directMessageChannelRef.current?.unsubscribe();
      directMessageChannelRef.current = null;
      groupChatChannelRef.current?.unsubscribe();
      groupChatChannelRef.current = null;
    };
  }, [dmUsers, unreadStatus, user]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Update the onSend function to include these changes
  const onSend = async () => {
    if (
      !channel.current ||
      message.trim().length === 0 ||
      selectedChat === null
    ) {
      console.warn("Cannot send message:", {
        message,
        selectedChat,
      });
      return;
    }

    const client = supabase;

    const commonMessageData = {
      message,
      sender_id: user.id,
      created_at: new Date().toISOString(),
      is_read: false,
      receiver_id: selectedChat !== "Admin Chat" ? selectedChat : null,
      read_by: [user.id], // Mark the message as read by the sender immediately
    };

    let insertData;
    let tableName;

    if (selectedChat === "Admin Chat") {
      insertData = {
        ...commonMessageData,
        user_id: user.id, // Only include user_id for chat_messages
        user_name: user.name,
      };
      tableName = "chat_messages";
    } else if (selectedChat.startsWith("group_")) {
      insertData = {
        group_chat_id: parseInt(selectedChat.split("_")[1], 10),
        ...commonMessageData,
      };
      tableName = "group_chat_messages";
    } else {
      insertData = {
        ...commonMessageData,
        user_name: user.name,
      };
      tableName = "direct_messages";
    }

    const { data, error } = await client.from(tableName).insert([insertData]);

    if (error) {
      console.error("Error inserting message:", error.message);
      return;
    }

    if (data) {
      const newMessage = data[0];
      setMessagesWithoutDuplicates([...messages, data[0]]);
      setMessages((prevMessages) => [...prevMessages, data[0]]);
      // Clear the message input
      setMessage("");
      scrollToBottom();
    }

    // Clear the message input
    setMessage("");
    scrollToBottom(); // Scroll to the bottom after sending a message
  };

  const onDelete = async (id: number) => {
    if (selectedChat === null) {
      console.error("No chat selected");
      return;
    }

    const client = supabase;
    let tableName: string;
    let error;

    if (selectedChat === "Admin Chat") {
      tableName = "chat_messages";
    } else if (selectedChat.startsWith("group_")) {
      tableName = "group_chat_messages";
    } else {
      tableName = "direct_messages";
    }

    ({ error } = await client.from(tableName).delete().eq("id", id));

    if (error) {
      console.error("Error deleting message:", error.message);
      return;
    }

    // Immediately update the local state
    setMessages((prev) => prev.filter((msg) => msg.id !== id));

    // If it's a group chat, we might need to update the group_chats table as well
    if (selectedChat.startsWith("group_")) {
      const groupId = parseInt(selectedChat.split("_")[1], 10);
      const { error: groupError } = await client
        .from("group_chats")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", groupId);

      if (groupError) {
        console.error("Error updating group chat:", groupError.message);
      }
    }
  };

  const onEdit = (id: number, currentMessage: string) => {
    setEditingMessageId(id);
    setEditingMessage(currentMessage);
  };

  const onUpdate = async () => {
    if (!editingMessageId) return;

    const client = supabase;

    const { error } = await client
      .from(selectedChat === "Admin Chat" ? "chat_messages" : "direct_messages")
      .update({ message: editingMessage })
      .eq("id", editingMessageId);

    if (error) {
      console.error("Error updating message:", error.message);
      return;
    }

    setEditingMessageId(null);
    setEditingMessage("");
  };

  const deleteAdminChat = async () => {
    const client = supabase;

    const { error } = await client
      .from("chat_messages")
      .delete()
      .is("receiver_id", null);

    if (error) {
      console.error("Error deleting Admin Chat messages:", error.message);
      return;
    }
  };

  const startDirectMessage = async (receiver: User) => {
    if (dmUsers.some((u) => u.id === receiver.id)) {
      setSelectedChat(receiver.id);
      setShowUserList(false); // Close the dialog
      return;
    }

    setDmUsers((prev) => [...prev, receiver]);
    setSelectedChat(receiver.id);
    setShowUserList(false); // Close the dialog
    setSelectedUsers([]); // Clear selected users
  };

  const startGroupChat = async (receivers: User[]) => {
    if (receivers.length < 2) {
      console.error("Group chat requires at least two members.");
      return;
    }

    const receiverIds = receivers.map((u) => u.id);
    const groupChatName = receivers.map((u) => u.name).join(", ");
    setShowUserList(false); // Close the dialog

    const { data, error } = await supabase
      .from("group_chats")
      .insert([
        {
          created_by: user.id,
          name: `Group chat with ${groupChatName}`,
          users: [user.id, ...receiverIds],
        },
      ])
      .select();

    if (error) {
      console.error("Error creating group chat:", error.message);
      return;
    }

    if (data && data.length > 0) {
      const newGroupChat = data[0];

      // Add the new group chat to dmUsers for the current user
      setDmUsers((prev) => [
        ...prev,
        {
          id: `group_${newGroupChat.id}`,
          name: newGroupChat.name,
          is_online: true,
          users: newGroupChat.users,
        },
      ]);

      // Set the newly created group chat as the selected chat
      setSelectedChat(`group_${newGroupChat.id}`);

      // Fetch initial messages for the new group chat
      const { data: initialMessages, error: messagesError } = await supabase
        .from("group_chat_messages")
        .select("*")
        .eq("group_chat_id", newGroupChat.id)
        .order("created_at", { ascending: true });

      if (messagesError) {
        console.error(
          "Error fetching initial group messages:",
          messagesError.message
        );
      } else {
        setMessagesWithoutDuplicates(initialMessages || []);
      }
    }
    setSelectedUsers([]); // Clear selected users
  };

  const confirmDeleteChat = async () => {
    if (!chatToDelete) return;

    const client = supabase;
    let error;

    if (chatToDelete.startsWith("group_")) {
      const groupId = parseInt(chatToDelete.split("_")[1], 10);
      const groupChat = dmUsers.find((u) => u.id === chatToDelete) as GroupChat;

      if (
        (groupChat && groupChat.created_by === user.id) ||
        role === "admin" ||
        role === "super admin"
      ) {
        // Delete the group chat
        ({ error } = await client
          .from("group_chats")
          .delete()
          .eq("id", groupId));

        if (!error) {
          // Delete all messages associated with this group chat
          ({ error } = await client
            .from("group_chat_messages")
            .delete()
            .eq("group_chat_id", groupId));
        }

        if (!error) {
          // Remove the group chat from dmUsers for the current user
          setDmUsers((prevUsers) =>
            prevUsers.filter((u) => u.id !== chatToDelete)
          );

          // Remove the messages associated with this group chat from the messages state
          setMessages((prevMessages) =>
            prevMessages.filter((msg) => msg.group_chat_id !== groupId)
          );
        }
      } else {
        console.error(
          "User does not have permission to delete this group chat"
        );
      }
    } else {
      // Handle direct message deletion (keep existing logic)
      ({ error } = await client
        .from("direct_messages")
        .delete()
        .or(`sender_id.eq.${chatToDelete},receiver_id.eq.${chatToDelete}`));

      if (!error) {
        setDmUsers((prevUsers) =>
          prevUsers.filter((u) => u.id !== chatToDelete)
        );
        setMessages((prevMessages) =>
          prevMessages.filter(
            (msg) =>
              !(
                msg.sender_id === chatToDelete ||
                msg.receiver_id === chatToDelete
              )
          )
        );
      }
    }

    if (error) {
      console.error("Error deleting chat:", error.message);
    }
    // If the deleted chat was the selected chat, switch to Admin Chat or another default
    if (selectedChat === chatToDelete) {
      setSelectedChat("Admin Chat");
    }

    setShowDeleteAlert(false);
    setChatToDelete(null);
  };

  // Filter messages to avoid duplicates
  const filteredMessages = selectedChat
    ? messages.filter((msg) => {
        if (selectedChat === "Admin Chat") {
          return !msg.receiver_id && !msg.group_chat_id;
        }

        if (selectedChat.startsWith("group_")) {
          return msg.group_chat_id === parseInt(selectedChat.split("_")[1], 10);
        }

        return (
          (msg.sender_id === user.id && msg.receiver_id === selectedChat) ||
          (msg.sender_id === selectedChat && msg.receiver_id === user.id)
        );
      })
    : [];

  const getUserName = (userId: string | undefined) => {
    if (!userId) return "Unknown User";
    const user = users.find((u) => u.id === userId);
    return user ? user.name : userId;
  };

  const fetchSender = async (senderId: string) => {
    const { data: senderData, error: senderError } = await supabase
      .from("employees")
      .select("user_uuid, name, is_online")
      .eq("user_uuid", senderId)
      .single();
    if (senderData) {
      setDmUsers((prev) => {
        if (!prev.some((user) => user.id === senderData.user_uuid)) {
          return [
            ...prev,
            {
              id: senderData.user_uuid,
              name: senderData.name,
              is_online: senderData.is_online,
            },
          ];
        }
        return prev;
      });
      return senderData.name; // Return the sender's name
    } else {
      console.error("Error fetching sender:", senderError?.message);
    }
  };

  const fetchUnreadCounts = useCallback(async () => {
    if (!user) return;

    // Fetch unread direct messages
    const { data: dmData, error: dmError } = await supabase
      .from("direct_messages")
      .select("sender_id, is_read")
      .eq("receiver_id", user.id)
      .eq("is_read", false);

    // Fetch unread group messages
    const { data: groupData, error: groupError } = await supabase
      .from("group_chat_messages")
      .select("group_chat_id, read_by")
      .not("read_by", "cs", `{${user.id}}`);

    // Handle errors
    if (dmError) {
      console.error("Error fetching unread direct messages:", dmError.message);
      return; // Exit if there's an error
    }

    if (groupError) {
      console.error(
        "Error fetching unread group messages:",
        groupError.message
      );
      return; // Exit if there's an error
    }

    const counts: Record<string, number> = {};

    // Count unread direct messages
    if (dmData && dmData.length > 0) {
      dmData.forEach((msg) => {
        counts[msg.sender_id] = (counts[msg.sender_id] || 0) + 1;
      });
    }

    // Count unread group messages
    if (groupData && groupData.length > 0) {
      groupData.forEach((msg) => {
        const groupId = `group_${msg.group_chat_id}`;
        counts[groupId] = (counts[groupId] || 0) + 1;
      });
    }

    setUnreadCounts(counts);

    // Calculate total unread count
    const totalUnreadCount = Object.values(counts).reduce((a, b) => a + b, 0);
    setTotalUnreadCount(totalUnreadCount);
  }, [user, supabase]);

  useEffect(() => {
    if (!user) return;

    const markMessagesAsRead = async () => {
      // Mark direct messages as read
      const { error: dmError } = await supabase
        .from("direct_messages")
        .update({ is_read: true })
        .eq("receiver_id", user.id)
        .eq("is_read", false);

      if (dmError) {
        console.error("Error marking direct messages as read:", dmError);
      }

      // Mark group messages as read
      const { data: groupChats, error: groupChatsError } = await supabase
        .from("group_chats")
        .select("id")
        .contains("users", [user.id]);

      if (groupChatsError) {
        console.error("Error fetching group chats:", groupChatsError);
      } else if (groupChats) {
        for (const chat of groupChats) {
          const { error: groupMsgError } = await supabase
            .from("group_chat_messages")
            .update({
              read_by: supabase.rpc("array_append", {
                arr: "read_by",
                elem: user.id,
              }),
            })
            .eq("group_chat_id", chat.id)
            .not("read_by", "cs", `{${user.id}}`);

          if (groupMsgError) {
            console.error(
              `Error marking messages as read for group ${chat.id}:`,
              groupMsgError
            );
          }
        }
      }

      // Reset unread counts
      setUnreadCounts({});
      setTotalUnreadCount(0);
    };

    localStorage.setItem("isChatActive", "true");
    window.dispatchEvent(new Event("chatActiveChange"));

    markMessagesAsRead();
    fetchUnreadCounts();

    const handleMessageChange = (payload: any, chatType: string) => {
      console.log(`${chatType} message change:`, payload);
      if (payload.eventType === "INSERT") {
        // Check if the message is for the currently selected chat
        const isCurrentChat =
          (chatType === "group" &&
            selectedChat === `group_${payload.new.group_chat_id}`) ||
          (chatType === "direct" &&
            (payload.new.sender_id === selectedChat ||
              payload.new.receiver_id === selectedChat));

        if (isCurrentChat) {
          setMessagesWithoutDuplicates([payload.new]);
        }

        if (payload.new.sender_id !== user.id) {
          const isChatActiveNow =
            localStorage.getItem("isChatActive") === "true";
          if (!isChatActiveNow) {
            if (chatType === "group") {
              const groupChatId = `group_${payload.new.group_chat_id}`;
              setUnreadStatus((prevStatus) => ({
                ...prevStatus,
                [groupChatId]: true,
              }));
              setUnreadCounts((prevCounts) => ({
                ...prevCounts,
                [groupChatId]: (prevCounts[groupChatId] || 0) + 1,
              }));
              setTotalUnreadCount((prev) => prev + 1);
              // If this is a new group chat, add it to dmUsers
              if (!dmUsers.some((u) => u.id === groupChatId)) {
                fetchGroupChatDetails(payload.new.group_chat_id);
              }
            } else if (
              chatType === "direct" &&
              payload.new.receiver_id === user.id
            ) {
              const senderId = payload.new.sender_id;
              if (typeof senderId === "string") {
                setUnreadStatus((prevStatus) => ({
                  ...prevStatus,
                  [senderId]: true,
                }));
                setUnreadCounts((prevCounts) => ({
                  ...prevCounts,
                  [senderId]: (prevCounts[senderId] || 0) + 1,
                }));
                setTotalUnreadCount((prev) => prev + 1);
                if (!dmUsers.some((u) => u.id === senderId)) {
                  fetchSender(senderId);
                }
              }
            }
            fetchUnreadCounts();
          }
        }
      } else if (payload.eventType === "DELETE") {
        setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id));
      } else if (payload.eventType === "UPDATE") {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === payload.new.id ? payload.new : msg))
        );
      }
    };

    const handleGroupChatChange = (payload: any) => {
      console.log("Group chat change:", payload); // For debugging
      if (payload.eventType === "INSERT") {
        handleGroupChatInsert(payload as GroupChatPayload);
      } else if (payload.eventType === "UPDATE") {
        handleGroupChatUpdate(payload as GroupChatPayload);
      } else if (payload.eventType === "DELETE") {
        handleGroupChatDelete(payload as GroupChatPayload);
      }
    };

    const adminChatSubscription = supabase
      .channel("admin_chat_messages")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_messages" },
        (payload) => handleMessageChange(payload, "admin")
      )
      .subscribe();

    const groupChatMessageSubscription = supabase
      .channel("group_chat_messages")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "group_chat_messages" },
        (payload) => handleMessageChange(payload, "group")
      )
      .subscribe();

    const directMessageSubscription = supabase
      .channel("direct_messages")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "direct_messages" },
        (payload) => handleMessageChange(payload, "direct")
      )
      .subscribe();

    return () => {
      localStorage.setItem("isChatActive", "false");
      window.dispatchEvent(new Event("chatActiveChange"));
      adminChatSubscription.unsubscribe();
      groupChatMessageSubscription.unsubscribe();
      directMessageSubscription.unsubscribe();
    };
  }, [
    user,
    dmUsers,
    unreadStatus,
    fetchUnreadCounts,
    setMessagesWithoutDuplicates,
    setMessages,
    setUnreadStatus,
    setUnreadCounts,
    setTotalUnreadCount,
    handleGroupChatInsert, // Add this dependency
    handleGroupChatUpdate,
    selectedChat,
  ]);

  const handleChatClick = useCallback(
    async (chatId: string) => {
      if (!user || !user.id) {
        console.error("User is not defined");
        return;
      }

      // Prevent re-fetching if the selected chat is already the current one
      if (selectedChat === chatId) {
        return;
      }

      // Immediately set the selected chat
      setSelectedChat(chatId);

      // Reset unread status for the selected chat
      if (unreadStatus[chatId]) {
        setUnreadStatus((prevStatus) => ({
          ...prevStatus,
          [chatId]: false,
        }));

        let tableName = chatId.startsWith("group_")
          ? "group_chat_messages"
          : "direct_messages";
        let condition = chatId.startsWith("group_")
          ? `group_chat_id.eq.${chatId.split("_")[1]}`
          : `or(receiver_id.eq.${chatId},sender_id.eq.${chatId})`;

        // Mark messages as read in the database
        const { data: messagesToUpdate, error: fetchError } = await supabase
          .from(tableName)
          .select("id, read_by")
          .or(condition);

        if (fetchError) {
          console.error(
            "Error fetching messages to update:",
            fetchError.message
          );
        } else {
          const messageIdsToUpdate = messagesToUpdate
            .filter((msg) => !msg.read_by || !msg.read_by.includes(user.id))
            .map((msg) => msg.id);

          if (messageIdsToUpdate.length > 0) {
            for (const messageId of messageIdsToUpdate) {
              const { error: updateError } = await supabase
                .from(tableName)
                .update({
                  read_by: [
                    ...(messagesToUpdate.find((msg) => msg.id === messageId)
                      ?.read_by || []),
                    user.id,
                  ],
                })
                .eq("id", messageId);

              if (updateError) {
                console.error(
                  "Error updating messages as read:",
                  updateError.message
                );
              }
            }
          }
        }
      }

      // Ensure the receiver's nav list updates to show the new DM or group chat
      if (!dmUsers.some((u) => u.id === chatId)) {
        if (chatId.startsWith("group_")) {
          const groupChatId = parseInt(chatId.split("_")[1], 10);
          await fetchGroupChatDetails(groupChatId);
        } else {
          const { data: userData, error: userError } = await supabase
            .from("employees")
            .select("user_uuid, name, is_online")
            .eq("user_uuid", chatId)
            .single();

          if (userData) {
            setDmUsers((prev) => [
              ...prev,
              {
                id: userData.user_uuid,
                name: userData.name,
                is_online: userData.is_online,
              },
            ]);
          } else {
            console.error("Error fetching user:", userError?.message);
          }
        }
      }

      // Fetch messages for the selected chat
      let messagesData: any[] = [];
      let messagesError;

      try {
        if (chatId.startsWith("group_")) {
          const groupChatId = parseInt(chatId.split("_")[1], 10);
          const { data, error } = await supabase
            .from("group_chat_messages")
            .select("*")
            .eq("group_chat_id", groupChatId)
            .order("created_at", { ascending: true });
          messagesData = data || [];
          messagesError = error;
        } else {
          const { data, error } = await supabase
            .from("direct_messages")
            .select("*")
            .or(
              `receiver_id.eq.${chatId},sender_id.eq.${chatId},receiver_id.eq.${user.id},sender_id.eq.${user.id}`
            )
            .order("created_at", { ascending: true });
          messagesData = data || [];
          messagesError = error;
        }
      } catch (err) {
        if (err instanceof Error) {
          console.error("Error fetching messages:", err.message);
          messagesError = err;
        } else {
          console.error("Unexpected error:", err);
          messagesError = new Error("Unexpected error occurred");
        }
      }

      if (messagesError) {
        console.error("Error fetching messages:", messagesError.message);
        return;
      }

      setMessagesWithoutDuplicates(messagesData);
      scrollToBottom();

      // Store the current chat ID in localStorage
      localStorage.setItem("currentChat", chatId);
    },
    [
      dmUsers,
      unreadStatus,
      user,
      selectedChat,
      setMessagesWithoutDuplicates,
      setUnreadStatus,
      setSelectedChat,
      scrollToBottom,
    ]
  );
  const fetchGroupChatDetails = async (groupChatId: number) => {
    const { data: groupChat, error } = await supabase
      .from("group_chats")
      .select("*")
      .eq("id", groupChatId)
      .single();

    if (error) {
      console.error("Error fetching group chat details:", error.message);
    } else if (groupChat) {
      const userMap = await fetchGroupChatUsers(groupChat.users);
      setDmUsers((prev) => [
        ...prev,
        {
          id: `group_${groupChat.id}`,
          name: groupChat.name,
          is_online: true,
          users: userMap,
          created_by: groupChat.created_by,
        },
      ]);
    }
  };

  // Add this function if it's not already defined in your component
  const fetchGroupChatUsers = async (userIds: string[]) => {
    const { data: usersData, error } = await supabase
      .from("employees")
      .select("user_uuid, name")
      .in("user_uuid", userIds);

    if (error) {
      console.error("Error fetching group chat users:", error.message);
      return {};
    }

    return usersData.reduce<Record<string, string>>((acc, user) => {
      acc[user.user_uuid] = user.name;
      return acc;
    }, {});
  };

  return (
    <>
      <RoleBasedWrapper
        allowedRoles={["gunsmith", "admin", "super admin", "auditor"]}
      >
        <Card className="flex flex-col h-[80vh] max-h-[80vh] max-w-6xl p-4 mx-auto mb-4 overflow-hidden">
          <CardTitle className="p-4 border-b border-gray-200 dark:border-gray-800">
            <TextGenerateEffect words={title} />
          </CardTitle>
          <CardContent className="flex flex-1 p-0 max-w-full overflow-hidden">
            <div className="flex h-full w-full overflow-hidden">
              <div className="flex-1 flex flex-col max-w-md w-64 border-r border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                  <h2 className="text-lg font-semibold">Messages</h2>
                  <Button variant="ghost" onClick={() => setShowUserList(true)}>
                    <PlusIcon className="w-5 h-5" />
                  </Button>
                </div>
                <div className="flex-1 overflow-auto">
                  <nav className="space-y-1 p-4">
                    {(role === "admin" ||
                      role === "auditor" ||
                      role === "super admin") && (
                      <div
                        className={`flex items-center gap-3 rounded-md px-3 py-3 transition-colors hover:bg-gray-200 dark:hover:bg-neutral-800 ${
                          selectedChat === "Admin Chat"
                            ? "bg-gray-200 dark:bg-neutral-800"
                            : ""
                        }`}
                      >
                        <Link
                          href="#"
                          onClick={() => setSelectedChat("Admin Chat")}
                          prefetch={false}
                          className="flex-1 flex items-center gap-3"
                        >
                          <DotFilledIcon className="w-4 h-4" />
                          <span className="flex-1 truncate"># Admins</span>
                        </Link>
                        {role === "super admin" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={deleteAdminChat}
                          >
                            <CrossCircledIcon />
                          </Button>
                        )}
                      </div>
                    )}

                    {dmUsers
                      .filter((u) => !u.id.startsWith("group_"))
                      .map((u) => (
                        <div
                          key={u.id}
                          className={`flex items-center min-h-[3.5rem] gap-3 rounded-md px-3 py-2 transition-colors hover:bg-gray-200 dark:hover:bg-neutral-800 ${
                            selectedChat === u.id
                              ? "bg-gray-200 dark:bg-neutral-800"
                              : ""
                          }`}
                        >
                          <div className="flex-1 flex items-center gap-3">
                            <Link
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                handleChatClick(u.id);
                              }}
                              prefetch={false}
                              className="flex-1 flex items-center gap-3"
                            >
                              {"is_online" in u && u.is_online && (
                                <DotFilledIcon className="text-green-600" />
                              )}
                              <span className="flex-1 truncate">{u.name}</span>
                              {unreadStatus[u.id] && (
                                <span className="ml-2">
                                  <DotFilledIcon className="w-4 h-4 text-red-600" />
                                </span>
                              )}
                              {"is_online" in u && u.is_online && (
                                <span className="rounded-full bg-green-400 px-2 py-0.5 text-xs ml-2">
                                  Online
                                </span>
                              )}
                            </Link>
                            {(("created_by" in u && u.created_by === user.id) ||
                              role === "admin" ||
                              role === "super admin" ||
                              (!("created_by" in u) && u.id === user.id)) && (
                              <div className="relative ml-2" ref={optionsRef}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowDMOptions(
                                      showDMOptions === u.id ? null : u.id
                                    );
                                  }}
                                >
                                  <DotsVerticalIcon className="w-4 h-4" />
                                </Button>
                                {showDMOptions === u.id && (
                                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-muted ring-1 ring-black ring-opacity-5">
                                    <div
                                      className="py-1"
                                      role="menu"
                                      aria-orientation="vertical"
                                      aria-labelledby="options-menu"
                                    >
                                      <Button
                                        variant="ghost"
                                        className="flex w-full items-center px-4 py-2 text-sm"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setChatToDelete(u.id);
                                          setShowDeleteAlert(true);
                                          setShowDMOptions(null);
                                        }}
                                      >
                                        <TrashIcon className="mr-3 h-4 w-4" />
                                        Delete Chat
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                    {dmUsers
                      .filter((u) => u.id.startsWith("group_"))
                      .map((groupChat, index) => (
                        <div
                          key={`${groupChat.id}-${index}`}
                          className={`flex items-center min-h-[3.5rem] gap-3 rounded-md px-3 py-2 transition-colors hover:bg-gray-200 dark:hover:bg-neutral-800 ${
                            selectedChat === groupChat.id
                              ? "bg-gray-200 dark:bg-neutral-800"
                              : ""
                          }`}
                        >
                          <div className="flex-1 flex items-center gap-3">
                            <Link
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                handleChatClick(groupChat.id);
                              }}
                              prefetch={false}
                              className="flex-1 flex items-center gap-3"
                            >
                              <DotFilledIcon className="w-4 h-4" />
                              <span className="flex-1 truncate">
                                {groupChat.name}
                              </span>
                            </Link>
                            {((groupChat as GroupChat).created_by === user.id ||
                              role === "admin" ||
                              role === "super admin") && (
                              <div className="relative ml-2" ref={optionsRef}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowGroupOptions(
                                      showGroupOptions === groupChat.id
                                        ? null
                                        : groupChat.id
                                    );
                                  }}
                                >
                                  <DotsVerticalIcon className="w-4 h-4" />
                                </Button>
                                {showGroupOptions === groupChat.id && (
                                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-muted ring-1 ring-black ring-opacity-5">
                                    <div
                                      className="py-1"
                                      role="menu"
                                      aria-orientation="vertical"
                                      aria-labelledby="options-menu"
                                    >
                                      <Button
                                        variant="ghost"
                                        className="flex w-full items-center px-4 py-2 text-sm"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setChatToDelete(groupChat.id);
                                          setShowDeleteAlert(true);
                                          setShowGroupOptions(null);
                                        }}
                                      >
                                        <TrashIcon className="mr-3 h-4 w-4" />
                                        Delete Chat
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        className="flex w-full items-center px-4 py-2 text-sm"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          const newName = prompt(
                                            "Enter new group name:",
                                            groupChat.name
                                          );
                                          if (newName) {
                                            handleEditGroupName(
                                              groupChat.id,
                                              newName
                                            );
                                          }
                                          setShowGroupOptions(null);
                                        }}
                                      >
                                        <Pencil1Icon className="mr-3 h-4 w-4" />
                                        Edit Group Name
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </nav>
                </div>
              </div>

              <AlertDialog
                open={showDeleteAlert}
                onOpenChange={setShowDeleteAlert}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      the chat and remove it from all involved users&apos;
                      message lists.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel
                      onClick={() => {
                        setShowDeleteAlert(false);
                        setChatToDelete(null);
                      }}
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDeleteChat}>
                      Continue
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <div className="flex-1 flex flex-col">
                <div className="flex-1 flex flex-col max-h-[62vh] overflow-auto p-6">
                  <div className="space-y-6">
                    {filteredMessages.map((msg, i) => (
                      <div key={i} className="flex items-start gap-4">
                        <Avatar className="border w-10 h-10">
                          <AvatarImage src="/placeholder-user.jpg" />
                          <AvatarFallback>
                            {msg.user_name?.charAt(0) ||
                              msg.sender_id?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid gap-1 flex-1">
                          <div className="font-bold relative group">
                            {msg.user_name || getUserName(msg.sender_id)}
                            {msg.sender_id !== user.id &&
                              !msg.receiver_id &&
                              !msg.group_chat_id && (
                                <Button
                                  className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    startDirectMessage({
                                      id: msg.sender_id!,
                                      name:
                                        msg.user_name ||
                                        getUserName(msg.sender_id),
                                      is_online: false,
                                    })
                                  }
                                >
                                  <ChatBubbleIcon />
                                </Button>
                              )}
                          </div>
                          <div className="prose prose-stone">
                            {editingMessageId === msg.id ? (
                              <>
                                <Textarea
                                  value={editingMessage}
                                  onChange={(e) =>
                                    setEditingMessage(e.target.value)
                                  }
                                  className="mb-2"
                                />
                                <Button onClick={onUpdate} className="mb-2">
                                  Update
                                </Button>
                              </>
                            ) : (
                              <p>{msg.message}</p>
                            )}
                          </div>
                        </div>
                        {role === "super admin" || msg.sender_id === user.id ? (
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => onEdit(msg.id, msg.message)}
                              variant="ghost"
                              size="icon"
                            >
                              <Pencil1Icon />
                            </Button>
                            <Button
                              onClick={() => onDelete(msg.id)}
                              variant="ghost"
                              size="icon"
                            >
                              <TrashIcon />
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-800 p-4">
                  <div className="relative">
                    <Textarea
                      placeholder="Type your message..."
                      name="message"
                      id="message"
                      rows={1}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          onSend();
                        }
                      }}
                      className="min-h-[48px] rounded-2xl resize-none p-4 border border-gray-200 dark:border-gray-800 pr-16"
                    />
                    <Button
                      key={`send-message-${selectedChat}-${message}`} // Add a unique key to force re-render
                      type="submit"
                      size="icon"
                      className="absolute top-3 right-3 w-8 h-8"
                      onClick={onSend}
                    >
                      <ArrowUpIcon className="w-4 h-4" />
                      <span className="sr-only">Send</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Dialog open={showUserList} onOpenChange={setShowUserList}>
          <DialogContent className="max-w-md p-2">
            <DialogHeader>
              <DialogTitle>Start a Chat</DialogTitle>
              <DialogDescription>
                Select chat type and users to start a conversation with.
              </DialogDescription>
            </DialogHeader>
            <Tabs
              defaultValue="dm"
              onValueChange={(value) =>
                handleChatTypeSelection(value as "dm" | "group")
              }
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="dm">Direct Message</TabsTrigger>
                <TabsTrigger value="group">Group Chat</TabsTrigger>
              </TabsList>
              <TabsContent value="dm">
                <div className="space-y-2">
                  {users.map((u) => (
                    <div key={u.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`user-dm-${u.id}`}
                        checked={selectedUsers.some((user) => user.id === u.id)}
                        onChange={() => handleUserSelection(u)}
                        disabled={
                          selectedUsers.length > 0 &&
                          !selectedUsers.some((user) => user.id === u.id)
                        }
                      />
                      <label
                        htmlFor={`user-dm-${u.id}`}
                        className="flex items-center gap-2"
                      >
                        {u.is_online && (
                          <DotFilledIcon className="text-green-600" />
                        )}
                        {u.name}
                      </label>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="group">
                <div className="space-y-2">
                  {users.map((u) => (
                    <div key={u.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`user-group-${u.id}`}
                        checked={selectedUsers.some((user) => user.id === u.id)}
                        onChange={() => handleUserSelection(u)}
                      />
                      <label
                        htmlFor={`user-group-${u.id}`}
                        className="flex items-center gap-2"
                      >
                        {u.is_online && (
                          <DotFilledIcon className="text-green-600" />
                        )}
                        {u.name}
                      </label>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button
                variant="linkHover2"
                onClick={() => {
                  setShowUserList(false);
                  setSelectedUsers([]);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="linkHover1"
                onClick={() =>
                  chatType === "dm"
                    ? startDirectMessage(selectedUsers[0])
                    : startGroupChat(selectedUsers)
                }
              >
                Start Chat
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </RoleBasedWrapper>
    </>
  );
}
export default function ChatClient() {
  return (
    <Suspense fallback={<div></div>}>
      <ChatContent />
    </Suspense>
  );
}
