"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
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
import { supabase } from "@/utils/supabase/client";
import useUnreadMessages from "@/pages/api/fetch-unread";
import useUnreadOrders from "@/pages/api/useUnreadOrders";
import useUnreadTimeOffRequests from "@/pages/api/useUnreadTimeOffRequests";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import { useRouter } from "next/navigation";
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
    title: "Create | Manage Schedules",
    href: "/admin/schedules",
    description: "Manage Schedules & Timesheets",
  },
  {
    title: "Staff Profiles",
    href: "/admin/dashboard",
    description: "All Profiles",
  },
];

const serviceComponents = [
  {
    title: "Submit Requests",
    href: "/sales/orders",
    description: "Submit Requests For Customers",
  },
  {
    title: "View Orders",
    href: "/sales/orderreview",
    description: "View Customer Requests",
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
    title: "Range Walks",
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
    title: "Checklist",
    href: "/TGR/rentals/checklist",
    description: "Daily Rental Checklist",
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

const reportsComps = [
  {
    title: "Daily Sales",
    href: "/admin/reports/sales",
    description: "Set Categories & View Sales",
  },
  {
    title: "Test Charts",
    href: "/admin/reports/charts",
    description: "Build Charts",
  },
  {
    title: "Range Walks & Repairs",
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
    title: "Manage Employee Data",
    href: "/TGR/employees",
    description: "Set All Employee Details",
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
    title: "Onboarding",
    href: "/admin/onboarding",
    description: "Trial Onboarding",
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
    title: "Gunsmithing",
    href: "/TGR/gunsmithing",
    description: "Weekly Gunsmithing Maintenance",
  },
  {
    title: "Rental Firearms Checklist",
    href: "/TGR/rentals/checklist",
    description: "Rental Inventory Check",
  },
];

const HeaderSuperAdmin = React.memo(() => {
  const [user, setUser] = useState<any>(null);
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const router = useRouter();
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const unreadOrderCount = useUnreadOrders(); // Use the hook to get unread orders
  const unreadTimeOffCount = useUnreadTimeOffRequests(); // Use the hook to get unread time-off requests
  const { setTheme } = useTheme();

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

    // Fetch unread direct messages
    const { data: dmData, error: dmError } = await supabase
      .from("direct_messages")
      .select("sender_id, is_read")
      .eq("receiver_id", user.id)
      .eq("is_read", false);

    // Fetch unread group messages
    const { data: groupData, error: groupError } = await supabase
      .from("group_chat_messages")
      .select("id, group_chat_id, read_by")
      .not("read_by", "cs", `{${user.id}}`);

    if (dmError) {
      console.error("Error fetching unread direct messages:", dmError.message);
    }

    if (groupError) {
      console.error(
        "Error fetching unread group messages:",
        groupError.message
      );
    }

    let totalUnread = 0;

    // Count unread direct messages
    if (dmData) {
      totalUnread += dmData.length;
    }

    // Count unread group messages
    if (groupData) {
      totalUnread += groupData.length;
    }

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
    if (user) {
      fetchUnreadCounts();

      const groupChatMessageSubscription = supabase
        .channel("group_chat_messages")
        .on<ChatMessage>(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "group_chat_messages" },
          (payload) => {
            if (
              payload.new.sender_id !== user.id &&
              (!payload.new.read_by || !payload.new.read_by.includes(user.id))
            ) {
              setTotalUnreadCount((prev) => prev + 1);
            }
          }
        )
        .subscribe();

      const directMessageSubscription = supabase
        .channel("direct_messages")
        .on<ChatMessage>(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "direct_messages" },
          (payload) => {
            if (payload.new.receiver_id === user.id && !payload.new.is_read) {
              setTotalUnreadCount((prev) => prev + 1);
            }
          }
        )
        .subscribe();

      return () => {
        groupChatMessageSubscription.unsubscribe();
        directMessageSubscription.unsubscribe();
      };
    }
  }, [user, fetchUnreadCounts]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/"; // Redirect to sign-in page after sign-out
  };

  const resetUnreadCounts = useCallback(async () => {
    if (!user) return;

    // Reset unread direct messages
    const { error: dmError } = await supabase
      .from("direct_messages")
      .update({ is_read: true })
      .eq("receiver_id", user.id)
      .eq("is_read", false);

    if (dmError) {
      console.error("Error resetting unread direct messages:", dmError.message);
    }

    // Reset unread group messages
    const { data: groupData, error: groupFetchError } = await supabase
      .from("group_chat_messages")
      .select("id, read_by")
      .not("read_by", "cs", `{${user.id}}`);

    if (groupFetchError) {
      console.error(
        "Error fetching unread group messages:",
        groupFetchError.message
      );
    } else if (groupData) {
      // Update each unread group message
      for (const message of groupData) {
        const updatedReadBy = [...(message.read_by || []), user.id];
        const { error: groupUpdateError } = await supabase
          .from("group_chat_messages")
          .update({ read_by: updatedReadBy })
          .eq("id", message.id);

        if (groupUpdateError) {
          console.error(
            "Error updating group message:",
            groupUpdateError.message
          );
        }
      }
    }

    // Reset the unread count in the state
    setTotalUnreadCount(0);
  }, [user]);

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

      // Reset the unread count
      setTotalUnreadCount(0);

      // Navigate to the chat page
      router.push("/TGR/crew/chat");
    }
  };

  const profileComps = [
    {
      title: "Notes",
      href: "/admin/todo",
      description: "All Kinda Notes",
    },
    {
      title: "Weekly Agenda",
      href: "/admin/weeklyagenda",
      description: "Weekly Agenda Topics",
    },
    {
      title: "Staff Profiles",
      href: "/admin/dashboard",
      description: "All Profiles",
    },
    {
      title: "Your Profile",
      href: employeeId ? `/TGR/crew/profile/${employeeId}` : "#",
      description: "Your Personal Profile",
    },
  ];

  const aimComps = [
    {
      title: "AIM",
      href: "/aim",
      description: "API Testing",
    },
  ];

  return (
    <RoleBasedWrapper allowedRoles={["super admin"]}>
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
              <NavigationMenuTrigger>Management</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
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
          </NavigationMenuList>
        </NavigationMenu>
        <div className="flex items-center">
          {/* <Button variant="linkHover2" size="icon" onClick={handleChatClick}>
            <ChatBubbleIcon />
            {unreadCount > 0 && (
              <DotFilledIcon className="w-4 h-4 text-red-600" />
            )}
          </Button> */}
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
                  {/* <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    Light
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    Dark
                  </DropdownMenuItem> */}
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
            <Link href="/TGR/crew/login">
              <Button variant="linkHover2">Sign In</Button>
            </Link>
          )}
        </div>
      </header>
    </RoleBasedWrapper>
  );
});

HeaderSuperAdmin.displayName = "HeaderSuperAdmin";

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

export default HeaderSuperAdmin;
