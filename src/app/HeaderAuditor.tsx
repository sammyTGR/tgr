"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ChatBubbleIcon,
  HomeIcon,
  FileTextIcon,
  CalendarIcon,
  DotFilledIcon,
} from "@radix-ui/react-icons";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import { supabase } from "@/utils/supabase/client";
import LoadingIndicator from "@/components/LoadingIndicator";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
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
} from "@/components/ui/dropdown-menu";
import {
  PersonIcon,
  ShadowIcon,
  SunIcon,
  MoonIcon,
} from "@radix-ui/react-icons";
import { useTheme } from "next-themes";

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
  //   title: "Submit Time Off",
  //   href: "/TGR/crew/timeoffrequest",
  //   description: "Submit A Request",
  // },
];

const serviceComponents = [
  {
    title: "Submit Orders",
    href: "/sales/orders",
    description: "Submit Requests For Customers",
  },
  {
    title: "View Orders",
    href: "/sales/orderreview/crew",
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
    title: "Range Walks & Repairs",
    href: "/TGR/crew/range",
    description: "Daily Range Walks & Repairs",
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
    title: "Checklist",
    href: "/TGR/rentals/checklist",
    description: "Daily Rental Checklist",
  },
  {
    title: "Bulletin Board",
    href: "/TGR/crew/bulletin",
    description: "Bulletin Board",
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

const HeaderAuditor = React.memo(() => {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const { setTheme } = useTheme();
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { isLoading } = useQuery({
    queryKey: ["navigation", pathname, searchParams],
    queryFn: () => {
      return Promise.resolve(
        new Promise((resolve) => {
          setTimeout(() => resolve(null), 100);
        })
      );
    },
    staleTime: 0, // Always refetch on route change
    refetchInterval: 0, // Disable automatic refetching
  });

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data) {
        setUser(data.user);
      }
    };
    fetchUser();
  }, []);

  // useEffect(() => {
  //   setTotalUnreadCount(globalUnreadCount);
  // }, [globalUnreadCount]);

  // useEffect(() => {
  //   const handleUnreadCountsChanged = () => {
  //     setTotalUnreadCount(globalUnreadCount);
  //   };

  //   window.addEventListener("unreadCountsChanged", handleUnreadCountsChanged);

  //   return () => {
  //     window.removeEventListener(
  //       "unreadCountsChanged",
  //       handleUnreadCountsChanged
  //     );
  //   };
  // }, [globalUnreadCount]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/"; // Redirect to sign-in page after sign-out
  };

  const handleChatClick = async () => {
    if (user) {
      const { data: messagesToUpdate, error: fetchError } = await supabase
        .from("direct_messages")
        .select("id, read_by")
        .or(`receiver_id.eq.${user.id},sender_id.eq.${user.id}`);

      if (fetchError) {
        //console.("Error fetching messages to update:", fetchError.message);
        return;
      }

      const messageIdsToUpdate = messagesToUpdate
        .filter((msg) => msg.read_by && !msg.read_by.includes(user.id))
        .map((msg) => msg.id);

      if (messageIdsToUpdate.length > 0) {
        for (const messageId of messageIdsToUpdate) {
          const { error: updateError } = await supabase
            .from("direct_messages")
            .update({
              read_by: [
                ...(messagesToUpdate.find((msg) => msg.id === messageId)
                  ?.read_by || []),
                user.id,
              ],
            })
            .eq("id", messageId);

          if (updateError) {
            console.error(
              "Error updating messages as read:",
              updateError.message
            );
          }
        }
      }

      // Reset the unread count using the context
      // resetUnreadCounts();

      // Navigate to the chat page
      router.push("/TGR/crew/chat");
    }
  };

  return (
    <RoleBasedWrapper allowedRoles={["auditor"]}>
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
              <NavigationMenuTrigger>Forms & Tasks</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                  {formComps.map((component) => (
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
            {/* <NavigationMenuItem>
              <NavigationMenuTrigger>Reporting</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                  {reportsComps.map((component) => (
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
            </NavigationMenuItem> */}
            {/* <NavigationMenuItem>
              <NavigationMenuTrigger>Ops & Profiles</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                  {profileComps.map((component) => (
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
            </NavigationMenuItem> */}
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
              <NavigationMenuTrigger>Sales & Service</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                  {serviceComponents.map((sched) => (
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
          </LazyNavigationMenuList>
        </LazyNavigationMenu>
        <div className="flex items-center mr-1">
          <Link href="/">
            <Button variant="linkHover2" size="icon">
              <HomeIcon />
            </Button>
          </Link>
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
                      <span className="ml-auto text-red-500 font-bold">
                        {totalUnreadCount}
                      </span>
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
            </>
          ) : (
            <Link href="/sign-in">
              <Button>Sign In</Button>
            </Link>
          )}
        </div>
      </header>
    </RoleBasedWrapper>
  );
});

HeaderAuditor.displayName = "HeaderAuditor";

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

export default HeaderAuditor;
