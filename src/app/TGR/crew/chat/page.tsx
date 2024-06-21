"use client";

import { useEffect, useState, useRef } from "react";
import { createClient, RealtimeChannel } from "@supabase/supabase-js";
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

  const channel = useRef<RealtimeChannel | null>(null);
  const presenceChannel = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const fetchUsername = async () => {
      if (user) {
        const { data: userData, error } = await client
          .from("employees")
          .select("name")
          .eq("user_uuid", user.id)
          .single();
        if (userData) {
          setUsername(userData.name);
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
        .from("profiles")
        .select("id, full_name")
        .or("role.eq.admin,role.eq.super admin");
      if (data) {
        setUsers(
          (data as unknown as { id: string; full_name: string }[]).map(
            (user) => ({
              id: user.id,
              name: user.full_name,
              is_online: false,
            })
          )
        );
      } else {
        console.error("Error fetching users:", error?.message);
      }
    };

    const fetchDmUsers = async () => {
      const { data, error } = await supabase
        .from("direct_messages")
        .select("receiver_id, sender_id, user_name")
        .or(`receiver_id.eq.${user?.id},sender_id.eq.${user?.id}`);
      if (data) {
        const userIds = data.map((dm) =>
          dm.receiver_id === user?.id ? dm.sender_id : dm.receiver_id
        );
        const { data: usersData, error: usersError } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);
        if (usersData) {
          setDmUsers(
            usersData.map((user) => ({
              id: user.id,
              is_online: false,
              name: user.full_name,
            }))
          );
        } else {
          console.error(
            "Error fetching direct message users:",
            usersError?.message
          );
        }
      } else {
        console.error("Error fetching direct messages:", error?.message);
      }
    };

    fetchUsername();
    fetchMessages();
    fetchUsers();
    fetchDmUsers();

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
          { event: "INSERT", schema: "public", table: "direct_messages" },
          (payload) => {
            setMessages((prev) => [...prev, payload.new]);
            fetchDmUsers(); // Update the direct messages list
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

    if (!presenceChannel.current) {
      presenceChannel.current = client.channel("online-users", {
        config: {
          presence: {
            key: user?.id,
          },
        },
      });

      presenceChannel.current
        .on("presence", { event: "sync" }, () => {
          const newState = presenceChannel.current?.presenceState();
          console.log("sync", newState);
          // Update the online status of users
          setUsers((prev) =>
            prev.map((u) => ({
              ...u,
              is_online: !!newState?.[u.id],
            }))
          );
        })
        .on("presence", { event: "join" }, ({ key, newPresences }) => {
          console.log("join", key, newPresences);
        })
        .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
          console.log("leave", key, leftPresences);
        })
        .subscribe(async (status) => {
          if (status !== "SUBSCRIBED") {
            return;
          }

          const presenceTrackStatus = await presenceChannel.current?.track({
            user: user?.id,
            online_at: new Date().toISOString(),
          });
          console.log(presenceTrackStatus);
        });
    }

    return () => {
      channel.current?.unsubscribe();
      channel.current = null;
      presenceChannel.current?.unsubscribe();
      presenceChannel.current = null;
    };
  }, [user]);

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

    const newMessage = {
      message,
      sender_id: user.id,
      user_name: username,
      created_at: new Date().toISOString(),
      is_read: false,
      receiver_id: selectedChat !== "Admin Chat" ? selectedChat : null,
    };

    const { data, error } = await client
      .from(selectedChat === "Admin Chat" ? "chat_messages" : "direct_messages")
      .insert([newMessage]);

    if (error) {
      console.error("Error inserting message:", error.message);
      return;
    }

    if (data) {
      const newMessages = Array.isArray(data) ? data : [data];
      setMessages((prev) => [...prev, ...newMessages]);
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
    setDmUsers((prev) => [...prev, receiver]);
    setSelectedChat(receiver.id);
    setShowUserList(false);

    const { error } = await supabase.from("direct_messages").insert([
      {
        sender_id: user.id,
        receiver_id: receiver.id,
        message: "",
        is_read: false,
        user_name: username,
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

  const handleChatClick = (chatId: string) => {
    setSelectedChat(chatId);
    if (unreadCounts[chatId]) {
      const updatedUnreadCounts = { ...unreadCounts };
      delete updatedUnreadCounts[chatId];
      setUnreadCounts(updatedUnreadCounts);

      // Mark messages as read in the database
      supabase
        .from("direct_messages")
        .update({ is_read: true })
        .eq("receiver_id", user.id)
        .eq("sender_id", chatId);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
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
                      <span className="flex-1 truncate">Admin Chat</span>
                    </Link>
                    {role === "super admin" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={deleteAdminChat}
                      >
                        <TrashIcon />
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
                        <DotFilledIcon className="w-4 h-4" />
                        <span className="flex-1 truncate relative group">
                          {u.name}
                          {/* <Button
                            className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteDirectMessage(u.id)}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button> */}
                        </span>
                        {u.is_online && (
                          <span className="rounded-full bg-green-400 px-2 py-0.5 text-xs">
                            Online
                          </span>
                        )}
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteDirectMessage(u.id)}
                      >
                        <TrashIcon className="w-4 h-4" />
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
                          {msg.user_name?.charAt(0) || msg.sender_id?.charAt(0)}
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
                variant="outline"
                onClick={() => startDirectMessage(u)}
              >
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
  );
}
