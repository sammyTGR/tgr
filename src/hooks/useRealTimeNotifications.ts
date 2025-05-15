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

  // Optimized notifications query with proper indexing
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });

  // Optimized realtime subscription
  useQuery({
    queryKey: ['notificationsSubscription'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      // Create a single channel for all notification types
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
            // Batch updates to reduce query invalidation frequency
            if (
              payload.eventType === 'INSERT' ||
              (payload.eventType === 'UPDATE' && payload.old?.read !== payload.new?.read)
            ) {
              // Use optimistic updates for better UX
              queryClient.setQueryData(['notifications'], (old: any) => {
                if (!old) return [payload.new];

                if (payload.eventType === 'INSERT') {
                  return [payload.new, ...old];
                }

                return old.map((item: any) => (item.id === payload.new.id ? payload.new : item));
              });

              // Only show toast for new notifications
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
    staleTime: Infinity,
    gcTime: Infinity,
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

  return {
    unreadNotifications: notifications,
    markAsRead: markAsReadMutation.mutateAsync,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
    markNotificationsAsRead: markNotificationsAsReadMutation.mutateAsync,
  };
}
