"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatItem {
  id: string;
  name: string;
  participants: Array<{
    user_id: string;
    employee_name?: string;
  }>;
  lastMessage: string;
  isGroup: boolean;
}

export function ChatSidebar({
  onSelectChat,
}: {
  onSelectChat: (chatId: string) => void;
}) {
  const supabase = createClientComponentClient();
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
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

  const { data: chats = [] } = useQuery({
    queryKey: ["chats", currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];

      // First get all chats with their participants
      const { data: chatsData, error: chatsError } = await supabase
        .from("chats")
        .select(
          `
          id,
          name,
          participants:chat_participants(user_id),
          messages:messages(content)
        `
        )
        .eq("chat_participants.user_id", currentUser.id)
        .order("updated_at", { ascending: false });

      if (chatsError) {
        console.error("Error fetching chats:", chatsError);
        return [];
      }

      // Then get employee names for all participants
      const participantIds = chatsData
        .flatMap((chat) => chat.participants)
        .map((p) => p.user_id)
        .filter((id): id is string => !!id);

      const { data: employees, error: employeesError } = await supabase
        .from("employees")
        .select("employee_id, name")
        .in("employee_id", participantIds);

      if (employeesError) {
        console.error("Error fetching employees:", employeesError);
        return [];
      }

      // Create a map of employee_id to name for easy lookup
      const employeeMap = new Map(
        employees?.map((emp) => [emp.employee_id.toString(), emp.name]) || []
      );

      return chatsData.map((chat): ChatItem => {
        const otherParticipant = chat.participants.find(
          (p) => p.user_id !== currentUser.id
        );

        return {
          id: chat.id,
          name:
            chat.name ||
            (chat.participants.length === 2
              ? employeeMap.get(otherParticipant?.user_id || "") ||
                "Direct Message"
              : "Group Chat"),
          participants: chat.participants.map((p) => ({
            user_id: p.user_id,
            employee_name: employeeMap.get(p.user_id),
          })),
          lastMessage: chat.messages[0]?.content || "No messages yet",
          isGroup: chat.participants.length > 2,
        };
      });
    },
    enabled: !!currentUser?.id,
  });

  // Subscribe to chat updates
  const channel = supabase
    .channel("chats")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "chats" },
      () => {
        queryClient.invalidateQueries({ queryKey: ["chats", currentUser?.id] });
      }
    )
    .subscribe();

  const deleteChat = useMutation({
    mutationFn: async (chatId: string) => {
      const { error } = await supabase.from("chats").delete().eq("id", chatId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
    onError: (error) => {
      console.error("Failed to delete chat:", error);
    },
  });

  return (
    <div className="w-64 bg-muted border-r border-zinc-800 max-h-full overflow-hidden">
      <h2 className="text-xl font-semibold p-4">Chats</h2>
      <ScrollArea className="h-[calc(100vh-25rem)]">
        {chats.map((chat) => (
          <div key={chat.id} className="group relative">
            <button
              className="w-full text-left p-4 hover:bg-zinc-800 transition-colors"
              onClick={() => onSelectChat(chat.id)}
            >
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage
                    src={
                      chat.isGroup ? "/group-avatar.png" : "/user-avatar.png"
                    }
                  />
                  <AvatarFallback>{chat.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{chat.name}</p>
                  {chat.isGroup && (
                    <p className="text-xs text-zinc-400">
                      {chat.participants.length} members
                    </p>
                  )}
                  <p className="text-sm text-zinc-400 truncate">
                    {chat.lastMessage}
                  </p>
                </div>
              </div>
            </button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Are you sure you want to delete this chat?")) {
                  deleteChat.mutate(chat.id);
                }
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete chat</span>
            </Button>
          </div>
        ))}
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </div>
  );
}
