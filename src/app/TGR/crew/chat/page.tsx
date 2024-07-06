"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { useRole } from "@/context/RoleContext";
import {
  TrashIcon,
  Pencil1Icon,
  PlusIcon,
  ArrowUpIcon,
  DotFilledIcon,
  ChatBubbleIcon,
  CrossCircledIcon,
} from "@radix-ui/react-icons";
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
import { toast, Toaster } from "sonner";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";

const title = "TGR Ops Chat";

const notify = (message: string) => {
  toast(message);
};

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
}

interface User {
  id: string;
  name: string;
  is_online: boolean;
}

interface GroupChatPayload {
  new: {
    id: number;
    created_by: string;
    name: string;
    users: string[];
    created_at: string;
  };
}

function ChatContent() {
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [dmUsers, setDmUsers] = useState<User[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null); // Change initial state to null
  const { user, role, loading } = useRole();
  const [username, setUsername] = useState<string>("");
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingMessage, setEditingMessage] = useState<string>("");
  const [showUserList, setShowUserList] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [unreadStatus, setUnreadStatus] = useState<Record<string, boolean>>({});
  const channel = useRef<RealtimeChannel | null>(null);
  const presenceChannel = useRef<RealtimeChannel | null>(null);
  const searchParams = useSearchParams();
  const dm = searchParams ? searchParams.get("dm") : null;
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [groupChatId, setGroupChatId] = useState<number | null>(null);
  const [chatType, setChatType] = useState<"dm" | "group">("dm");

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

  const handleGroupChatInsert = async (payload: GroupChatPayload) => {
    const newGroupChat = payload.new;

    // Fetch the names of users in the group chat
    const { data: usersData, error: usersError } = await supabase
      .from("employees")
      .select("user_uuid, name")
      .in("user_uuid", newGroupChat.users);

    if (usersError) {
      console.error("Error fetching group chat users:", usersError.message);
      return;
    }

    if (usersData) {
      // Create a user map to lookup user names by user_uuid
      const userMap: Record<string, string> = usersData.reduce((acc, user) => {
        acc[user.user_uuid] = user.name;
        return acc;
      }, {} as Record<string, string>);

      setDmUsers((prev) => {
        // Ensure no duplicates
        const existingGroupChat = prev.find(
          (user) => user.id === `group_${newGroupChat.id}`
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
          },
        ];
      });
    } else {
      console.error("No users data found for the group chat.");
    }
  };

  const fetchGroupChats = async () => {
    const { data: groupChats, error: groupChatsError } = await supabase
      .from("group_chats")
      .select("*");

    if (groupChats) {
      const groupChatUsers = await Promise.all(
        groupChats.map(async (chat) => {
          const userIds = chat.users;
          const { data: usersData, error: usersError } = await supabase
            .from("employees")
            .select("user_uuid, name")
            .in("user_uuid", userIds);

          if (usersError) {
            console.error(
              "Error fetching group chat users:",
              usersError.message
            );
          }

          // Check if usersData is not null before creating the user map
          const userMap: Record<string, string> = usersData
            ? usersData.reduce((acc, user) => {
                acc[user.user_uuid] = user.name;
                return acc;
              }, {} as Record<string, string>)
            : {};

          return {
            id: `group_${chat.id}`,
            name: chat.name,
            is_online: true,
            users: userMap,
          };
        })
      );

      setDmUsers((prev) => {
        const newDmUsers = [
          ...prev.filter((user) => !user.id.startsWith("group_")),
        ];

        // Add only unique group chats
        groupChatUsers.forEach((chat) => {
          if (!newDmUsers.some((user) => user.id === chat.id)) {
            newDmUsers.push(chat);
          }
        });

        return newDmUsers;
      });
    } else {
      console.error("Error fetching group chats:", groupChatsError?.message);
    }
  };

  useEffect(() => {
    const client = supabase;

    const fetchUsername = async () => {
      const { data: userData, error } = await supabase.auth.getUser();
      if (userData && userData.user) {
        const { data, error } = await supabase
          .from("employees")
          .select("name")
          .eq("user_uuid", userData.user.id)
          .single();
        if (data) {
          setUsername(data.name);
          // Set user as online
          await supabase
            .from("employees")
            .update({ is_online: true })
            .eq("user_uuid", userData.user.id);
        } else {
          console.error("Error fetching username:", error?.message);
        }
      }
    };

    const fetchMessages = async () => {
      const { data: chatMessages, error: chatError } = await supabase
        .from("chat_messages")
        .select("*")
        .order("created_at", { ascending: true });

      const { data: directMessages, error: directError } = await supabase
        .from("direct_messages")
        .select("*")
        .order("created_at", { ascending: true });

      const { data: groupChatMessages, error: groupChatError } = await supabase
        .from("group_chat_messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (chatMessages && directMessages && groupChatMessages) {
        setMessages([...chatMessages, ...directMessages, ...groupChatMessages]);
      } else {
        console.error(
          "Error fetching messages:",
          chatError || directError || groupChatError
        );
      }
    };

    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("user_uuid, name, is_online")
        .or("role.eq.admin,role.eq.super admin,role.eq.gunsmith");
      if (data) {
        setUsers(
          data.map((user) => ({
            id: user.user_uuid,
            name: user.name,
            is_online: user.is_online,
          }))
        );
      } else {
        console.error("Error fetching users:", error?.message);
      }
    };

    const fetchDmUsers = async () => {
      if (!user?.id) {
        console.error("User ID is undefined");
        return;
      }

      const { data, error } = await supabase
        .from("direct_messages")
        .select("receiver_id, sender_id, user_name")
        .or(`receiver_id.eq.${user.id},sender_id.eq.${user.id}`);

      if (error) {
        console.error("Error fetching direct messages:", error.message);
        return;
      }

      if (data) {
        const userIds = data.map((dm) =>
          dm.receiver_id === user.id ? dm.sender_id : dm.receiver_id
        );
        const { data: usersData, error: usersError } = await supabase
          .from("employees")
          .select("user_uuid, name, is_online")
          .in("user_uuid", userIds);

        if (usersData) {
          setDmUsers(
            usersData.map((user) => ({
              id: user.user_uuid,
              is_online: user.is_online,
              name: user.name,
            }))
          );
        } else {
          console.error(
            "Error fetching direct message users:",
            usersError?.message
          );
        }
      }
    };

    const fetchInitialData = async () => {
      const fetchUsername = async () => {
        const { data: userData, error } = await supabase.auth.getUser();
        if (userData && userData.user) {
          const { data, error } = await supabase
            .from("employees")
            .select("name")
            .eq("user_uuid", userData.user.id)
            .single();
          if (data) {
            setUsername(data.name);
            await supabase
              .from("employees")
              .update({ is_online: true })
              .eq("user_uuid", userData.user.id);
          } else {
            console.error("Error fetching username:", error?.message);
          }
        }
      };

      const fetchMessages = async () => {
        const { data: chatMessages, error: chatError } = await supabase
          .from("chat_messages")
          .select("*")
          .order("created_at", { ascending: true });

        const { data: directMessages, error: directError } = await supabase
          .from("direct_messages")
          .select("*")
          .order("created_at", { ascending: true });

        const { data: groupChatMessages, error: groupChatError } =
          await supabase
            .from("group_chat_messages")
            .select("*")
            .order("created_at", { ascending: true });

        if (chatMessages && directMessages && groupChatMessages) {
          setMessages([
            ...chatMessages,
            ...directMessages,
            ...groupChatMessages,
          ]);
        } else {
          console.error(
            "Error fetching messages:",
            chatError || directError || groupChatError
          );
        }
      };

      const fetchUsers = async () => {
        const { data, error } = await supabase
          .from("employees")
          .select("user_uuid, name, is_online")
          .or("role.eq.admin,role.eq.super admin,role.eq.gunsmith");
        if (data) {
          setUsers(
            data.map((user) => ({
              id: user.user_uuid,
              name: user.name,
              is_online: user.is_online,
            }))
          );
        } else {
          console.error("Error fetching users:", error?.message);
        }
      };

      const fetchGroupChats = async () => {
        const { data: groupChats, error: groupChatsError } = await supabase
          .from("group_chats")
          .select("*");

        if (groupChats) {
          setDmUsers((prev) => {
            const newUsers = groupChats.map((chat) => ({
              id: `group_${chat.id}`,
              name: chat.name,
              is_online: true,
            }));

            // Ensure no duplicates
            const uniqueUsers = [...prev, ...newUsers].filter(
              (user, index, self) =>
                index === self.findIndex((u) => u.id === user.id)
            );

            return uniqueUsers;
          });
        } else {
          console.error(
            "Error fetching group chats:",
            groupChatsError?.message
          );
        }
      };

      const fetchDmUsers = async () => {
        if (!user?.id) {
          console.error("User ID is undefined");
          return;
        }

        const { data, error } = await supabase
          .from("direct_messages")
          .select("receiver_id, sender_id, user_name")
          .or(`receiver_id.eq.${user.id},sender_id.eq.${user.id}`);

        if (error) {
          console.error("Error fetching direct messages:", error.message);
          return;
        }

        if (data) {
          const userIds = data.map((dm) =>
            dm.receiver_id === user.id ? dm.sender_id : dm.receiver_id
          );
          const { data: usersData, error: usersError } = await supabase
            .from("employees")
            .select("user_uuid, name, is_online")
            .in("user_uuid", userIds);

          if (usersData) {
            setDmUsers((prev) => {
              const newUsers = usersData.map((user) => ({
                id: user.user_uuid,
                is_online: user.is_online,
                name: user.name,
              }));

              // Ensure no duplicates
              const uniqueUsers = [...prev, ...newUsers].filter(
                (user, index, self) =>
                  index === self.findIndex((u) => u.id === user.id)
              );

              return uniqueUsers;
            });
          } else {
            console.error(
              "Error fetching direct message users:",
              usersError?.message
            );
          }
        }
      };

      await fetchUsername();
      await fetchMessages();
      await fetchUsers();
      await fetchGroupChats();
      if (user?.id) {
        await fetchDmUsers();
      }
    };

    fetchInitialData();

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
              prev.map((msg) => (msg.id === payload.new.id ? payload.new : msg))
            );
          }
        )
        .subscribe();
    }

    const directMessageChannel = client
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
          setMessages((prev) => [...prev, payload.new]);

          if (payload.new.receiver_id === user?.id) {
            const senderId = payload.new.sender_id;

            if (typeof senderId === "string") {
              setUnreadStatus((prevStatus) => ({
                ...prevStatus,
                [senderId]: true,
              }));

              if (!dmUsers.some((u) => u.id === senderId)) {
                await fetchSender(senderId);
              }
            } else {
              console.error("sender_id is not a string", senderId);
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
            prev.map((msg) => (msg.id === payload.new.id ? payload.new : msg))
          );
        }
      )
      .subscribe();

    const authListener = client.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          await client
            .from("employees")
            .update({ is_online: true })
            .eq("user_uuid", session.user.id);
        } else if (event === "SIGNED_OUT" && session) {
          await client
            .from("employees")
            .update({ is_online: false })
            .eq("user_uuid", session.user.id);
        }
      }
    );

    const presenceChannel = client
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

    return () => {
      authListener.data.subscription.unsubscribe();
      channel.current?.unsubscribe();
      channel.current = null;
      presenceChannel.unsubscribe();
      directMessageChannel?.unsubscribe();
    };
  }, [user, selectedChat, dm]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update the onSend function to include these changes
  const onSend = async () => {
    if (
      !channel.current ||
      message.trim().length === 0 ||
      username.trim().length === 0 ||
      selectedChat === null
    ) {
      console.warn("Cannot send message:", {
        message,
        username,
        channel: channel.current,
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
        user_name: username,
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
        user_name: username,
      };
      tableName = "direct_messages";
    }

    const { data, error } = await client.from(tableName).insert([insertData]);

    if (error) {
      console.error("Error inserting message:", error.message);
      return;
    }

    if (data) {
      const newMessages = Array.isArray(data) ? data : [data];
      setMessages((prev) => [...prev, ...newMessages]);

      // Reset unread status for the selected chat
      setUnreadStatus((prevStatus) => ({
        ...prevStatus,
        [selectedChat]: false,
      }));

      // Mark all messages in the chat as read by the current user
      const { data: existingMessages, error: fetchError } = await client
        .from(tableName)
        .select("id, read_by")
        .or(`receiver_id.eq.${selectedChat},sender_id.eq.${user.id}`);

      if (fetchError) {
        console.error("Error fetching existing messages:", fetchError.message);
        return;
      }

      const messageIdsToUpdate = existingMessages
        .filter((msg) => msg.read_by && !msg.read_by.includes(user.id))
        .map((msg) => msg.id);

      if (messageIdsToUpdate.length > 0) {
        for (const messageId of messageIdsToUpdate) {
          const { error: updateError } = await client
            .from(tableName)
            .update({
              read_by: [
                ...(existingMessages.find((msg) => msg.id === messageId)
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

    setMessage(""); // Ensure message input is cleared
    scrollToBottom(); // Scroll to the bottom after sending a message
  };

  const onDelete = async (id: number) => {
    const client = supabase;

    const { error } = await client
      .from(selectedChat === "Admin Chat" ? "chat_messages" : "direct_messages")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting message:", error.message);
      return;
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

    const { error } = await supabase.from("direct_messages").insert([
      {
        sender_id: user.id,
        receiver_id: receiver.id,
        message: "",
        is_read: false,
        user_name: username, // Use username of the sender
      },
    ]);

    if (error) {
      console.error("Error inserting direct message user:", error.message);
    }
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

      const { error: messageError } = await supabase
        .from("group_chat_messages")
        .insert([
          {
            group_chat_id: newGroupChat.id,
            sender_id: user.id,
            message: `Group chat started with ${groupChatName}`,
          },
        ]);

      if (messageError) {
        console.error(
          "Error sending group chat start message:",
          messageError.message
        );
      }

      // Update the state with the new group chat
      setDmUsers((prev) => [
        ...prev,
        {
          id: `group_${newGroupChat.id}`,
          name: newGroupChat.name,
          is_online: true,
        },
      ]);

      // Set the newly created group chat as the selected chat
      setSelectedChat(`group_${newGroupChat.id}`);
    }
  };

  const deleteDirectMessage = async (userId: string) => {
    const client = supabase;
    let error;

    if (userId.startsWith("group_")) {
      const groupId = parseInt(userId.split("_")[1], 10);
      ({ error } = await client.from("group_chats").delete().eq("id", groupId));
      if (!error) {
        ({ error } = await client
          .from("group_chat_messages")
          .delete()
          .eq("group_chat_id", groupId));
      }
    } else {
      ({ error } = await client
        .from("direct_messages")
        .delete()
        .eq("sender_id", user.id)
        .eq("receiver_id", userId));
    }

    if (error) {
      console.error(
        "Error deleting direct message or group chat:",
        error.message
      );
      return;
    }

    setDmUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
    if (selectedChat === userId) {
      setSelectedChat("Admin Chat");
    }
  };

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

  useEffect(() => {
    const fetchUnreadCounts = async () => {
      const { data, error } = await supabase
        .from("direct_messages")
        .select("receiver_id, is_read");

      if (error) {
        console.error("Error fetching unread counts:", error.message);
      } else {
        const unreadMessages = data.filter(
          (msg: { is_read: boolean }) => !msg.is_read
        );
        const counts = unreadMessages.reduce(
          (acc: { [key: string]: number }, curr: { receiver_id: string }) => {
            acc[curr.receiver_id] = (acc[curr.receiver_id] || 0) + 1;
            return acc;
          },
          {}
        );
        setUnreadCounts(counts);
      }
    };

    fetchUnreadCounts();

    const groupChatSubscription = supabase
      .channel("group_chats")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "group_chats" },
        handleGroupChatInsert
      )
      .subscribe();

    const groupChatMessageSubscription = supabase
      .channel("group_chat_messages")
      .on<ChatMessage>(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "group_chat_messages" },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);

          // Show toast to all receivers of the group message except the sender
          if (payload.new.sender_id !== user?.id) {
            notify(`New Group Message: ${payload.new.message}`);
          }
        }
      )
      .on<ChatMessage>(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "group_chat_messages" },
        (payload) => {
          setMessages((prev) =>
            prev.filter((msg) => msg.id !== payload.old.id)
          );
        }
      )
      .on<ChatMessage>(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "group_chat_messages" },
        (payload) => {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === payload.new.id ? payload.new : msg))
          );
        }
      )
      .subscribe();

    const directMessageSubscription = supabase
      .channel("direct_messages")
      .on<ChatMessage>(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_messages" },
        async (payload) => {
          setMessages((prev) => [...prev, payload.new]);

          if (payload.new.receiver_id === user?.id) {
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
            notify(`New Message: ${payload.new.message}`);
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
            prev.map((msg) => (msg.id === payload.new.id ? payload.new : msg))
          );
        }
      )
      .subscribe();

    return () => {
      groupChatSubscription.unsubscribe();
      groupChatMessageSubscription.unsubscribe();
      directMessageSubscription.unsubscribe();
    };
  }, [user, dmUsers, unreadStatus]);

  // Store the current chat ID in localStorage whenever it changes
  useEffect(() => {
    if (selectedChat) {
      localStorage.setItem("currentChat", selectedChat);
    }
    scrollToBottom();
  }, [selectedChat, messages]);

  const handleChatClick = useCallback(
    async (chatId: string) => {
      if (!user || !user.id) {
        console.error("User is not defined");
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

        let tableName = "direct_messages";
        if (chatId.startsWith("group_")) {
          tableName = "group_chat_messages";
        }

        // Mark messages as read in the database
        const { data: messagesToUpdate, error: fetchError } = await supabase
          .from(tableName)
          .select("id, read_by")
          .or(`receiver_id.eq.${chatId},sender_id.eq.${user.id}`);

        if (fetchError) {
          console.error(
            "Error fetching messages to update:",
            fetchError.message
          );
          return;
        }

        const messageIdsToUpdate = messagesToUpdate
          .filter((msg) => msg.read_by && !msg.read_by.includes(user.id))
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

      // Ensure the receiver's nav list updates to show the new DM
      if (!dmUsers.some((u) => u.id === chatId)) {
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

      setMessages(messagesData);

      // Store the current chat ID in localStorage
      localStorage.setItem("currentChat", chatId);
      scrollToBottom();
    },
    [dmUsers, unreadStatus, user, setMessages, setUnreadStatus, setSelectedChat]
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Toaster />
      <RoleBasedWrapper allowedRoles={["gunsmith", "admin", "super admin"]}>
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
                    {(role === "admin" || role === "super admin") && (
                      <div
                        className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-gray-200 dark:hover:bg-neutral-800 ${
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

                    {dmUsers.map((u) => (
                      <div
                        key={u.id}
                        className={`flex items-center min-h-[3.5rem] gap-3 rounded-md px-3 py-2 transition-colors hover:bg-gray-200 dark:hover:bg-neutral-800 ${
                          selectedChat === u.id
                            ? "bg-gray-200 dark:bg-neutral-800"
                            : ""
                        }`}
                      >
                        <Link
                          href="#"
                          onClick={() => handleChatClick(u.id)}
                          prefetch={false}
                          className="flex-1 flex items-center gap-3"
                        >
                          {u.is_online && (
                            <DotFilledIcon className="text-green-600" />
                          )}
                          <span className="flex-1 truncate">{u.name}</span>
                          {unreadStatus[u.id] && (
                            <span className="ml-2">
                              <DotFilledIcon className="w-4 h-4 text-red-600" />
                            </span>
                          )}
                          {u.is_online && (
                            <span className="rounded-full bg-green-400 px-2 py-0.5 text-xs ml-2">
                              Online
                            </span>
                          )}
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteDirectMessage(u.id)}
                        >
                          <CrossCircledIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {dmUsers
                      .filter((u) => u.id.startsWith("group_"))
                      .map((groupChat) => (
                        <div
                          key={groupChat.id}
                          className={`flex items-center min-h-[3.5rem] gap-3 rounded-md px-3 py-2 transition-colors hover:bg-gray-200 dark:hover:bg-neutral-800 ${
                            selectedChat === groupChat.id
                              ? "bg-gray-200 dark:bg-neutral-800"
                              : ""
                          }`}
                        >
                          <Link
                            href="#"
                            onClick={() => handleChatClick(groupChat.id)}
                            prefetch={false}
                            className="flex-1 flex items-center gap-3"
                          >
                            <DotFilledIcon className="w-4 h-4" />
                            <span className="flex-1 truncate">
                              {groupChat.name}
                            </span>
                          </Link>
                        </div>
                      ))}
                  </nav>
                </div>
              </div>
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
                            {msg.sender_id !== user.id && !msg.receiver_id && (
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start a Chat</DialogTitle>
              <DialogDescription>
                Select chat type and users to start a conversation with.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <div className="flex space-x-2">
                <Button
                  variant={chatType === "dm" ? "default" : "linkHover1"}
                  onClick={() => handleChatTypeSelection("dm")}
                >
                  Direct Message
                </Button>
                <Button
                  variant={chatType === "group" ? "default" : "linkHover1"}
                  onClick={() => handleChatTypeSelection("group")}
                >
                  Group Chat
                </Button>
              </div>
              {users.map((u) => (
                <div key={u.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`user-${u.id}`}
                    checked={selectedUsers.some((user) => user.id === u.id)}
                    onChange={() => handleUserSelection(u)}
                    disabled={
                      chatType === "dm" &&
                      selectedUsers.length > 0 &&
                      !selectedUsers.some((user) => user.id === u.id)
                    } // Disable other checkboxes for DM after selecting one user
                  />
                  <label
                    htmlFor={`user-${u.id}`}
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
            <DialogFooter>
              <Button
                variant="linkHover1"
                onClick={() => {
                  setShowUserList(false);
                  setSelectedUsers([]);
                }}
              >
                Cancel
              </Button>
              <Button
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
    <Suspense fallback={<div>Loading...</div>}>
      <ChatContent />
    </Suspense>
  );
}
