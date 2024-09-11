"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ChatBubbleIcon,
  HomeIcon,
  FileTextIcon,
  CalendarIcon,
  DotFilledIcon,
  ShadowIcon,
  SunIcon,
  MoonIcon,
  PersonIcon,
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
import useUnreadMessages from "@/pages/api/fetch-unread";
import useUnreadOrders from "@/pages/api/useUnreadOrders"; // Import the hook
import useUnreadTimeOffRequests from "@/pages/api/useUnreadTimeOffRequests"; // Import the hook
import { useRouter } from "next/navigation"; // Import useRouter
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
import { useTheme } from "next-themes";
import { useUnreadCounts } from "@/components/UnreadCountsContext";

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
    title: "Calendar",
    href: "/TGR/crew/calendar",
    description: "Where Dey At",
  },
  {
    title: "Submit Time Off",
    href: "/TGR/crew/timeoffrequest",
    description: "Submit A Request",
  },
  {
    title: "Review Time Off Requests",
    href: "/admin/timeoffreview",
    description: "View All Requests For Time Off",
  },
  {
    title: "Create Schedules",
    href: "/admin/schedules",
    description: "Manage Schedules",
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
    title: "Weekly Agenda",
    href: "/admin/weeklyagenda",
    description: "Weekly Agenda Topics",
  },
];

