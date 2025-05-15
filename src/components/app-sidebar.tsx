'use client';

import * as React from 'react';
import {
  BookOpen,
  Bot,
  Command,
  Frame,
  LifeBuoy,
  Map,
  PieChart,
  Send,
  Settings2,
  SquareTerminal,
  FileTextIcon,
  CalendarIcon,
} from 'lucide-react';

import { NavMain } from '@/components/nav-main';
// import { NavProjects } from "@/components/nav-projects"
// import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
} from '@/components/ui/sidebar';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  navMain: [
    {
      title: 'Playground',
      url: '#',
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: 'History',
          url: '#',
        },
        {
          title: 'Starred',
          url: '#',
        },
        {
          title: 'Settings',
          url: '#',
        },
      ],
    },
    {
      title: 'Models',
      url: '#',
      icon: Bot,
      items: [
        {
          title: 'Genesis',
          url: '#',
        },
        {
          title: 'Explorer',
          url: '#',
        },
        {
          title: 'Quantum',
          url: '#',
        },
      ],
    },
    {
      title: 'Documentation',
      url: '#',
      icon: BookOpen,
      items: [
        {
          title: 'Introduction',
          url: '#',
        },
        {
          title: 'Get Started',
          url: '#',
        },
        {
          title: 'Tutorials',
          url: '#',
        },
        {
          title: 'Changelog',
          url: '#',
        },
      ],
    },
    {
      title: 'Settings',
      url: '#',
      icon: Settings2,
      items: [
        {
          title: 'General',
          url: '#',
        },
        {
          title: 'Team',
          url: '#',
        },
        {
          title: 'Billing',
          url: '#',
        },
        {
          title: 'Limits',
          url: '#',
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: 'Support',
      url: '#',
      icon: LifeBuoy,
    },
    {
      title: 'Feedback',
      url: '#',
      icon: Send,
    },
  ],
  projects: [
    {
      name: 'Design Engineering',
      url: '#',
      icon: Frame,
    },
    {
      name: 'Sales & Marketing',
      url: '#',
      icon: PieChart,
    },
    {
      name: 'Travel',
      url: '#',
      icon: Map,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
    staleTime: Infinity,
  });

  const { data: userData } = useQuery({
    queryKey: ['userRole'],
    queryFn: async () => {
      const response = await fetch('/api/getUserRole');
      if (!response.ok) {
        throw new Error('Failed to fetch user role');
      }
      const data = await response.json();
      return data;
    },
    enabled: !!currentUser,
    staleTime: Infinity,
  });

  const { data: employeeData } = useQuery({
    queryKey: ['employee', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return null;
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('user_uuid', currentUser.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!currentUser?.id,
  });

  // Unread counts queries
  const { data: unreadOrdersData = { unreadOrderCount: 0 } } = useQuery({
    queryKey: ['unreadOrders'],
    queryFn: async () => {
      const response = await fetch('/api/useUnreadOrders');
      if (!response.ok) throw new Error('Failed to fetch unread orders');
      return response.json();
    },
    enabled: !!currentUser,
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  const { data: unreadTimeOffData = { unreadTimeOffCount: 0 } } = useQuery({
    queryKey: ['unreadTimeOff'],
    queryFn: async () => {
      const response = await fetch('/api/useUnreadTimeOffRequests');
      if (!response.ok) throw new Error('Failed to fetch unread time-off requests');
      return response.json();
    },
    enabled: !!currentUser,
    refetchInterval: 300000,
  });

  // Add subscription queries
  useQuery({
    queryKey: ['ordersSubscription'],
    queryFn: async () => {
      const channel = supabase
        .channel('orders')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          queryClient.invalidateQueries({ queryKey: ['unreadOrders'] });
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    },
    enabled: !!currentUser,
    gcTime: 0,
    staleTime: Infinity,
  });

  useQuery({
    queryKey: ['timeOffSubscription'],
    queryFn: async () => {
      const channel = supabase
        .channel('time_off_requests')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'time_off_requests' },
          () => {
            queryClient.invalidateQueries({ queryKey: ['unreadTimeOff'] });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    },
    enabled: !!currentUser,
    gcTime: 0,
    staleTime: Infinity,
  });

  const isAdmin = ['super admin', 'ceo', 'dev', 'admin'].includes(userData?.role);

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={
                        currentUser?.user_metadata?.avatar_url ||
                        'https://utfs.io/f/9jzftpblGSv7nvddLr3ZYIXtyiAHqxfuS6V9231FedsGbMWh'
                      }
                      alt={currentUser?.email || ''}
                    />
                    <AvatarFallback className="rounded-lg">
                      {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">TGR</span>
                  <span className="truncate text-xs">{userData?.role || 'Loading...'}</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {isAdmin && (
            <>
              <SidebarMenuItem>
                <SidebarMenuButton
                  size="lg"
                  asChild
                  onClick={() => router.push('/sales/orderreview')}
                >
                  <a href="/sales/orderreview">
                    <FileTextIcon className="h-4 w-4" />
                    <span>Special Orders</span>
                  </a>
                </SidebarMenuButton>
                {unreadOrdersData.unreadOrderCount > 0 && (
                  <SidebarMenuBadge>{unreadOrdersData.unreadOrderCount}</SidebarMenuBadge>
                )}
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  size="lg"
                  asChild
                  onClick={() => router.push('/admin/timeoffreview')}
                >
                  <a href="/admin/timeoffreview">
                    <CalendarIcon className="h-4 w-4" />
                    <span>Time Off Requests</span>
                  </a>
                </SidebarMenuButton>
                {unreadTimeOffData.unreadTimeOffCount > 0 && (
                  <SidebarMenuBadge>{unreadTimeOffData.unreadTimeOffCount}</SidebarMenuBadge>
                )}
              </SidebarMenuItem>
            </>
          )}
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
        {/* <NavProjects projects={data.projects} /> */}
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
