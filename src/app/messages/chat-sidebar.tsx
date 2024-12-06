"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  onDeleteChat,
}: {
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
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

  // Subscribe to real-time updates for chats, messages, and chat_participants
  useQuery({
    queryKey: ["chatSubscription", currentUser?.id],
    queryFn: async () => {
      const channel = supabase
        .channel("chat-updates")
        .on(
          "postgres_changes",
          {
            event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
            schema: "public",
            table: "chats",
          },
          () => {
            queryClient.invalidateQueries({
              queryKey: ["chats", currentUser?.id],
              exact: true,
            });
          }
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
          },
          () => {
            queryClient.invalidateQueries({
              queryKey: ["chats", currentUser?.id],
              exact: true,
            });
          }
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat_participants",
          },
          () => {
            queryClient.invalidateQueries({
              queryKey: ["chats", currentUser?.id],
              exact: true,
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    },
    enabled: !!currentUser?.id,
  });

  const { data: chats = [] } = useQuery({
    queryKey: ["chats", currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];

      const { data: chatsData, error: chatsError } = await supabase
        .from("chats")
        .select(
          `
          id,
          name,
          participants:chat_participants(user_id),
          messages:messages!left(
            id,
            content,
            created_at,
            message_reads!left(
              user_id
            )
          )
        `
        )
        .eq("chat_participants.user_id", currentUser.id)
        .order("updated_at", { ascending: false });

      if (chatsError) {
        console.error("Error fetching chats:", chatsError);
        throw chatsError;
      }

      return (
        chatsData?.map((chat) => {
          const unreadCount =
            chat.messages?.filter((msg) => {
              const hasRead = msg.message_reads?.some(
                (read) => read.user_id === currentUser?.id
              );
              return !hasRead;
            }).length || 0;

          return {
            ...chat,
            isGroup: chat.participants.length > 2,
            unreadCount,
            participants: chat.participants.map((p: { user_id: string }) => ({
              user_id: p.user_id,
            })),
          };
        }) || []
      );
    },
    enabled: !!currentUser?.id,
  });

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

  const DeleteButton = ({ chatId }: { chatId: string }) => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => e.stopPropagation()}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10 hover:text-red-500"
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete chat</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the chat
            and remove all messages.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => onDeleteChat(chatId)}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return (
    <div className="w-[45rem] rounded-md border border-zinc-800 max-h-[calc(100vh-25rem)] overflow-hidden">
      <h2 className="text-xl font-semibold p-4">Chats</h2>
      <ScrollArea className="h-[calc(100vh-25rem)]">
        {chats.length === 0 ? (
          <div className="p-4 text-zinc-400 text-center">
            No chats yet. Start a new conversation!
          </div>
        ) : (
          chats.map((chat) => (
            <div key={chat.id} className="group relative">
              <button
                className="w-full text-left p-4 hover:bg-muted hover:border-zinc-700 transition-colors"
                onClick={() => onSelectChat(chat.id)}
              >
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={chat.name[0]} />
                    <AvatarFallback>{chat.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{chat.name}</p>
                    {chat.isGroup && (
                      <p className="text-xs text-zinc-400 truncate">
                        {chat.participants.length} members
                      </p>
                    )}
                    <p className="text-sm text-zinc-400 truncate">
                      {chat.unreadCount > 0 ? (
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-blue-500" />
                          {chat.unreadCount} new
                        </span>
                      ) : (
                        "All caught up"
                      )}
                    </p>
                  </div>
                </div>
              </button>
              <DeleteButton chatId={chat.id} />
            </div>
          ))
        )}
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </div>
  );
}
