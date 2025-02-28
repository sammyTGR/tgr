"use client";

import React, { Suspense } from "react";
import { useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
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
} from "@radix-ui/react-icons";
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { supabase } from "@/utils/supabase/client";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import { useRouter } from "next/navigation";
import {
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import LoadingIndicator from "@/components/LoadingIndicator";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useSearchParams } from "next/navigation";
import { Session, User } from "@supabase/supabase-js";
import { QueryClient } from "@tanstack/react-query";

interface HeaderDev {
  totalUnreadCount: number;
}

interface UserData {
  user: User | null;
  error?: string;
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

interface UnreadOrdersResponse {
  unreadOrderCount: number;
}

interface UnreadTimeOffResponse {
  unreadTimeOffCount: number;
}

const LazyNavigationMenu = dynamic(
  () =>
    import("@/components/ui/navigation-menu").then((module) => ({
      default: module.NavigationMenu,
    })),
  {
    loading: () => <LoadingIndicator />,
  }
);

const LazyNavigationMenuList = dynamic(
  () =>
    import("@/components/ui/navigation-menu").then((module) => ({
      default: module.NavigationMenuList,
    })),
  {
    loading: () => <LoadingIndicator />,
  }
);

const LazyDropdownMenu = dynamic(
  () =>
    import("@/components/ui/dropdown-menu").then((module) => ({
      default: module.DropdownMenu,
    })),
  {
    loading: () => <LoadingIndicator />,
  }
);

const auditComponents = [
  {
    title: "Submit & Review Audits",
    href: "/admin/audits",
    description: "Enter Audits & Review Existing Ones",
  },
  {
    title: "DROS Guidance",
    href: "/TGR/dros/guide",
    description: "Sometimes We All Need A Lil' Help",
  },
];

const schedComponents = [
  {
    title: "Team Calendar",
    href: "/TGR/crew/calendar",
    description: "Schedules & Time Off Requests",
  },
  {
    title: "Review Time Off Requests",
    href: "/admin/timeoffreview",
    description: "View All Requests For Time Off",
  },
  {
    title: "Staff Profiles",
    href: "/admin/dashboard",
    description: "All Profiles",
  },
  {
    title: "Create | Manage Schedules",
    href: "/admin/schedules",
    description: "Manage Schedules & Timesheets",
  },
];

const sopComps = [
  {
    title: "TGR SOPs",
    href: "/TGR/sop",
    description: "SOPs For Front Of The House",
  },
  {
    title: "Admin SOPs",
    href: "/admin/sop",
    description: "SOPs For Back Of The House",
  },
];

const manageComps = [
  {
    title: "Staff Profiles",
    href: "/admin/dashboard",
    description: "All Profiles",
  },

  {
    title: "Monthly Contest",
    href: "/admin/audits/contest",
    description: "Monthly Sales Contest",
  },
  {
    title: "Weekly Meetings",
    href: "/admin/meetings",
    description: "Update & Meet Weekly",
  },
  {
    title: "Sales Report",
    href: "/admin/reports/sales",
    description: "View Daily Sales",
  },
  {
    title: "Download Reports",
    href: "/admin/reports/download",
    description: "Download Various Reports",
  },
  {
    title: "Manage Staff Data",
    href: "/TGR/employees",
    description: "Set All Staff Details",
  },
  {
    title: "Audit Management",
    href: "/admin/audits",
    description: "Testing Audits",
  },
  {
    title: "Upload Files",
    href: "/admin/upload",
    description: "Uploadthing",
  },
  {
    title: "Reports Dashboard",
    href: "/admin/reports/dashboard",
    description: "Daily Dashboard",
  },
  {
    title: "Onboarding",
    href: "/admin/onboarding",
    description: "New Member Onboarding",
  },
  {
    title: "Products & Pricing",
    href: "/pricing",
    description: "All Products & Subscriptions",
  },
  {
    title: "Classes Schedule",
    href: "/public/classes",
    description: "Class Scheduling Page",
  },
  {
    title: "Fastbound Acquisitions",
    href: "/TGR/fastbound/acquisitions",
    description: "Acquisitions",
  },
  {
    title: "Fastbound Inventory",
    href: "/TGR/fastbound/inventory",
    description: "Inventory",
  },
  {
    title: "Newsletter",
    href: "/public/subscribe",
    description: "Subscribe To Our Email List",
  },
  {
    title: "AIM Inventory",
    href: "/aim",
    description: "Search Inventory",
  },
  {
    title: "Franchising",
    href: "/franchise/about",
    description: "Joining TGR",
  },
  {
    title: "Banned Firearms",
    href: "/TGR/dros/banned",
    description: "Banned Firearms",
  },
  {
    title: "Patch Notes",
    href: "/patch-notes",
    description: "Patch Notes",
  },
];

const fbComps = [
  {
    title: "Inventory",
    href: "/TGR/fastbound/inventory",
    description: "Inventory",
  },
  {
    title: "Acquisitions",
    href: "/TGR/fastbound/acquisitions",
    description: "Acquisitions",
  },
];

const comboComps = [
  {
    title: "Safety Waiver",
    href: "/public/waiver",
    description: "Submit A Safety Waiver",
  },
  {
    title: "Review Waivers",
    href: "/sales/waiver/checkin",
    description: "Review Waivers & Check-Ins",
  },
  {
    title: "View Certifications",
    href: "/TGR/certifications",
    description: "View All Certifications",
  },
  {
    title: "Range Walks & Repairs",
    href: "/TGR/crew/range",
    description: "Daily Range Walks & Repairs",
  },
  {
    title: "Submit Special Orders",
    href: "/sales/orders",
    description: "Submit Requests For Customers",
  },
  {
    title: "Special Orders Report",
    href: "/sales/orderreview",
    description: "View Submitted Orders",
  },
  {
    title: "Gunsmithing",
    href: "/TGR/gunsmithing",
    description: "Weekly Gunsmithing Maintenance",
  },
  {
    title: "Rental Firearms Checklist",
    href: "/TGR/rentals/checklist",
    description: "Rental Inventory Check",
  },
  {
    title: "Submit Daily Deposits",
    href: "/TGR/deposits",
    description: "Daily Deposits",
  },
  {
    title: "DROS Training",
    href: "/TGR/dros/training/",
    description: "DROS Simulation",
  },
  {
    title: "Bulletin Board",
    href: "/TGR/crew/bulletin",
    description: "Bulletin Board",
  },
];

// Auth state subscription query
const useAuthStateSubscription = (queryClient: QueryClient) => {
  return useQuery({
    queryKey: ["authStateSubscription"],
    queryFn: async () => {
      const subscription = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN") {
          queryClient.invalidateQueries({ queryKey: ["authSession"] });
          queryClient.invalidateQueries({ queryKey: ["userRole"] });
          queryClient.invalidateQueries({ queryKey: ["currentUser"] });
        } else if (event === "SIGNED_OUT") {
          queryClient.clear();
          window.location.href = "/";
        }
      });

      return () => subscription.data.subscription.unsubscribe();
    },
    gcTime: 0,
    staleTime: Infinity,
  });
};