const manageComps = [
  {
    title: "Staff Profiles",
    href: "/admin/dashboard",
    description: "All Profiles",
  },
  {
    title: "Weekly Agenda",
    href: "/admin/weeklyagenda",
    description: "Weekly Agenda Topics",
  },
  {
    title: "Monthly Contest",
    href: "/admin/audits/contest",
    description: "Monthly Sales Contest",
  },
  {
    title: "Download Reports",
    href: "/admin/reports/download",
    description: "Download Various Reports",
  },
  {
    title: "Sales Report",
    href: "/admin/reports/sales",
    description: "View Daily Sales",
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
    title: "Submit Range Walks",
    href: "/TGR/rangewalk",
    description: "Submit Daily Range Walks",
  },
  {
    title: "Submit Range Repairs",
    href: "/TGR/rangewalk/report",
    description: "View All Range Walks & Repairs",
  },
  {
    title: "Submit Daily Deposits",
    href: "/TGR/deposits",
    description: "Daily Deposits",
  },
  {
    title: "Submit Claimed Points",
    href: "/TGR/crew/points",
    description: "Report All Submitted Points",
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
];

const HeaderAdmin = React.memo(() => {
  const [user, setUser] = useState<any>(null);
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const router = useRouter(); // Instantiate useRouter
  const { setTheme } = useTheme();
  const [isChatActive, setIsChatActive] = useState(false);
  const unreadOrderCount = useUnreadOrders(); // Use the hook to get unread orders
  const unreadTimeOffCount = useUnreadTimeOffRequests(); // Use the hook to get unread time-off requests
  const { resetUnreadCounts } = useUnreadCounts();
  const { totalUnreadCount: globalUnreadCount } = useUnreadCounts();

  const fetchUserAndEmployee = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (userData && userData.user) {
      setUser(userData.user);
      const { data: employeeData, error } = await supabase
        .from("employees")
        .select("employee_id")
        .eq("user_uuid", userData.user.id)
        .single();
      if (error) {
        console.error("Error fetching employee data:", error.message);
      } else {
        setEmployeeId(employeeData.employee_id);
      }
    } else {
      setUser(null);
      setEmployeeId(null);
    }
  }, []);

  const fetchUnreadCounts = useCallback(async () => {
    if (!user) return;

    const { data: dmData, error: dmError } = await supabase
      .from("direct_messages")
      .select("id")
      .eq("receiver_id", user.id)
      .eq("is_read", false);

    const { data: groupData, error: groupError } = await supabase
      .from("group_chat_messages")
      .select("id")
      .not("read_by", "cs", `{${user.id}}`);

    if (dmError) console.error("Error fetching unread DMs:", dmError.message);
    if (groupError)
      console.error(
        "Error fetching unread group messages:",
        groupError.message
      );

    const totalUnread = (dmData?.length || 0) + (groupData?.length || 0);
    setTotalUnreadCount(totalUnread);
  }, [user]);

  useEffect(() => {
    fetchUserAndEmployee();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN") {
          fetchUserAndEmployee();
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setEmployeeId(null);
          setTotalUnreadCount(0);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchUserAndEmployee]);

  useEffect(() => {
    const checkChatActive = () => {
      const isActive = localStorage.getItem("isChatActive") === "true";
      setIsChatActive(isActive);
    };

    checkChatActive(); // Check initially
    window.addEventListener("chatActiveChange", checkChatActive);

    return () => {
      window.removeEventListener("chatActiveChange", checkChatActive);
    };
  }, []);

  useEffect(() => {
    if (user && !isChatActive) {
      fetchUnreadCounts();

      const groupChatMessageSubscription = supabase
        .channel("group-chat-changes")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "group_chat_messages" },
          (payload) => {
            if (!isChatActive) {
              const newMessage = payload.new as ChatMessage;
              if (
                newMessage.sender_id !== user.id &&
                (!newMessage.read_by || !newMessage.read_by.includes(user.id))
              ) {
                setTotalUnreadCount((prev) => prev + 1);
              }
            }
          }
        )
        .subscribe();

      const directMessageSubscription = supabase
        .channel("direct-message-changes")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "direct_messages" },
          (payload) => {
            if (!isChatActive) {
              const newMessage = payload.new as ChatMessage;
              if (newMessage.receiver_id === user.id && !newMessage.is_read) {
                setTotalUnreadCount((prev) => prev + 1);
              }
            }
          }
        )
        .subscribe();

      return () => {
        groupChatMessageSubscription.unsubscribe();
        directMessageSubscription.unsubscribe();
      };
    }
  }, [user, fetchUnreadCounts, isChatActive]);

  useEffect(() => {
    setTotalUnreadCount(globalUnreadCount);
  }, [globalUnreadCount]);

  useEffect(() => {
    const handleUnreadCountsChanged = () => {
      setTotalUnreadCount(globalUnreadCount);
    };

    window.addEventListener("unreadCountsChanged", handleUnreadCountsChanged);

    return () => {
      window.removeEventListener(
        "unreadCountsChanged",
        handleUnreadCountsChanged
      );
    };
  }, [globalUnreadCount]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/"; // Redirect to sign-in page after sign-out
  };

  const handleChatClick = async () => {
    if (user) {
      // Mark all messages as read in the database
      const { data: messagesToUpdate, error: fetchError } = await supabase
        .from("direct_messages")
        .select("id, read_by")
        .or(`receiver_id.eq.${user.id},sender_id.eq.${user.id}`);

      if (fetchError) {
        console.error("Error fetching messages to update:", fetchError.message);
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
      resetUnreadCounts();

      // Navigate to the chat page
      router.push("/TGR/crew/chat");
    }
  };

  return (
    <RoleBasedWrapper allowedRoles={["admin"]}>
      <header className="flex justify-between items-center p-2">
        <NavigationMenu>
          <NavigationMenuList className="flex space-x-4 mr-3">
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
          </NavigationMenuList>
        </NavigationMenu>
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="linkHover2"
                    size="icon"
                    className="mr-2 relative"
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
                  <DropdownMenuItem>
                    <Link
                      href="/TGR/employees/profiles"
                      className="flex items-center w-full"
                    >
                      <PersonIcon className="mr-2 h-4 w-4" />

                      <span>Manage Profile</span>
                    </Link>
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

                  <DropdownMenuItem onClick={handleSignOut}>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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

HeaderAdmin.displayName = "HeaderAdmin";

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
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
