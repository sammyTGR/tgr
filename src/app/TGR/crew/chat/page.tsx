"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
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
import { Toaster, toast } from "sonner";

const title = "TGR Ops Chat";

interface ChatMessage {
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

export default function ChatClient() {
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [dmUsers, setDmUsers] = useState<User[]>([]);
  const [selectedChat, setSelectedChat] = useState<string>("Admin Chat");
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

  const router = useRouter();
  const searchParams = useSearchParams();
  const dm = searchParams ? searchParams.get("dm") : null;
  const pathname = usePathname();

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
      const { data: chatMessages, error: chatError } = await client
        .from("chat_messages")
        .select("*")
        .order("created_at", { ascending: true });

      const { data: directMessages, error: directError } = await client
        .from("direct_messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (chatMessages && directMessages) {
        setMessages([...chatMessages, ...directMessages]);
      } else {
        console.error("Error fetching messages:", chatError || directError);
      }
    };

    const fetchUsers = async () => {
      const { data, error } = await client
        .from("employees")
        .select("user_uuid, name, is_online")
        .or("role.eq.admin,role.eq.super admin");
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

      const { data, error } = await client
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
        const { data: usersData, error: usersError } = await client
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
      await fetchUsername();
      await fetchMessages();
      await fetchUsers();
      await fetchDmUsers();
    };

    fetchInitialData();

    if (dm) {
      setSelectedChat(dm);
    }

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
      } else {
        console.error("Error fetching sender:", senderError?.message);
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

              const isOnChatPage = pathname === "/TGR/crew/chat";
              const currentChat = localStorage.getItem("currentChat");

              if (
                !isOnChatPage ||
                document.hidden ||
                currentChat !== payload.new.sender_id
              ) {
                toast(`New message from ${senderId}`, {
                  description: payload.new.message,
                  action: {
                    label: "Okay",
                    onClick: () => {
                      router.push(`/TGR/crew/chat?dm=${payload.new.sender_id}`);
                    },
                  },
                });

                if (Notification.permission === "granted") {
                  new Notification(`New message from ${senderId}`, {
                    body: payload.new.message,
                  });
                }
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
  }, [user, selectedChat, pathname, router, dm]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const onSend = async () => {
    if (
      !channel.current ||
      message.trim().length === 0 ||
      username.trim().length === 0
    ) {
      console.warn("Cannot send message:", {
        message,
        username,
        channel: channel.current,
      });
      return;
    }

    const client = supabase;

    const commonMessageData = {
      message,
      sender_id: user.id,
      user_name: username,
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
      };
      tableName = "chat_messages";
    } else {
      insertData = commonMessageData;
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

    setMessage("");
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

  const deleteDirectMessage = async (userId: string) => {
    setDmUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
    if (selectedChat === userId) {
      setSelectedChat("Admin Chat");
    }

    const { error } = await supabase
      .from("direct_messages")
      .delete()
      .eq("sender_id", user.id)
      .eq("receiver_id", userId);

    if (error) {
      console.error("Error deleting direct message user:", error.message);
    }
  };

  const filteredMessages = messages.filter((msg) => {
    if (selectedChat === "Admin Chat") {
      return !msg.receiver_id;
    }
    return (
      (msg.sender_id === user.id && msg.receiver_id === selectedChat) ||
      (msg.sender_id === selectedChat && msg.receiver_id === user.id)
    );
  });

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
  }, [messages]);

  const handleChatClick = async (chatId: string) => {
    setSelectedChat(chatId);

    // Reset unread status for the selected chat
    if (unreadStatus[chatId]) {
      setUnreadStatus((prevStatus) => ({
        ...prevStatus,
        [chatId]: false,
      }));

      // Mark messages as read in the database
      const { data: messagesToUpdate, error: fetchError } = await supabase
        .from("direct_messages")
        .select("id, read_by")
        .or(`receiver_id.eq.${chatId},sender_id.eq.${user.id}`);

      if (fetchError) {
        console.error("Error fetching messages to update:", fetchError.message);
        return;
      }

      const messageIdsToUpdate = messagesToUpdate
        .filter((msg) => msg.read_by && !msg.read_by.includes(user.id))
        .map((msg) => msg.id);

      if (messageIdsToUpdate.length > 0) {
        for (const messageId of messageIdsToUpdate) {
          const { error: updateError } = await supabase
            .from("direct_messages")
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

    // Store the current chat ID in localStorage
    localStorage.setItem("currentChat", chatId);
  };

  useEffect(() => {
    // Store the current chat ID in localStorage whenever it changes
    localStorage.setItem("currentChat", selectedChat);
  }, [selectedChat]);

  if (loading) {
    return <div>Loading...</div>;
  }
  return (
    <>
      <Toaster />
      <RoleBasedWrapper allowedRoles={["admin", "super admin"]}>
        <Card className="flex flex-col h-[80vh] max-h-[80vh] max-w-6xl p-4 mx-auto mb-4 overflow-hidden">
          <CardTitle className="p-4 border-b border-gray-200 dark:border-gray-800">
            <TextGenerateEffect words={title} />
          </CardTitle>
          <CardContent className="flex flex-1 p-0 max-w-full overflow-hidden">
            <div className="flex h-full w-full overflow-hidden">
              <div className="flex-1 flex flex-col max-w-sm w-64 border-r border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                  <h2 className="text-lg font-semibold">Messages</h2>
                  <Button variant="ghost" onClick={() => setShowUserList(true)}>
                    <PlusIcon className="w-5 h-5" />
                  </Button>
                </div>
                <div className="flex-1 overflow-auto">
                  <nav className="space-y-1 p-4">
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
                            {msg.user_name || msg.sender_id}
                            {msg.sender_id !== user.id && !msg.receiver_id && (
                              <Button
                                className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  startDirectMessage({
                                    id: msg.sender_id!,
                                    name: msg.user_name || msg.sender_id!,
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
              <DialogTitle>Start a Direct Message</DialogTitle>
              <DialogDescription>
                Select a user to start a conversation with.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              {users.map((u) => (
                <Button
                  key={u.id}
                  variant="linkHover1"
                  onClick={() => startDirectMessage(u)}
                  className="flex items-center gap-2"
                >
                  {u.is_online && <DotFilledIcon className="text-green-600" />}
                  {u.name}
                </Button>
              ))}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowUserList(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </RoleBasedWrapper>
    </>
  );
}
