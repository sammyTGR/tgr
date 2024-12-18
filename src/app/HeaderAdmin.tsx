"use client";

import * as React from "react";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ChatBubbleIcon,
  HomeIcon,
  FileTextIcon,
  CalendarIcon,
  ShadowIcon,
  SunIcon,
  MoonIcon,
  PersonIcon,
  DashboardIcon,
} from "@radix-ui/react-icons";
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import { supabase } from "@/utils/supabase/client";
// import useUnreadMessages from "@/app/api/fetch-unread/route";
// import useUnreadOrders from "@/app/api/useUnreadOrders/route"; // Import the hook
// import useUnreadTimeOffRequests from "@/app/api/useUnreadTimeOffRequests/route"; // Import the hook
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
import LoadingIndicator from "@/components/LoadingIndicator";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { User } from "@supabase/supabase-js";

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

interface UserData {
  user: User | null;
  error?: string;
}

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
    description: "Calendar & Time Off Requests",
  },
  // {
  //   title: "Time Off Requests",
  //   href: "/TGR/crew/timeoffrequest",
  //   description: "Submit Time Off",
  // },
  {
    title: "Review Time Off Requests",
    href: "/admin/timeoffreview",
    description: "Respond To Time Off Requests",
  },
  {
    title: "Manage Schedules & Timesheets",
    href: "/admin/schedules",
    description: "Schedules & Timesheets",
  },
];

const serviceComponents = [
  {
    title: "Submit Orders",
    href: "/sales/orders",
    description: "Submit Requests For Customers",
  },
  {
    title: "View Orders",
    href: "/sales/orderreview",
    description: "View Submitted Orders",
  },
  {
    title: "Safety Waiver",
    href: "/public/waiver",
    description: "Submit A Safety Waiver",
  },
  {
    title: "Review Waivers",
    href: "/sales/waiver/checkin",
    description: "Review Waivers & Check Customers In",
  },
];

const formComps = [
  {
    title: "Submit Range Walks",
    href: "/TGR/rangewalk",
    description: "Submit Daily Range Walks",
  },
  {
    title: "Daily Deposits",
    href: "/TGR/deposits",
    description: "Submit Daily Deposits",
  },
  {
    title: "Points Submissions",
    href: "/TGR/crew/points",
    description: "Report All Submitted Points",
  },
  {
    title: "Rental Firearms Checklist",
    href: "/TGR/rentals/checklist",
    description: "Rental Inventory Check",
  },
];