// Orders subscription query
const useOrdersSubscription = (
  currentUser: User | null,
  queryClient: QueryClient
) => {
  return useQuery({
    queryKey: ["ordersSubscription"],
    queryFn: async () => {
      const channel = supabase
        .channel("orders")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "orders" },
          () => {
            queryClient.invalidateQueries({ queryKey: ["unreadOrders"] });
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
};

// Time off requests subscription query
const useTimeOffSubscription = (
  currentUser: User | null,
  queryClient: QueryClient
) => {
  return useQuery({
    queryKey: ["timeOffSubscription"],
    queryFn: async () => {
      const channel = supabase
        .channel("time_off_requests")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "time_off_requests" },
          () => {
            queryClient.invalidateQueries({ queryKey: ["unreadTimeOff"] });
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
};

const HeaderDev = React.memo(() => {
  const router = useRouter();
  const { setTheme } = useTheme();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Add new queries to replace the state
  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
    staleTime: Infinity,
  }) as { data: User | null };

  // Navigation query
  const { isLoading: isNavigating } = useQuery({
    queryKey: ["navigation", pathname, searchParams],
    queryFn: () =>
      Promise.resolve(
        new Promise((resolve) => setTimeout(() => resolve(null), 100))
      ),
    staleTime: 0,
    refetchInterval: 0,
  });

  // Session query
  const { data: authData, isLoading: isAuthLoading } = useQuery({
    queryKey: ["authSession"],
    queryFn: async () => {
      const response = await fetch("/api/check-session");
      if (!response.ok) throw new Error("Failed to check session");
      return response.json();
    },
    staleTime: 1000 * 60,
    refetchOnWindowFocus: true,
  });

  // User role query
  const { data: userData, refetch: refetchUserRole } = useQuery<UserData>({
    queryKey: ["userRole"],
    queryFn: async () => {
      const response = await fetch("/api/getUserRole");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch user role");
      }
      return response.json();
    },
    enabled: !!currentUser,
    staleTime: Infinity,
    retry: false,
    gcTime: Infinity,
  });

  // Employee query
  const { data: employeeData } = useQuery({
    queryKey: ["employee", authData?.user?.id],
    queryFn: async () => {
      const response = await fetch(
        `/api/fetchEmployees?select=employee_id&equals=user_uuid:${authData.user.id}&single=true`
      );
      if (!response.ok) throw new Error("Failed to fetch employee data");
      return response.json();
    },
    enabled: !!authData?.user?.id,
    staleTime: Infinity,
  });

  // Unread counts queries with proper refetchInterval
  const { data: unreadOrdersData = { unreadOrderCount: 0 } } = useQuery({
    queryKey: ["unreadOrders"],
    queryFn: async () => {
      const response = await fetch("/api/useUnreadOrders");
      if (!response.ok) throw new Error("Failed to fetch unread orders");
      return response.json();
    },
    enabled: !!authData?.user,
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  const { data: unreadTimeOffData = { unreadTimeOffCount: 0 } } = useQuery({
    queryKey: ["unreadTimeOff"],
    queryFn: async () => {
      const response = await fetch("/api/useUnreadTimeOffRequests");
      if (!response.ok)
        throw new Error("Failed to fetch unread time-off requests");
      return response.json();
    },
    enabled: !!authData?.user,
    refetchInterval: 300000,
  });

  // Use the auth state subscription
  useAuthStateSubscription(queryClient);

  // Use all subscriptions
  useOrdersSubscription(currentUser, queryClient);
  useTimeOffSubscription(currentUser, queryClient);

  // Update sign out handler to work with the subscription
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // The auth state subscription will handle the cleanup and redirect
  };

  const handleChatClick = () => {
    router.push("/messages");
  };

  const handleSupportClick = () => {
    router.push("/support");
  };

  const aimComps = [
    {
      title: "AIM",
      href: "/aim",
      description: "API Testing",
    },
  ];

  const handleLinkClick = (href: string) => {
    router.push(href);
  };

  const handleProfileClick = () => {
    if (currentUser?.id) {
      router.push(`/TGR/crew/profile/${employeeData.employee_id}`);
    }
  };

  const handleHomeClick = () => {
    router.push("/");
  };

  return (
    <RoleBasedWrapper allowedRoles={["dev"]}>
      {isNavigating && <LoadingIndicator />}
      <header className="flex justify-between items-center p-1">
        <Suspense fallback={<div>Loading navigation...</div>}>
          <LazyNavigationMenu>
            <LazyNavigationMenuList className="flex space-x-1 mr-3">
              <NavigationMenuItem>
                <NavigationMenuTrigger>Auditing</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                    {auditComponents.map((component) => (
                      <ListItem
                        key={component.title}
                        title={component.title}
                        href={component.href}
                      >
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
                      <ListItem
                        key={sched.title}
                        title={sched.title}
                        href={sched.href}
                      >
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
                      <ListItem
                        key={component.title}
                        title={component.title}
                        href={component.href}
                      >
                        {component.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Fastbound</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    {fbComps.map((component) => (
                      <ListItem
                        key={component.title}
                        title={component.title}
                        href={component.href}
                      >
                        {component.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Management</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-3 lg:w-[600px]">
                    {manageComps.map((component) => (
                      <ListItem
                        key={component.title}
                        title={component.title}
                        href={component.href}
                      >
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
                      <ListItem
                        key={component.title}
                        title={component.title}
                        href={component.href}
                      >
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
                      <ListItem
                        key={component.title}
                        title={component.title}
                        href={component.href}
                      >
                        {component.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </LazyNavigationMenuList>
          </LazyNavigationMenu>
        </Suspense>
        {/* Unread notifications */}
        <div className="flex items-center space-x-0">
          {authData?.user ? (
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

              {/* <NotificationBell /> */}

              <Link href="/">
                <Button variant="ghost" size="icon">
                  <HomeIcon />
                </Button>
              </Link>

              <div className="flex items-center space-x-1">
                <Suspense fallback={<LoadingIndicator />}>
                  <LazyDropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="mr-2 relative"
                      >
                        <PersonIcon />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 mr-2">
                      <DropdownMenuLabel>Profile & Settings</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={handleProfileClick}>
                        <PersonIcon className="mr-2 h-4 w-4" />
                        <span>Your Profile Page</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onSelect={() => handleLinkClick("/admin/domains")}
                      >
                        <Pencil2Icon className="mr-2 h-4 w-4" />
                        <span>Manage Domains</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() =>
                          handleLinkClick("/admin/reports/dashboard")
                        }
                      >
                        <DashboardIcon className="mr-2 h-4 w-4" />
                        <span>Admin Dashboard</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />

                      <DropdownMenuItem onClick={handleSupportClick}>
                        <QuestionMarkIcon className="mr-2 h-4 w-4" />
                        <span>Support</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />

                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <ShadowIcon className="mr-2 h-4 w-4" />
                          <span>Change Theme</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem onClick={() => setTheme("light")}>
                              <SunIcon className="mr-2 h-4 w-4" />
                              <span>Light</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("dark")}>
                              <MoonIcon className="mr-2 h-4 w-4" />
                              <span>Dark</span>
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />

                      <DropdownMenuItem onClick={handleSignOut}>
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </LazyDropdownMenu>
                </Suspense>
              </div>
            </>
          ) : (
            <Link href="/sign-in">
              <Button variant="outline">Sign In</Button>
            </Link>
          )}
        </div>
      </header>
    </RoleBasedWrapper>
  );
});

HeaderDev.displayName = "HeaderDev";

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, href, ...props }, ref) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    queryClient.invalidateQueries({ queryKey: ["navigation"] });
    router.push(href || "");
  };

  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          href={href}
          onClick={handleClick}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});

ListItem.displayName = "ListItem";

export default HeaderDev;
