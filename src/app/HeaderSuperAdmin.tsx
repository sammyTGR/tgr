'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  ChatBubbleIcon,
  HomeIcon,
  CalendarIcon,
  FileTextIcon,
  DotFilledIcon,
  PersonIcon,
  SunIcon,
  MoonIcon,
  ShadowIcon,
  Pencil2Icon,
  DashboardIcon,
} from '@radix-ui/react-icons';
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
// import useUnreadMessages from "@/app/api/fetch-unread/route";
// import useUnreadOrders from "@/app/api/useUnreadOrders";
// import useUnreadTimeOffRequests from "@/app/api/useUnreadTimeOffRequests/route";
import RoleBasedWrapper from '@/components/RoleBasedWrapper';
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
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';
import LoadingIndicator from '@/components/LoadingIndicator';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface HeaderSuperAdminProps {
  totalUnreadCount: number;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id?: string;
  group_chat_id?: string;
  message: string;
  created_at: string;
  is_read?: boolean;
  read_by?: string[];
}

const auditComponents = [
  {
    title: 'Submit & Review Audits',
    href: '/admin/audits',
    description: 'Enter Audits & Review Existing Ones',
  },
  {
    title: 'DROS Guidance',
    href: '/TGR/dros/guide',
    description: "Sometimes We All Need A Lil' Help",
  },
];

const schedComponents = [
  {
    title: 'Team Calendar',
    href: '/TGR/crew/calendar',
    description: 'Schedules & Time Off Requests',
  },
  // {
  //   title: "Submit Time Off",
  //   href: "/TGR/crew/timeoffrequest",
  //   description: "Submit A Request",
  // },
  {
    title: 'Review Time Off Requests',
    href: '/admin/timeoffreview',
    description: 'View All Requests For Time Off',
  },
  {
    title: 'Staff Profiles',
    href: '/admin/dashboard',
    description: 'All Profiles',
  },
  {
    title: 'Create | Manage Schedules',
    href: '/admin/schedules',
    description: 'Manage Schedules & Timesheets',
  },
];

const serviceComponents = [
  {
    title: 'Submit Requests',
    href: '/sales/orders',
    description: 'Submit Requests For Customers',
  },
  {
    title: 'View Orders',
    href: '/sales/orderreview',
    description: 'View Customer Requests',
  },
  {
    title: 'Safety Waiver',
    href: '/public/waiver',
    description: 'Submit A Safety Waiver',
  },
  {
    title: 'Review Waivers',
    href: '/sales/waiver/checkin',
    description: 'Review Waivers & Check Customers In',
  },
];

const formComps = [
  {
    title: 'Range Walks',
    href: '/TGR/rangewalk',
    description: 'Submit Daily Range Walks',
  },
  {
    title: 'Daily Deposits',
    href: '/TGR/deposits',
    description: 'Submit Daily Deposits',
  },
  {
    title: 'Points Submissions',
    href: '/TGR/crew/points',
    description: 'Report All Submitted Points',
  },
  {
    title: 'Checklist',
    href: '/TGR/rentals/checklist',
    description: 'Daily Rental Checklist',
  },
];

const sopComps = [
  {
    title: 'TGR SOPs',
    href: '/TGR/sop',
    description: 'SOPs For Front Of The House',
  },
  {
    title: 'Admin SOPs',
    href: '/admin/sop',
    description: 'SOPs For Back Of The House',
  },
];

const reportsComps = [
  {
    title: 'Daily Sales',
    href: '/admin/reports/sales',
    description: 'Set Categories & View Sales',
  },
  {
    title: 'Test Charts',
    href: '/admin/reports/charts',
    description: 'Build Charts',
  },
  {
    title: 'Range Walks & Repairs',
    href: '/TGR/rangewalk/report',
    description: 'View All Range Walks & Repairs',
  },
  {
    title: 'Certifications',
    href: '/TGR/certifications',
    description: 'View All Certifications',
  },
  {
    title: 'Review Orders',
    href: '/sales/orderreview',
    description: 'View Submitted Orders',
  },
  {
    title: 'Gunsmithing',
    href: '/TGR/gunsmithing',
    description: 'Weekly Gunsmithing Maintenance',
  },
  {
    title: 'Monthly Contest',
    href: '/admin/audits/contest',
    description: 'Monthly Sales Contest',
  },
];

