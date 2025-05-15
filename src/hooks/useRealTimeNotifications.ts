import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

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
    queryKey: ['unreadNotifications'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('read', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return notifications || [];
    },
    refetchInterval: 30000, // Reduced to every 30 seconds instead of 1 second
    refetchOnWindowFocus: true,
    staleTime: 5000, // Cache data for 5 seconds
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
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
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
    },
  });

  const markNotificationsAsReadMutation = useMutation({
    mutationFn: async (chatId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('chat_id', chatId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['notifications'],
        exact: true,
      });
    },
  });

  // Subscribe to new notifications
  useQuery({
    queryKey: ['notificationsSubscription'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const channel = supabase
        .channel(`notifications-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          async (payload) => {
            // Only refetch on INSERT or when read status changes
            if (
              payload.eventType === 'INSERT' ||
              (payload.eventType === 'UPDATE' && payload.old?.read !== payload.new?.read)
            ) {
              await queryClient.refetchQueries({
                queryKey: ['unreadNotifications'],
                exact: true,
              });

              if (payload.eventType === 'INSERT') {
                toast(payload.new.content, {
                  action: {
                    label: 'View',
                    onClick: () => router.push(`/messages?chat=${payload.new.chat_id}`),
                  },
                });
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    },
    staleTime: Infinity, // Keep subscription active
    gcTime: Infinity,
  });

  return {
    unreadNotifications,
    markAsRead: markAsReadMutation.mutateAsync,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
    markNotificationsAsRead: markNotificationsAsReadMutation.mutateAsync,
  };
}