const reportsComps = [
  {
    title: "Daily Sales",
    href: "/admin/reports/sales",
    description: "Set Categories & View Sales",
  },
  {
    title: "View Range Walks & Repairs",
    href: "/TGR/rangewalk/report",
    description: "View All Range Walks & Repairs",
  },
  {
    title: "Certifications",
    href: "/TGR/certifications",
    description: "View All Certifications",
  },
  {
    title: "Review Orders",
    href: "/sales/orderreview",
    description: "View Submitted Orders",
  },
  {
    title: "Gunsmithing",
    href: "/TGR/gunsmithing",
    description: "Weekly Gunsmithing Maintenance",
  },

  {
    title: "Monthly Contest",
    href: "/admin/audits/contest",
    description: "Monthly Sales Contest",
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

const profileComps = [
  {
    title: "Staff Profiles",
    href: "/admin/dashboard",
    description: "All Profiles",
  },
  {
    title: "Weekly Agenda Topics",
    href: "/admin/meetings",
    description: "Update This Weekly",
  },
];

const manageComps = [
  {
    title: "Staff Profiles",
    href: "/admin/dashboard",
    description: "All Profiles",
  },
  {
    title: "Weekly Updates",
    href: "/admin/meetings",
    description: "Update These Notes Weekly",
  },
  {
    title: "Monthly Contest",
    href: "/admin/audits/contest",
    description: "Monthly Sales Contest",
  },
  {
    title: "Payroll & Timesheets",
    href: "/admin/reports/download",
    description: "Download Payroll & Timesheets",
  },
  // {
  //   title: "Sales Report",
  //   href: "/admin/reports/sales",
  //   description: "View Daily Sales",
  // },
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
    description: "Submit Range Walks & Repairs",
  },

  {
    title: "Submit Claimed Points",
    href: "/TGR/crew/points",
    description: "Report All Submitted Points",
  },
  {
    title: "Submit Daily Deposits",
    href: "/TGR/deposits",
    description: "Daily Deposits",
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
    title: "Rental Firearms Checklist",
    href: "/TGR/rentals/checklist",
    description: "Rental Inventory Check",
  },
  {
    title: "Newsletter",
    href: "/public/subscribe",
    description: "Subscribe To Our Email List",
  },
  {
    title: "DROS Training",
    href: "/TGR/dros/training/",
    description: "DROS Simulation",
  },
];

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

const HeaderAdmin = React.memo(() => {
  const router = useRouter();
  const { setTheme } = useTheme();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Current user query
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

  // Add session query
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

  // Add user role query
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

  // Update employee query to use authData
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

  // Navigation loading state
  const { isLoading } = useQuery({
    queryKey: ["navigation", pathname, searchParams],
    queryFn: () =>
      Promise.resolve(
        new Promise((resolve) => setTimeout(() => resolve(null), 100))
      ),
    staleTime: 0,
    refetchInterval: 0,
  });

  // Unread messages query
  const { data: unreadMessagesData = { totalUnreadCount: 0 } } = useQuery({
    queryKey: ["unreadMessages", currentUser?.id],
    queryFn: async () => {
      const [dmResult, groupResult] = await Promise.all([
        supabase
          .from("direct_messages")
          .select("id")
          .eq("receiver_id", currentUser?.id || "")
          .eq("is_read", false),
        supabase
          .from("group_chat_messages")
          .select("id")
          .not("read_by", "cs", `{${currentUser?.id}}`),
      ]);

      const totalUnreadCount =
        (dmResult.data?.length || 0) + (groupResult.data?.length || 0);
      return { totalUnreadCount };
    },
    enabled: !!currentUser?.id,
    refetchInterval: 30000,
  });

  // Unread orders query
  const { data: unreadOrdersData = { unreadOrderCount: 0 } } = useQuery({
    queryKey: ["unreadOrders"],
    queryFn: async () => {
      const response = await fetch("/api/useUnreadOrders");
      if (!response.ok) throw new Error("Failed to fetch unread orders");
      return response.json();
    },
    enabled: !!currentUser,
    refetchInterval: 30000,
  });

  // Unread time-off requests query
  const { data: unreadTimeOffData = { unreadTimeOffCount: 0 } } = useQuery({
    queryKey: ["unreadTimeOff"],
    queryFn: async () => {
      const response = await fetch("/api/useUnreadTimeOffRequests");
      if (!response.ok)
        throw new Error("Failed to fetch unread time-off requests");
      return response.json();
    },
    enabled: !!currentUser,
    refetchInterval: 30000,
  });

  // Handler functions
  const handleLinkClick = (href: string) => {
    router.push(href);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    window.location.href = "/";
  };

  const handleChatClick = () => {
    router.push("/messages");
  };

  const handleProfileClick = () => {
    if (employeeData?.employee_id) {
      router.push(`/TGR/crew/profile/${employeeData.employee_id}`);
    }
  };

  return (
    <RoleBasedWrapper allowedRoles={["admin", "dev"]}>
      {isLoading && <LoadingIndicator />}
      <header className="flex justify-between items-center p-2">
        <LazyNavigationMenu>
          <LazyNavigationMenuList className="flex space-x-4 mr-3">
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
              <NavigationMenuTrigger>Scheduling</NavigationMenuTrigger>
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
              <NavigationMenuTrigger>Management</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
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
          </LazyNavigationMenuList>
        </LazyNavigationMenu>

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

              <Link href="/admin/reports/dashboard">
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
                        {unreadMessagesData.totalUnreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 text-red-500 text-xs font-bold">
                            {unreadMessagesData.totalUnreadCount}
                          </span>
                        )}
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
                        onSelect={() =>
                          handleLinkClick("/admin/reports/dashboard")
                        }
                      >
                        <DashboardIcon className="mr-2 h-4 w-4" />
                        <span>Admin Dashboard</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />

                      <DropdownMenuItem onClick={handleChatClick}>
                        <ChatBubbleIcon className="mr-2 h-4 w-4" />
                        <span>Messages</span>
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
              <Button variant="ghost">Sign In</Button>
            </Link>
          )}
        </div>
      </header>
    </RoleBasedWrapper>
  );
});

HeaderAdmin.displayName = "HeaderAdmin";

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

export default HeaderAdmin;