const manageComps = [
  {
    title: 'Staff Profiles',
    href: '/admin/dashboard',
    description: 'All Profiles',
  },
  {
    title: 'Weekly Notes',
    href: '/admin/meetings',
    description: 'Update This Weekly',
  },
  {
    title: 'Monthly Contest',
    href: '/admin/audits/contest',
    description: 'Monthly Sales Contest',
  },
  {
    title: 'Sales Report',
    href: '/admin/reports/sales',
    description: 'View Daily Sales',
  },
  {
    title: 'Download Reports',
    href: '/admin/reports/download',
    description: 'Download Various Reports',
  },
  {
    title: 'Manage Employee Data',
    href: '/TGR/employees',
    description: 'Set All Employee Details',
  },
  {
    title: 'Audit Management',
    href: '/admin/audits',
    description: 'Testing Audits',
  },
  {
    title: 'Upload Files',
    href: '/admin/upload',
    description: 'Uploadthing',
  },
  {
    title: 'Reports Dashboard',
    href: '/admin/reports/dashboard',
    description: 'Daily Dashboard',
  },
  {
    title: 'Onboarding',
    href: '/admin/onboarding',
    description: 'Trial Onboarding',
  },
  {
    title: 'Products & Pricing',
    href: '/pricing',
    description: 'All Products & Subscriptions',
  },
  {
    title: 'Classes Schedule',
    href: '/public/classes',
    description: 'Class Scheduling Page',
  },
];

