'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { ModeToggle } from '@/components/mode-toggle';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { HomeIcon, ChatBubbleIcon, DotFilledIcon } from '@radix-ui/react-icons';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import { supabase } from '@/utils/supabase/client';
import RoleBasedWrapper from '@/components/RoleBasedWrapper';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { PersonIcon, ShadowIcon, SunIcon, MoonIcon } from '@radix-ui/react-icons';
import LoadingIndicator from '@/components/LoadingIndicator';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

const schedComponents = [
  {
    title: 'Team Calendar',
    href: '/TGR/crew/calendar',
    description: 'Calendar & Time Off Requests',
  },
  // {
  //   title: "Time Off Request",
  //   href: "/TGR/crew/timeoffrequest",
  //   description: "Submit A Request",
  // },
];

const serviceComponents = [
  {
    title: 'Special Order Form',
    href: '/sales/orders',
    description: 'Submit Requests For Customers',
  },
  {
    title: 'Check On Orders',
    href: '/sales/orderreview/crew',
    description: 'Check On Submitted Order Status',
  },
];

const formComps = [
  {
    title: 'Gunsmithing',
    href: '/TGR/gunsmithing',
    description: 'Weekly Firearms Maintenance',
  },
  {
    title: 'Certifications',
    href: '/TGR/certifications',
    description: 'View All Certifications',
  },
  {
    title: 'Bulletin Board',
    href: '/TGR/crew/bulletin',
    description: 'Bulletin Board',
  },
  {
    title: 'Patch Notes',
    href: '/patch-notes',
    description: 'Site Updates',
  },
];

const LazyNavigationMenu = dynamic(
  () =>
    import('@/components/ui/navigation-menu').then((module) => ({
      default: module.NavigationMenu,
    })),
  {
    loading: () => <LoadingIndicator />,
  }
);

const LazyNavigationMenuList = dynamic(
  () =>
    import('@/components/ui/navigation-menu').then((module) => ({
      default: module.NavigationMenuList,
    })),
  {
    loading: () => <LoadingIndicator />,
  }
);

const LazyDropdownMenu = dynamic(
  () =>
    import('@/components/ui/dropdown-menu').then((module) => ({
      default: module.DropdownMenu,
    })),
  {
    loading: () => <LoadingIndicator />,
  }
);

const HeaderGunsmith = React.memo(() => {
  const { setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    },
  });

  const { data: employeeData, isLoading: employeeLoading } = useQuery({
    queryKey: ['employee', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('role, employee_id')
        .eq('user_uuid', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: unreadMessages, isLoading: messagesLoading } = useQuery({
    queryKey: ['unread-messages', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('id, read_by')
        .or(`receiver_id.eq.${user?.id},sender_id.eq.${user?.id}`);

      if (error) throw error;

      return data?.filter((msg) => msg.read_by && !msg.read_by.includes(user?.id)) || [];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const handleHomeClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (employeeData?.employee_id) {
      router.push(`/TGR/crew/profile/${employeeData.employee_id}`);
    } else {
      router.push('/');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleChatClick = async () => {
    if (!user?.id) return;

    // Update messages as read
    const messageIds = unreadMessages?.map((msg) => msg.id) || [];
    if (messageIds.length > 0) {
      for (const messageId of messageIds) {
        await supabase
          .from('direct_messages')
          .update({
            read_by: [
              ...(unreadMessages?.find((msg) => msg.id === messageId)?.read_by || []),
              user.id,
            ],
          })
          .eq('id', messageId);
      }
    }

    router.push('/TGR/crew/chat');
  };

  const isLoading = userLoading || employeeLoading || messagesLoading;
  const totalUnreadCount = unreadMessages?.length || 0;

  return (
    <RoleBasedWrapper allowedRoles={['gunsmith']}>
      {isLoading && <LoadingIndicator />}
      <header className="flex justify-between items-center p-2">
        <LazyNavigationMenu>
          <LazyNavigationMenuList className="flex space-x-4 mr-3 ml-1">
            <NavigationMenuItem>
              <Link href="/TGR/sop">
                <Button variant="linkHover2">TGR SOPs</Button>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Scheduling</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                  {schedComponents.map((component) => (
                    <ListItem key={component.title} title={component.title} href={component.href}>
                      {component.description}
                    </ListItem>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Forms & Reports</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                  {formComps.map((component) => (
                    <ListItem key={component.title} title={component.title} href={component.href}>
                      {component.description}
                    </ListItem>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Sales & Service</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                  {serviceComponents.map((sched) => (
                    <ListItem key={sched.title} title={sched.title} href={sched.href}>
                      {sched.description}
                    </ListItem>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </LazyNavigationMenuList>
        </LazyNavigationMenu>
        <div className="flex items-center mr-1">
          <Button variant="linkHover2" size="icon" onClick={handleHomeClick}>
            <HomeIcon />
          </Button>
          {user ? (
            <>
              <LazyDropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="linkHover2"
                    size="icon"
                    className="mr-2 relative"
                    onClick={handleChatClick}
                  >
                    <PersonIcon />
                    {totalUnreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 text-red-500 text-xs font-bold">
                        {totalUnreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mr-2">
                  <DropdownMenuLabel>Profile & Settings</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {/* <DropdownMenuItem>
                    <Link
                      href="/TGR/employees/profiles"
                      className="flex items-center w-full"
                    >
                      <PersonIcon className="mr-2 h-4 w-4" />

                      <span>Manage Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator /> */}

                  <DropdownMenuItem onClick={handleChatClick}>
                    <ChatBubbleIcon className="mr-2 h-4 w-4" />
                    <span>Messages</span>
                    {totalUnreadCount > 0 && (
                      <span className="ml-auto text-red-500 font-bold">{totalUnreadCount}</span>
                    )}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <ShadowIcon className="mr-2 h-4 w-4" />
                      <span>Change Theme</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={() => setTheme('light')}>
                          <SunIcon className="mr-2 h-4 w-4" />
                          <span>Light</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme('dark')}>
                          <MoonIcon className="mr-2 h-4 w-4" />
                          <span>Dark</span>
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={handleSignOut}>Sign Out</DropdownMenuItem>
                </DropdownMenuContent>
              </LazyDropdownMenu>
            </>
          ) : (
            <Link href="/sign-in">
              <Button variant="linkHover2">Sign In</Button>
            </Link>
          )}
        </div>
      </header>
    </RoleBasedWrapper>
  );
});

HeaderGunsmith.displayName = 'HeaderGunsmith';

const ListItem = React.forwardRef<React.ElementRef<'a'>, React.ComponentPropsWithoutRef<'a'>>(
  ({ className, title, children, href, ...props }, ref) => {
    const queryClient = useQueryClient();
    const router = useRouter();

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      queryClient.invalidateQueries({ queryKey: ['navigation'] });
      router.push(href || '');
    };

    return (
      <li>
        <NavigationMenuLink asChild>
          <a
            ref={ref}
            href={href}
            onClick={handleClick}
            className={cn(
              'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
              className
            )}
            {...props}
          >
            <div className="text-sm font-medium leading-none">{title}</div>
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{children}</p>
          </a>
        </NavigationMenuLink>
      </li>
    );
  }
);

ListItem.displayName = 'ListItem';

export default HeaderGunsmith;
