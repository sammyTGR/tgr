"use client";

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
import {
  sendMessage,
  sendAndGetMessages,
  getEmployees,
  markMessagesAsRead,
} from "./actions";
import { NewMessageDialog } from "./new-message-dialog";
import { ChatSidebar } from "./chat-sidebar";
import React from "react";
import { useForm } from "react-hook-form";

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

interface ChatState {
  selectedChatId: string | null;
  dialogOpen: boolean;
}

export default function Chat() {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const supabase = createClientComponentClient();
  const {
    register,
    handleSubmit: handleFormSubmit,
    reset,
  } = useForm({
    defaultValues: {
      message: "",
    },
  });

  // Replace the chat state management
  const chatStateQuery = useQuery({
    queryKey: ["chatState"],
    queryFn: () => ({ selectedChatId: null, dialogOpen: false }),
    staleTime: Infinity,
  });

  const updateChatState = useMutation({
    mutationFn: (newState: Partial<ChatState>) => {
      return Promise.resolve(newState);
    },
    onSuccess: (newState) => {
      queryClient.setQueryData(
        ["chatState"],
        (old: ChatState = { selectedChatId: null, dialogOpen: false }) => ({
          ...old,
          ...newState,
        })
      );
    },
  });

  const chatState = chatStateQuery.data || {
    selectedChatId: null,
    dialogOpen: false,
  };

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

  // Messages query with real-time subscription
  const { data: messages = [] } = useQuery({
    queryKey: ["messages", chatState.selectedChatId],
    queryFn: async () => {
      if (!chatState.selectedChatId) return [];
      const { data: messages } = await supabase
        .from("messages")
        .select("id, content, is_agent, created_at")
        .eq("chat_id", chatState.selectedChatId)
        .order("created_at", { ascending: true })
        .limit(50);
      return messages || [];
    },
    enabled: !!chatState.selectedChatId,
  });

  // Real-time subscription query
  useQuery({
    queryKey: ["messageSubscription", chatState.selectedChatId],
    queryFn: async () => {
      const channel = supabase
        .channel("messages")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `chat_id=eq.${chatState.selectedChatId}`,
          },
          () => {
            queryClient.invalidateQueries({
              queryKey: ["messages", chatState.selectedChatId],
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    },
    enabled: !!chatState.selectedChatId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({
      content,
      chatId,
      recipientId,
    }: {
      content: string;
      chatId: string;
      recipientId: string | number;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      const { data: recipientData, error: recipientError } = await supabase
        .from("employees")
        .select("user_uuid")
        .eq("employee_id", recipientId)
        .single();

      if (recipientError || !recipientData?.user_uuid) {
        throw new Error("Could not find recipient user ID");
      }

      if (!isValidUUID(chatId)) {
        throw new Error("Invalid chat ID");
      }

      return sendMessage(content, chatId, user.id, recipientData.user_uuid);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["unreadNotifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      reset();
    },
  });

  const onSubmit = handleFormSubmit((data) => {
    if (!data.message.trim()) return;
    if (!chatState.selectedChatId || !currentEmployee?.employee_id) return;
    sendMessageMutation.mutate({
      content: data.message,
      chatId: chatState.selectedChatId,
      recipientId: currentEmployee.employee_id,
    });
  });

  const handleSelectUsers = useMutation({
    mutationFn: async (users: Employee[]) => {
      if (!currentEmployee) throw new Error("No current employee");
      if (!userData) throw new Error("No user data");

      const { data: employeeUsers, error: userError } = await supabase
        .from("employees")
        .select("user_uuid, contact_info")
        .in(
          "contact_info",
          users.map((u) => u.contact_info)
        )
        .not("user_uuid", "is", null);

      if (userError) throw userError;
      if (!employeeUsers?.length)
        throw new Error("Could not find user IDs for employees");

      // Create chat and handle participants
      const { data: chat, error: chatError } = await supabase
        .from("chats")
        .insert({
          name: users.length > 1 ? "Group Chat" : users[0].name,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (chatError) throw chatError;

      // Add participants including the current user
      const participants = [
        { chat_id: chat.id, user_id: userData.id },
        ...employeeUsers.map((eu) => ({
          chat_id: chat.id,
          user_id: eu.user_uuid,
        })),
      ];

      const { error: participantsError } = await supabase
        .from("chat_participants")
        .insert(participants);

      if (participantsError) throw participantsError;

      return chat;
    },
    onSuccess: (chat) => {
      updateChatState.mutate({ selectedChatId: chat.id, dialogOpen: false });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      queryClient.invalidateQueries({ queryKey: ["chats", userData?.id] });
      queryClient.invalidateQueries({
        queryKey: ["messages", chat.id],
        exact: true,
      });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (chatId: string) => {
      if (!userData) return;
      await markMessagesAsRead(chatId, userData.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });

  const handleChatSelect = (chatId: string) => {
    updateChatState.mutate({ selectedChatId: chatId });
    if (currentEmployee) {
      // Mark messages as read
      markAsReadMutation.mutate(chatId);
      // Also mark notifications as read for this chat
      queryClient.invalidateQueries({
        queryKey: ["notifications"],
        exact: true,
      });
    }
  };

  const handleDialogChange = (open: boolean) => {
    updateChatState.mutate({ dialogOpen: open });
  };

  const deleteChat = useMutation({
    mutationFn: async (chatId: string) => {
      const { error } = await supabase.from("chats").delete().eq("id", chatId);
      if (error) throw error;
    },
    onSuccess: () => {
      // Reset selected chat if the deleted chat was selected
      const currentState = queryClient.getQueryData<ChatState>(["chatState"]);
      if (currentState?.selectedChatId === chatState.selectedChatId) {
        updateChatState.mutate({ selectedChatId: null });
      }
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });

  return (
    <div className="flex max-h-[calc(100vh-25rem)] w-[45rem] border-zinc-800">
      <ChatSidebar
        onSelectChat={handleChatSelect}
        onDeleteChat={deleteChat.mutate}
      />
      <div className="flex-1">
        <Card className="max-h-[calc(100vh-25rem)] border-zinc-800 w-[30rem]">
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
              onClick={() => handleDialogChange(true)}
            >
              <Plus className="w-4 h-4" />
              <span className="sr-only">New message</span>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 overflow-y-auto h-[calc(100vh-35rem)]">
            {!chatState.selectedChatId ? (
              <div className="flex h-full items-center justify-center text-zinc-400">
                <p>Select a chat or start a new conversation</p>
              </div>
            ) : (
              messages.map((message) => (
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
              ))
            )}
          </CardContent>
          <CardFooter>
            <form
              onSubmit={onSubmit}
              className="flex items-center w-full space-x-2"
            >
              <Input
                id="message"
                placeholder="Type your message..."
                {...register("message")}
                className="flex-1 bg-muted border-zinc-700 placeholder:text-zinc-400 focus-visible:ring-zinc-700"
                autoComplete="off"
                disabled={!chatState.selectedChatId}
              />
              <Button
                type="submit"
                size="icon"
                className="bg-zinc-50 text-zinc-950 hover:bg-zinc-300"
                disabled={!chatState.selectedChatId}
              >
                <Send className="w-4 h-4" />
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>
      <NewMessageDialog
        open={chatState.dialogOpen}
        onOpenChange={handleDialogChange}
        onSelectUsers={handleSelectUsers.mutate}
      />
      {userError && <div>Error loading user: {userError.message}</div>}
      {employeeError && (
        <div>Error loading employee: {employeeError.message}</div>
      )}
    </div>
  );
}

function isValidUUID(uuid: string) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