const comboComps = [
  {
    title: 'Safety Waiver',
    href: '/public/waiver',
    description: 'Submit A Safety Waiver',
  },
  {
    title: 'Review Waivers',
    href: '/sales/waiver/checkin',
    description: 'Review Waivers & Check-Ins',
  },
  {
    title: 'View Certifications',
    href: '/TGR/certifications',
    description: 'View All Certifications',
  },
  {
    title: 'Range Walks & Repairs',
    href: '/TGR/crew/range',
    description: 'Daily Range Walks & Repairs',
  },
  // {
  //   title: "Submit Range Repairs",
  //   href: "/TGR/rangewalk/report",
  //   description: "View All Range Walks & Repairs",
  // },
  {
    title: 'Submit Daily Deposits',
    href: '/TGR/deposits',
    description: 'Daily Deposits',
  },
  {
    title: 'Submit Claimed Points',
    href: '/TGR/crew/points',
    description: 'Report All Submitted Points',
  },
  {
    title: 'Submit Special Orders',
    href: '/sales/orders',
    description: 'Submit Requests For Customers',
  },
  {
    title: 'Special Orders Report',
    href: '/sales/orderreview',
    description: 'View Submitted Orders',
  },
  {
    title: 'Gunsmithing',
    href: '/TGR/gunsmithing',
    description: 'Weekly Gunsmithing Maintenance',
  },
  {
    title: 'Rental Firearms Checklist',
    href: '/TGR/rentals/checklist',
    description: 'Rental Inventory Check',
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

const HeaderSuperAdmin = React.memo(() => {
  const [user, setUser] = useState<any>(null);
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const router = useRouter();
  const { setTheme } = useTheme();
  // const { totalUnreadCount, resetUnreadCounts } = useUnreadCounts();
  const [unreadOrderCount, setUnreadOrderCount] = useState(0);
  const [unreadTimeOffCount, setUnreadTimeOffCount] = useState(0);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { isLoading } = useQuery({
    queryKey: ['navigation', pathname, searchParams],
    queryFn: async () => {
      // Simulate a delay to show the loading indicator
      await new Promise((resolve) => setTimeout(resolve, 100));
      return null;
    },
    staleTime: 0, // Always refetch on route change
    refetchInterval: 0, // Disable automatic refetching
  });

  const fetchUnreadOrders = async () => {
    try {
      const response = await fetch('/api/useUnreadOrders');
      const data = await response.json();
      setUnreadOrderCount(data.unreadOrderCount);
    } catch (error) {
      console.error('Error fetching unread orders:', error);
    }
  };

  const fetchUnreadTimeOffRequests = async () => {
    try {
      const response = await fetch('/api/useUnreadTimeOffRequests');
      const data = await response.json();
      setUnreadTimeOffCount(data.unreadTimeOffCount);
    } catch (error) {
      console.error('Error fetching unread time-off requests:', error);
    }
  };

  const fetchUserAndEmployee = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (userData && userData.user) {
      setUser(userData.user);
      const { data: employeeData, error } = await supabase
        .from('employees')
        .select('employee_id')
        .eq('user_uuid', userData.user.id)
        .single();
      if (error) {
        console.error('Error fetching employee data:', error.message);
      } else {
        setEmployeeId(employeeData.employee_id);
      }
    } else {
      setUser(null);
      setEmployeeId(null);
    }
  }, []);

  useEffect(() => {
    fetchUserAndEmployee();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        fetchUserAndEmployee();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setEmployeeId(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchUserAndEmployee]);

  useEffect(() => {
    if (user) {
      fetchUnreadOrders();
      fetchUnreadTimeOffRequests();

      const ordersSubscription = supabase
        .channel('orders')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          fetchUnreadOrders
        )
        .subscribe();

      const timeOffSubscription = supabase
        .channel('time_off_requests')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'time_off_requests' },
          fetchUnreadTimeOffRequests
        )
        .subscribe();

      return () => {
        ordersSubscription.unsubscribe();
        timeOffSubscription.unsubscribe();
      };
    }
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = '/';
  };

  const handleChatClick = () => {
    router.push('/TGR/crew/chat');
  };

  const profileComps = [
    {
      title: 'Notes',
      href: '/admin/todo',
      description: 'All Kinda Notes',
    },
    {
      title: 'Weekly Notes',
      href: '/admin/meetings',
      description: 'Update This Weekly',
    },
    {
      title: 'Staff Profiles',
      href: '/admin/dashboard',
      description: 'All Profiles',
    },
    {
      title: 'Your Profile',
      href: employeeId ? `/TGR/crew/profile/${employeeId}` : '#',
      description: 'Your Personal Profile',
    },
  ];

  const aimComps = [
    {
      title: 'AIM',
      href: '/aim',
      description: 'API Testing',
    },
  ];

  const handleLinkClick = (href: string) => {
    router.push(href);
  };

  const handleProfileClick = () => {
    if (employeeId) {
      router.push(`/TGR/crew/profile/${employeeId}`);
    }
  };

  return (
    <RoleBasedWrapper allowedRoles={['super admin', 'dev']}>
      {isLoading && <LoadingIndicator />}
      <header className="flex justify-between items-center p-2">
        <LazyNavigationMenu>
          <LazyNavigationMenuList className="flex space-x-4 mr-3">
            <NavigationMenuItem>
              <NavigationMenuTrigger>Auditing</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                  {auditComponents.map((component) => (
                    <ListItem key={component.title} title={component.title} href={component.href}>
                      {component.description}
                    </ListItem>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Staff Management</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                  {schedComponents.map((sched) => (
                    <ListItem key={sched.title} title={sched.title} href={sched.href}>
                      {sched.description}
                    </ListItem>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Forms & Reports</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-3 lg:w-[600px]">
                  {comboComps.map((component) => (
                    <ListItem key={component.title} title={component.title} href={component.href}>
                      {component.description}
                    </ListItem>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Management</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                  {manageComps.map((component) => (
                    <ListItem key={component.title} title={component.title} href={component.href}>
                      {component.description}
                    </ListItem>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>SOPs</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                  {sopComps.map((component) => (
                    <ListItem key={component.title} title={component.title} href={component.href}>
                      {component.description}
                    </ListItem>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>AIM</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                  {aimComps.map((component) => (
                    <ListItem key={component.title} title={component.title} href={component.href}>
                      {component.description}
                    </ListItem>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </LazyNavigationMenuList>
        </LazyNavigationMenu>
        <div className="flex items-center">
          {unreadOrderCount > 0 && (
            <Link href="/sales/orderreview">
              <Button variant="linkHover1" size="icon">
                <FileTextIcon />
                <span className="badge">{unreadOrderCount}</span>
              </Button>
            </Link>
          )}
          {unreadTimeOffCount > 0 && (
            <Link href="/admin/timeoffreview">
              <Button variant="linkHover1" size="icon">
                <CalendarIcon />
                <span className="badge">{unreadTimeOffCount}</span>
              </Button>
            </Link>
          )}
          <Link href="/">
            <Button variant="linkHover2" size="icon">
              <HomeIcon />
            </Button>
          </Link>

          {user ? (
            <>
              <LazyDropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="linkHover2" size="icon" className="mr-2 relative">
                    <PersonIcon />
                    {/* {totalUnreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 text-red-500 text-xs font-bold">
                        {totalUnreadCount}
                      </span>
                    )} */}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mr-2">
                  <DropdownMenuLabel>Profile & Settings</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleProfileClick}>
                    <PersonIcon className="mr-2 h-4 w-4" />
                    <span>Your Profile Page</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleLinkClick('/admin/domains')}>
                    <Pencil2Icon className="mr-2 h-4 w-4" />
                    <span>Manage Domains</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleLinkClick('/admin/reports/dashboard')}>
                    <DashboardIcon className="mr-2 h-4 w-4" />
                    <span>Admin Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={handleChatClick}>
                    <ChatBubbleIcon className="mr-2 h-4 w-4" />
                    <span>Messages</span>
                    {/* {totalUnreadCount > 0 && (
                      <span className="ml-auto text-red-500 font-bold">
                        {totalUnreadCount}
                      </span>
                    )} */}
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
                  {/* <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    Light
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    Dark
                  </DropdownMenuItem> */}
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

HeaderSuperAdmin.displayName = 'HeaderSuperAdmin';

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

export default HeaderSuperAdmin;
