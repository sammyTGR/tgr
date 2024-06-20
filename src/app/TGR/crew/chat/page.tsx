"use client";

import { useEffect, useState, useRef } from "react";
import { createClient, RealtimeChannel } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { useRole } from "@/context/RoleContext"; // Import useRole
import {
  TrashIcon,
  Pencil1Icon,
  PlusIcon,
  ArrowUpIcon,
  DotFilledIcon,
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
  const { user, role, loading } = useRole();
  const [username, setUsername] = useState<string>("");
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingMessage, setEditingMessage] = useState<string>("");
  const [showUserList, setShowUserList] = useState(false);

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
      const { data, error } = await client
        .from("chat_messages")
        .select("*")
        .order("created_at", { ascending: true });
      if (data) {
        setMessages(data);

        // Mark unread messages as read for the current user
        const unreadMessages = data.filter(
          (msg) => msg.user_id === user.id && !msg.is_read
        );
        const messageIds = unreadMessages.map((msg) => msg.id);

        if (messageIds.length > 0) {
          const { error: updateError } = await client
            .from("chat_messages")
            .update({ is_read: true })
            .in("id", messageIds);

          if (updateError) {
            console.error("Error marking messages as read:", updateError);
          }
        }
      } else {
        console.error("Error fetching messages:", error?.message);
      }
    };

    const fetchUsers = async () => {
      const { data, error } = await client
        .from("employees")
        .select("user_uuid as id, name");
      if (data) {
        setUsers(
          (data as unknown as { id: string; name: string }[]).map((user) => ({
            ...user,
            is_online: false,
          }))
        );
      } else {
        console.error("Error fetching users:", error?.message);
      }
    };

    fetchUsername();
    fetchMessages();
    fetchUsers();

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
      user_name: username,
      message,
      user_id: user.id,
      created_at: new Date().toISOString(),
      is_read: false, // Set is_read to false for new messages
    };

    const { data, error } = await client
      .from("chat_messages")
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
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await client.from("chat_messages").delete().eq("id", id);

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

    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await client
      .from("chat_messages")
      .update({ message: editingMessage })
      .eq("id", editingMessageId);

    if (error) {
      console.error("Error updating message:", error.message);
      return;
    }

    setEditingMessageId(null);
    setEditingMessage("");
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <RoleBasedWrapper allowedRoles={["admin", "super admin"]}>
      <Card className="flex flex-col h-[80vh] max-h-[80vh]">
        <CardTitle className="p-4 border-b border-gray-200 dark:border-gray-800">
          <TextGenerateEffect words={title} />
        </CardTitle>
        <CardContent className="flex flex-1 p-0">
          <div className="flex h-full">
            <div className="flex flex-col w-80 border-r border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-lg font-semibold">DM&apos;s</h2>
                <Button variant="ghost" onClick={() => setShowUserList(true)}>
                  <PlusIcon className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex-1 overflow-auto">
                <nav className="space-y-1 p-4">
                  {users.map((u) => (
                    <Link
                      key={u.id}
                      href="#"
                      className="flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-gray-200 dark:hover:bg-neutral-800"
                      prefetch={false}
                    >
                      <DotFilledIcon className="w-4 h-4" />
                      <span className="flex-1 truncate">{u.name}</span>
                      {u.is_online && (
                        <span className="rounded-full bg-green-400 px-2 py-0.5 text-xs">
                          Online
                        </span>
                      )}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
            <div className="flex-1 flex flex-col">
              <div className="flex-1 overflow-auto p-6">
                <div className="space-y-6">
                  {messages.map((msg, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <Avatar className="border w-10 h-10">
                        <AvatarImage src="/placeholder-user.jpg" />
                        <AvatarFallback>
                          {msg.user_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid gap-1 flex-1">
                        <div className="font-bold">{msg.user_name}</div>
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
                      {msg.user_id === user.id && !editingMessageId && (
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
                      )}
                    </div>
                  ))}
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
                onClick={() => setShowUserList(false)}
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
