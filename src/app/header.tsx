// "use client";
// import dynamic from "next/dynamic";
// import LoadingIndicator from "@/components/LoadingIndicator";
// import { useRole } from "@/context/RoleContext";

// // Dynamically import all headers with a shared loading configuration
// const LazyHeaderDev = dynamic(() => import("./HeaderDev"), { ssr: false });
// const LazyHeaderAdmin = dynamic(() => import("./HeaderAdmin"), { ssr: false });
// const LazyHeaderSuperAdmin = dynamic(() => import("./HeaderSuperAdmin"), {
//   ssr: false,
// });
// const LazyHeaderPublic = dynamic(() => import("./HeaderPublic"), {
//   ssr: false,
// });
// const LazyHeaderCustomer = dynamic(() => import("./HeaderCustomer"), {
//   ssr: false,
// });
// const LazyHeaderGunsmith = dynamic(() => import("./HeaderGunsmith"), {
//   ssr: false,
// });
// const LazyHeaderAuditor = dynamic(() => import("./HeaderAuditor"), {
//   ssr: false,
// });
// const LazyHeaderUser = dynamic(() => import("./HeaderUser"), { ssr: false });

// export default function Header() {
//   const { role, loading: isLoading, error } = useRole();

//   if (isLoading) {
//     return <LoadingIndicator />;
//   }

//   if (error) {
//     console.error("Error fetching role:", error.message);
//     return <LazyHeaderPublic />;
//   }

//   if (!role) {
//     return <LazyHeaderPublic />;
//   }

//   switch (role) {
//     case "super admin":
//       return <LazyHeaderSuperAdmin />;
//     case "dev":
//       return <LazyHeaderDev />;
//     case "admin":
//     case "ceo":
//       return <LazyHeaderAdmin />;
//     case "customer":
//       return <LazyHeaderCustomer />;
//     case "gunsmith":
//       return <LazyHeaderGunsmith />;
//     case "auditor":
//       return <LazyHeaderAuditor />;
//     default:
//       return <LazyHeaderUser />;
//   }
// }

'use client';

import React, { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  ChatBubbleIcon,
  HomeIcon,
  CalendarIcon,
  FileTextIcon,
  PersonIcon,
  SunIcon,
  MoonIcon,
  ShadowIcon,
  Pencil2Icon,
  DashboardIcon,
  QuestionMarkIcon,
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
import { useRouter } from 'next/navigation';
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
import LoadingIndicator from '@/components/LoadingIndicator';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname, useSearchParams } from 'next/navigation';
import { User } from '@supabase/supabase-js';

// Define role types
type Role = 'super admin' | 'ceo' | 'dev' | 'admin' | 'gunsmith' | 'user' | 'customer' | 'auditor';

// Define navigation item with role permissions
interface NavigationItem {
  title: string;
  href: string;
  description: string;
  allowedRoles: Role[];
}

