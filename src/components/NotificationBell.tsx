'use client';

import { Bell, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { useRealTimeNotifications, Notification } from '@/hooks/useRealTimeNotifications';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { useRouter } from 'next/navigation';

export function NotificationBell() {
  const { unreadNotifications = [], markAsRead, markAllAsRead } = useRealTimeNotifications();
  const router = useRouter();

  const handleNotificationClick = async (notification: Notification) => {
    try {
      await markAsRead(notification.id);
      router.push(`/messages?chat=${notification.chat_id}`);
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative">
          <Bell className="h-4 w-4" />
          {unreadNotifications.length > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
              {unreadNotifications.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {unreadNotifications.length === 0 ? (
          <DropdownMenuItem>No new notifications</DropdownMenuItem>
        ) : (
          <>
            {unreadNotifications.map((notification: Notification) => (
              <DropdownMenuItem
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className="cursor-pointer hover:bg-accent"
              >
                {notification.content}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleClearAll}
              className="text-red-500 focus:text-red-500 cursor-pointer hover:bg-accent"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All Notifications
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
