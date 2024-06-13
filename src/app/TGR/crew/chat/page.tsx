"use client";
import { useEffect, useState, useRef } from "react";
import { createClient, RealtimeChannel } from "@supabase/supabase-js";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { useRole } from "@/context/RoleContext"; // Import useRole
import { TrashIcon, Pencil1Icon } from "@radix-ui/react-icons";
import { Textarea } from "@/components/ui/textarea";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";

const title = "TGR Ops Chat";

interface ChatMessage {
  id: number;
  user_name: string;
  message: string;
  created_at: string;
  user_id: string;
  is_read: boolean; // Add is_read to the ChatMessage interface
}

export default function ChatClient() {
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { user, role, loading } = useRole(); // Use useRole hook
  const [username, setUsername] = useState<string>("");
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingMessage, setEditingMessage] = useState<string>("");

  const channel = useRef<RealtimeChannel | null>(null);

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

    fetchUsername();
    fetchMessages();

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

    return () => {
      channel.current?.unsubscribe();
      channel.current = null;
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

    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const newMessage = {
      user_name: username,
      message,
      user_id: user.id,
      created_at: new Date().toISOString(),
      is_read: false, // Set is_read to false for new messages
    };

    const { error } = await client.from("chat_messages").insert([newMessage]);

    if (error) {
      console.error("Error inserting message:", error.message);
      return;
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
      <>
        <h1 className="lg:leading-tighter text-2xl font-bold tracking-tighter sm:text-4xl md:text-5xl xl:text-[2.6rem] 2xl:text-[3rem]"></h1>
        <Card className="flex flex-col justify-between h-full max-w-xl mx-auto my-12">
          <CardTitle className="text-3xl ml-2">
            <TextGenerateEffect words={title} />
          </CardTitle>

          <div className="mt-5 flex flex-col flex-grow space-y-2 p-2 overflow-y-auto">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`p-2 rounded-md text-lg ${
                  msg.user_id === user.id
                    ? "bg-blue-600 text-black dark:bg-blue-800 dark:text-white text-end self-end"
                    : "bg-muted text-black dark:bg-muted dark:text-white self-start"
                } message-container`}
              >
                {msg.user_id !== user.id && (
                  <span className="font-bold">{msg.user_name}: </span>
                )}
                {editingMessageId === msg.id ? (
                  <>
                    <Textarea
                      value={editingMessage}
                      onChange={(e) => setEditingMessage(e.target.value)}
                      className="mb-2"
                    />
                    <Button onClick={onUpdate} className="mb-2">
                      Update
                    </Button>
                  </>
                ) : (
                  <>{msg.message}</>
                )}
                {msg.user_id === user.id && (
                  <div className="message-actions">
                    <Button
                      onClick={() => onEdit(msg.id, msg.message)}
                      variant="ghost"
                    >
                      <Pencil1Icon />
                    </Button>
                    <Button onClick={() => onDelete(msg.id)} variant="ghost">
                      <TrashIcon />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex space-x-4 p-2 min-w-full ">
            <Input
              type="text"
              placeholder="Message"
              value={message}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setMessage(e.target.value)
              }
              onKeyUp={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  onSend();
                }
              }}
              className="flex-grow text-lg"
            />
            <Button
              variant="linkHover2"
              onClick={onSend}
              className="flex-shrink-0"
            >
              Send
            </Button>
          </div>
        </Card>
      </>
    </RoleBasedWrapper>
  );
}