// Define navigation sections
const navigationSections = {
  auditing: {
    title: 'Auditing',
    items: [
      {
        title: 'Submit & Review Audits',
        href: '/admin/audits',
        description: 'Enter Audits & Review Existing Ones',
        allowedRoles: ['super admin', 'ceo', 'dev', 'admin', 'auditor'],
      },
      {
        title: 'DROS Guidance',
        href: '/TGR/dros/guide',
        description: "Sometimes We All Need A Lil' Help",
        allowedRoles: ['super admin', 'ceo', 'dev', 'admin', 'user', 'gunsmith', 'auditor'],
      },
    ],
  },
  staffManagement: {
    title: 'Scheduling',
    items: [
      {
        title: 'Team Calendar',
        href: '/TGR/crew/calendar',
        description: 'Schedules & Time Off Requests',
        allowedRoles: ['super admin', 'ceo', 'dev', 'admin', 'user', 'gunsmith', 'auditor'],
      },
      {
        title: 'Review Time Off Requests',
        href: '/admin/timeoffreview',
        description: 'View All Requests For Time Off',
        allowedRoles: ['super admin', 'ceo', 'dev', 'admin'],
      },
      // {
      //   title: "Staff Profiles",
      //   href: "/admin/dashboard",
      //   description: "All Profiles",
      //   allowedRoles: ["super admin", "ceo", "dev", "admin"],
      // },
      {
        title: 'Create | Manage Schedules',
        href: '/admin/schedules',
        description: 'Manage Schedules & Timesheets',
        allowedRoles: ['super admin', 'ceo', 'dev', 'admin'],
      },
    ],
  },
  formsAndReports: {
    title: 'Forms & Reports',
    items: [
      // {
      //   title: "Safety Waiver",
      //   href: "/public/waiver",
      //   description: "Submit A Safety Waiver",
      //   allowedRoles: [
      //     "super admin",
      //     "ceo",
      //     "dev",
      //     "admin",
      //     "user",
      //     "gunsmith",
      //   ],
      // },
      // {
      //   title: "Review Waivers",
      //   href: "/sales/waiver/checkin",
      //   description: "Review Waivers & Check-Ins",
      //   allowedRoles: ["super admin", "ceo", "dev", "admin", "user"],
      // },
      {
        title: 'View Certifications',
        href: '/TGR/certifications',
        description: 'View All Certifications',
        allowedRoles: ['super admin', 'ceo', 'dev', 'admin', 'user', 'gunsmith', 'auditor'],
      },
      {
        title: 'Range Walks & Repairs',
        href: '/TGR/crew/range',
        description: 'Daily Range Walks & Repairs',
        allowedRoles: ['super admin', 'ceo', 'dev', 'admin', 'user', 'gunsmith', 'auditor'],
      },
      {
        title: 'Submit Special Orders',
        href: '/sales/orders',
        description: 'Submit Requests For Customers',
        allowedRoles: ['super admin', 'ceo', 'dev', 'admin', 'user', 'auditor', 'gunsmith'],
      },
      {
        title: 'View Special Orders',
        href: '/sales/orderreview/crew',
        description: 'View All Submitted Orders',
        allowedRoles: ['super admin', 'dev', 'user'],
      },
      {
        title: 'Special Orders Report',
        href: '/sales/orderreview',
        description: 'View Submitted Orders',
        allowedRoles: ['super admin', 'ceo', 'dev', 'admin'],
      },
      {
        title: 'Gunsmithing',
        href: '/TGR/gunsmithing',
        description: 'Weekly Gunsmithing Maintenance',
        allowedRoles: ['super admin', 'ceo', 'dev', 'admin', 'gunsmith'],
      },
      {
        title: 'Rental Firearms Checklist',
        href: '/TGR/rentals/checklist',
        description: 'Rental Inventory Check',
        allowedRoles: ['super admin', 'ceo', 'dev', 'admin', 'user', 'gunsmith', 'auditor'],
      },
      {
        title: 'Submit Daily Deposits',
        href: '/TGR/deposits',
        description: 'Daily Deposits',
        allowedRoles: ['super admin', 'ceo', 'dev', 'admin', 'user', 'auditor'],
      },
      {
        title: 'DROS Training',
        href: '/TGR/dros/training',
        description: 'DROS Simulation',
        allowedRoles: ['super admin', 'ceo', 'dev', 'admin', 'user', 'auditor'],
      },
      {
        title: 'Bulletin Board',
        href: '/TGR/crew/bulletin',
        description: 'Bulletin Board',
        allowedRoles: ['super admin', 'ceo', 'dev', 'admin', 'user', 'gunsmith', 'auditor'],
      },
      {
        title: 'Points Submissions',
        href: '/TGR/crew/points',
        description: 'Report All Submitted Points',
        allowedRoles: ['super admin', 'ceo', 'dev', 'admin', 'user', 'auditor'],
      },
      {
        title: 'Email Blasts',
        href: '/public/subscribe',
        description: 'Sign Customers Up For Email Blasts',
        allowedRoles: ['super admin', 'ceo', 'dev', 'admin', 'user', 'auditor'],
      },
    ],
  },
  // fastbound: {
  //   title: "Fastbound",
  //   items: [
  //     {
  //       title: "Inventory",
  //       href: "/TGR/fastbound/inventory",
  //       description: "Inventory",
  //       allowedRoles: ["super admin", "dev"],
  //     },
  //     {
  //       title: "Acquisitions",
  //       href: "/TGR/fastbound/acquisitions",
  //       description: "Acquisitions",
  //       allowedRoles: ["super admin", "dev"],
  //     },
  //   ],
  // },
  management: {
    title: 'Staff Management',
    items: [
      {
        title: 'Staff Profiles',
        href: '/admin/dashboard',
        description: 'All Profiles',
        allowedRoles: ['super admin', 'ceo', 'dev', 'admin'],
      },
      // {
      //   title: "Monthly Contest",
      //   href: "/admin/audits/contest",
      //   description: "Monthly Sales Contest",
      //   allowedRoles: ["super admin", "ceo", "dev", "admin"],
      // },
      {
        title: 'Weekly Meetings',
        href: '/admin/meetings',
        description: 'Update & Meet Weekly',
        allowedRoles: ['super admin', 'ceo', 'dev', 'admin'],
      },
      // {
      //   title: "Sales Report",
      //   href: "/admin/reports/sales",
      //   description: "View Daily Sales",
      //   allowedRoles: ["super admin", "ceo", "dev", "admin"],
      // },
      // {
      //   title: "Download Reports",
      //   href: "/admin/reports/download",
      //   description: "Download Various Reports",
      //   allowedRoles: ["super admin", "ceo", "dev", "admin"],
      // },
      {
        title: 'Manage Staff Data',
        href: '/TGR/employees',
        description: 'Set All Staff Details',
        allowedRoles: ['super admin', 'dev'],
      },
      // {
      //   title: "Audit Management",
      //   href: "/admin/audits",
      //   description: "Testing Audits",
      //   allowedRoles: ["super admin", "ceo", "dev", "admin"],
      // },
      {
        title: 'Upload Files',
        href: '/admin/upload',
        description: 'Uploadthing',
        allowedRoles: ['super admin', 'dev'],
      },
      {
        title: 'Onboarding',
        href: '/admin/onboarding',
        description: 'New Member Onboarding',
        allowedRoles: ['super admin', 'dev'],
      },
      {
        title: 'Products & Pricing',
        href: '/pricing',
        description: 'All Products & Subscriptions',
        allowedRoles: ['super admin', 'ceo', 'dev', 'admin'],
      },
      {
        title: 'Classes Schedule',
        href: '/public/classes',
        description: 'Class Scheduling Page',
        allowedRoles: ['super admin', 'ceo', 'dev', 'admin', 'user'],
      },

      // {
      //   title: "Banned Firearms",
      //   href: "/TGR/dros/banned",
      //   description: "Banned Firearms",
      //   allowedRoles: [
      //     "super admin",
      //     "ceo",
      //     "dev",
      //     "admin",
      //     "user",
      //     "gunsmith",
      //     "auditor",
      //   ],
      // },
      {
        title: 'Patch Notes',
        href: '/patch-notes',
        description: 'Patch Notes',
        allowedRoles: ['super admin', 'ceo', 'dev', 'admin', 'user', 'gunsmith', 'auditor'],
      },
    ],
  },
  sops: {
    title: 'SOPs',
    items: [
      {
        title: 'TGR SOPs',
        href: '/TGR/sop',
        description: 'SOPs For Front Of The House',
        allowedRoles: ['super admin', 'ceo', 'dev', 'admin', 'user', 'gunsmith', 'auditor'],
      },
      {
        title: 'Admin SOPs',
        href: '/admin/sop',
        description: 'SOPs For Back Of The House',
        allowedRoles: ['super admin', 'ceo', 'dev', 'admin', 'auditor'],
      },
    ],
  },
  // aim: {
  //   title: "AIM",
  //   items: [
  //     {
  //       title: "AIM",
  //       href: "/aim",
  //       description: "API Testing",
  //       allowedRoles: ["super admin", "dev"],
  //     },
  //   ],
  // },
};

