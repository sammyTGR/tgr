import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  content: string;
  chat_id: string;
  read: boolean;
  created_at: string;
}

interface UseRealTimeNotificationsReturn {
  unreadNotifications: Notification[];
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markNotificationsAsRead: (chatId: string) => Promise<void>;
}

export function useRealTimeNotifications(): UseRealTimeNotificationsReturn {
  const supabase = createClientComponentClient();
  const queryClient = useQueryClient();
  const router = useRouter();

  // Fetch unread notifications
  const { data: unreadNotifications = [] } = useQuery<Notification[]>({
    queryKey: ["unreadNotifications"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: notifications, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .eq("read", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return notifications || [];
    },
    // Add these options for more frequent updates
    refetchInterval: 3000, // Refetch every 3 seconds
    refetchOnWindowFocus: true,
    staleTime: 0, // Consider data always stale
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unreadNotifications"] });
    },
  });

  // Mark all notifications as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unreadNotifications"] });
    },
  });

  const markNotificationsAsReadMutation = useMutation({
    mutationFn: async (chatId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("chat_id", chatId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications"],
        exact: true,
      });
    },
  });

  // Subscribe to new notifications
  useQuery({
    queryKey: ["notificationsSubscription"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const channel = supabase
        .channel("notifications")
        .on(
          "postgres_changes",
          {
            event: "*", // Listen to all changes (INSERT, UPDATE, DELETE)
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            // Immediately invalidate the query to trigger a refetch
            queryClient.invalidateQueries({
              queryKey: ["unreadNotifications"],
            });

            // Show toast notification for new messages
            if (payload.eventType === "INSERT") {
              toast(payload.new.content, {
                action: {
                  label: "View",
                  onClick: () =>
                    router.push(`/messages?chat=${payload.new.chat_id}`),
                },
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  return {
    unreadNotifications,
    markAsRead: markAsReadMutation.mutateAsync,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
    markNotificationsAsRead: markNotificationsAsReadMutation.mutateAsync,
  };
}
