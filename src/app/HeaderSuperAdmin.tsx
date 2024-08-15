"use client";

import * as React from "react";
import { useState, useEffect } from "react";
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

const auditComponents = [
  {
    title: "Submit Audits",
    href: "/admin/audits/submit",
    description: "LesssGOOOOO!!!",
  },
  {
    title: "Review Audits",
    href: "/admin/audits/review",
    description: "Take A Gander At Audits",
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
  const unreadCount = useUnreadMessages(user?.id); // Use the hook to get unread messages
  const unreadOrderCount = useUnreadOrders(); // Use the hook to get unread orders
  const unreadTimeOffCount = useUnreadTimeOffRequests(); // Use the hook to get unread time-off requests
  const { setTheme } = useTheme();

  useEffect(() => {
    const fetchUserAndEmployee = async () => {
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
      }
    };
    fetchUserAndEmployee();
  }, []);

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
                  <Button variant="linkHover2" size="icon" className="mr-2">
                    <PersonIcon />
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
                    {unreadCount > 0 && (
                      <DotFilledIcon className="w-4 h-4 text-red-600" />
                    )}
                    <span>Messages</span>
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