const header = () => {
  const router = useRouter();
  const { setTheme } = useTheme();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Auth state subscription query
  useQuery({
    queryKey: ['authStateSubscription'],
    queryFn: async () => {
      const subscription = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') {
          queryClient.invalidateQueries({ queryKey: ['userRole'] });
          queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        } else if (event === 'SIGNED_OUT') {
          queryClient.clear();
          window.location.href = '/';
        }
      });

      return () => subscription.data.subscription.unsubscribe();
    },
    gcTime: 0,
    staleTime: Infinity,
  });

  // User data query
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
    staleTime: Infinity,
  }) as { data: User | null };

  // Role data query
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

  // Employee data query
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

  // Extract user role and add console.log for debugging
  const userRole = userData?.role as Role;
  console.log('Current user role:', userRole);
  console.log('User data:', userData);

  // Function to check if a navigation item should be visible
  const isItemVisible = (allowedRoles: Role[]) => {
    if (!userRole) return false;
    return allowedRoles.includes(userRole);
  };

  // Function to filter navigation items based on role
  const getVisibleItems = (items: NavigationItem[]) => {
    return items.filter((item) => isItemVisible(item.allowedRoles));
  };

  const handleHomeClick = () => {
    if (!userRole) return;

    let redirectUrl;
    switch (userRole) {
      case 'super admin':
      case 'ceo':
        redirectUrl = '/admin/reports/dashboard/ceo';
        break;
      case 'dev':
        redirectUrl = '/admin/reports/dashboard/dev';
        break;
      case 'admin':
        redirectUrl = '/admin/reports/dashboard/admin';
        break;
      default:
        redirectUrl = employeeData?.employee_id
          ? `/TGR/crew/profile/${employeeData.employee_id}`
          : '/';
    }

    router.push(redirectUrl);
  };

  const handleSupportClick = () => {
    router.push('/support');
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      queryClient.clear();
      router.push('/sign-in');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="flex justify-between items-center p-1">
      <NavigationMenu>
        <NavigationMenuList className="flex space-x-1 mr-3">
          {/* Render navigation sections based on role */}
          {Object.entries(navigationSections).map(([key, section]) => {
            // Skip Staff Management section for non-admin roles
            if (
              key === 'management' &&
              !['super admin', 'ceo', 'dev', 'admin'].includes(userRole)
            ) {
              return null;
            }

            // Skip Auditing section for gunsmiths
            if (key === 'auditing' && userRole === 'gunsmith') {
              return null;
            }

            const visibleItems = getVisibleItems(section.items as NavigationItem[]);
            if (visibleItems.length === 0) return null;

            return (
              <NavigationMenuItem key={key}>
                <NavigationMenuTrigger>{section.title}</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    {visibleItems.map((item) => (
                      <ListItem key={item.title} title={item.title} href={item.href}>
                        {item.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            );
          })}
        </NavigationMenuList>
      </NavigationMenu>

      {/* Right side buttons */}
      <div className="flex items-center space-x-0">
        {currentUser ? (
          <>
            {/* Admin-only menu items */}
            {['super admin', 'ceo', 'dev', 'admin'].includes(userRole) && (
              <>
                <Link href="/sales/orderreview" className="mr-1">
                  <Button variant="ghost" size="icon" className="relative">
                    <FileTextIcon />
                    {unreadOrdersData.unreadOrderCount > 0 && (
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 flex items-center justify-center text-xs">
                        {unreadOrdersData.unreadOrderCount}
                      </span>
                    )}
                  </Button>
                </Link>

                <Link href="/admin/timeoffreview" className="mr-1">
                  <Button variant="ghost" size="icon" className="relative">
                    <CalendarIcon />
                    {unreadTimeOffData.unreadTimeOffCount > 0 && (
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 flex items-center justify-center text-xs">
                        {unreadTimeOffData.unreadTimeOffCount}
                      </span>
                    )}
                  </Button>
                </Link>
              </>
            )}

            {/* Only show these buttons for employee roles */}
            {userRole !== 'customer' && (
              <>
                <Button variant="ghost" size="icon" onClick={handleHomeClick}>
                  <HomeIcon />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="mr-2">
                      <PersonIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Profile & Settings</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {/* Profile link - visible to all employees */}
                    {userRole && employeeData?.employee_id && (
                      <>
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/TGR/crew/profile/${employeeData.employee_id}`)
                          }
                        >
                          <PersonIcon className="mr-2 h-4 w-4" />
                          Profile
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSupportClick}>
                          <QuestionMarkIcon className="mr-2 h-4 w-4" />
                          <span>Support</span>
                        </DropdownMenuItem>
                      </>
                    )}

                    {/* Admin-only menu items */}
                    {['super admin', 'ceo', 'dev', 'admin'].includes(userRole) && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push('/admin/domains')}>
                          <Pencil2Icon className="mr-2 h-4 w-4" />
                          Manage Domains
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push('/admin/reports/dashboard')}>
                          <DashboardIcon className="mr-2 h-4 w-4" />
                          Admin Dashboard
                        </DropdownMenuItem>
                      </>
                    )}

                    <DropdownMenuSeparator />

                    {/* Theme selector - visible to all */}
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <ShadowIcon className="mr-2 h-4 w-4" />
                        <span>Theme</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem onClick={() => setTheme('light')}>
                            <SunIcon className="mr-2 h-4 w-4" />
                            Light
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setTheme('dark')}>
                            <MoonIcon className="mr-2 h-4 w-4" />
                            Dark
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>Sign Out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </>
        ) : (
          <Link href="/sign-in">
            <Button variant="outline">Sign In</Button>
          </Link>
        )}
      </div>
    </header>
  );
};

// ListItem component
const ListItem = React.forwardRef<React.ElementRef<'a'>, React.ComponentPropsWithoutRef<'a'>>(
  ({ className, title, children, href, ...props }, ref) => {
    const router = useRouter();

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
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

export default header;
