"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { sendAndGetMessages, getEmployees } from "./actions";
import { NewMessageDialog } from "./new-message-dialog";
import { ChatSidebar } from "./chat-sidebar";
import React from "react";

interface Message {
  id: string;
  content: string;
  is_agent: boolean;
  created_at: string;
}

interface Employee {
  employee_id: number;
  name: string;
  contact_info: string;
  avatar_url: string | null;
}

export default function Chat() {
  const [input, setInput] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const supabase = createClientComponentClient();

  const { data: userData, error: userError } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    },
  });

  const { data: currentEmployee, error: employeeError } = useQuery({
    queryKey: ["currentEmployee"],
    queryFn: async () => {
      if (!userData?.email) return null;
      const employees = await getEmployees();
      return (
        employees.find(
          (emp: Employee) => emp.contact_info === userData.email
        ) || null
      );
    },
    enabled: !!userData?.email,
    retry: false,
    staleTime: 1000 * 60,
  });

  const { data: messages = [], refetch } = useQuery({
    queryKey: ["messages", selectedChatId],
    queryFn: async () => {
      if (!selectedChatId) return [];
      const { data: messages } = await supabase
        .from("messages")
        .select("id, content, is_agent, created_at")
        .eq("chat_id", selectedChatId)
        .order("created_at", { ascending: true })
        .limit(50);
      return messages || [];
    },
    enabled: !!selectedChatId,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!selectedChatId) return;

    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${selectedChatId}`,
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, refetch, selectedChatId]);

  const {
    mutate: sendMessage,
    isError,
    error,
  } = useMutation({
    mutationFn: async (message: string) => {
      if (!selectedChatId) throw new Error("No chat selected");
      return sendAndGetMessages(selectedChatId, message);
    },
    onSuccess: (newMessages) => {
      if (newMessages) {
        queryClient.setQueryData(["messages", selectedChatId], newMessages);
        setInput("");
        inputRef.current?.focus();
      }
    },
    onError: (error) => {
      console.error("Failed to send message:", error);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
  }

  const handleSelectUsers = async (users: Employee[]) => {
    try {
      if (!currentEmployee) throw new Error("No current employee");

      // Create the chat
      const { data: chat, error: chatError } = await supabase
        .from("chats")
        .insert({
          name: users.length > 1 ? "Group Chat" : users[0].name,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (chatError) throw chatError;

      // Add all participants including the current user
      const participants = [
        ...users.map((user) => ({
          chat_id: chat.id,
          user_id: user.employee_id.toString(),
        })),
        {
          chat_id: chat.id,
          user_id: currentEmployee.employee_id.toString(),
        },
      ];

      const { error: participantError } = await supabase
        .from("chat_participants")
        .insert(participants);

      if (participantError) throw participantError;

      // Create initial system message
      const { error: messageError } = await supabase.from("messages").insert({
        chat_id: chat.id,
        content: "Chat created",
        user_id: currentEmployee.employee_id.toString(),
        is_agent: true,
      });

      if (messageError) throw messageError;

      setSelectedChatId(chat.id);
      setDialogOpen(false);

      // Invalidate both chats and messages queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["chats"] }),
        queryClient.invalidateQueries({ queryKey: ["messages", chat.id] }),
      ]);
    } catch (error) {
      console.error("Failed to create chat:", error);
    }
  };

  return (
    <div className="flex max-h-[calc(100vh-25rem)]">
      <ChatSidebar onSelectChat={setSelectedChatId} />
      <div className="flex-1">
        <Card className="max-h-[calc(100vh-25rem)] border-zinc-800">
          <CardHeader className="flex flex-row items-center">
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage
                  src={
                    currentEmployee?.avatar_url ||
                    "https://utfs.io/f/9jzftpblGSv7zWule6FCYeqvSEFOu6crDAy19t5KBU2kQ0jZ"
                  }
                  alt={currentEmployee?.name || "User"}
                />
                <AvatarFallback>
                  {currentEmployee?.name
                    ? currentEmployee.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                    : "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium leading-none">
                  {currentEmployee?.name || "Loading..."}
                </p>
                <p className="text-sm text-zinc-400">
                  {currentEmployee?.contact_info || "Loading..."}
                </p>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="ml-auto rounded-full text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="w-4 h-4" />
              <span className="sr-only">New message</span>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 overflow-y-auto h-[calc(100vh-35rem)]">
            {(messages as Message[]).map((message) => (
              <div
                key={message.id}
                className={`flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm ${
                  message.is_agent
                    ? "bg-zinc-800 text-zinc-50"
                    : "bg-white text-zinc-950 ml-auto"
                }`}
              >
                {message.content}
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <form
              onSubmit={handleSubmit}
              className="flex items-center w-full space-x-2"
            >
              <Input
                ref={inputRef}
                id="message"
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-50 placeholder:text-zinc-400 focus-visible:ring-zinc-700"
                autoComplete="off"
              />
              <Button
                type="submit"
                size="icon"
                className="bg-zinc-50 text-zinc-950 hover:bg-zinc-300"
              >
                <Send className="w-4 h-4" />
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>
      <NewMessageDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSelectUsers={handleSelectUsers}
      />
      {userError && <div>Error loading user: {userError.message}</div>}
      {employeeError && (
        <div>Error loading employee: {employeeError.message}</div>
      )}
    </div>
  );
}
