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
import useUnreadMessages from "@/pages/api/fetch-unread";
import useUnreadOrders from "@/pages/api/useUnreadOrders"; // Import the hook
import useUnreadTimeOffRequests from "@/pages/api/useUnreadTimeOffRequests"; // Import the hook

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
    description: "DENY THEM ALL!",
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
  // {
  //   title: "Range Repairs",
  //   href: "/TGR/rangerepairs",
  //   description: "Submit ALL Range Repairs",
  // },
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

const HeaderAdmin = React.memo(() => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data) {
        setUser(data.user);
      }
    };
    fetchUser();
  }, []);

  const unreadCount = useUnreadMessages(user?.id); // Use the hook to get unread messages
  const unreadOrderCount = useUnreadOrders(); // Use the hook to get unread orders
  const unreadTimeOffCount = useUnreadTimeOffRequests(); // Use the hook to get unread time-off requests

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/"; // Redirect to sign-in page after sign-out
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
            <NavigationMenuItem>
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
          </NavigationMenuList>
        </NavigationMenu>
        <div className="flex items-center mr-1">
          {user ? (
            <>
              <Button
                variant="linkHover2"
                className="bg-red-500 text-white dark:bg-red-500 dark:text-white"
                size="sm"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <Link href="/TGR/crew/login">
              <Button variant="linkHover2">Sign In</Button>
            </Link>
          )}
          <Link href="/TGR/crew/chat">
            <Button variant="linkHover2" size="icon">
              <ChatBubbleIcon />
              {unreadCount > 0 && (
                <span className="">
                  <DotFilledIcon className="w-4 h-4 text-red-600" />
                </span>
              )}
            </Button>
          </Link>
          {unreadOrderCount > 0 && (
            <Link href="/sales/orderreview">
              <Button variant="linkHover1" size="icon">
                <FileTextIcon />
                {unreadOrderCount > 0 && (
                  <span className="badge">{unreadOrderCount}</span>
                )}
              </Button>
            </Link>
          )}
          {unreadTimeOffCount > 0 && (
            <Link href="/admin/timeoffreview">
              <Button variant="linkHover1" size="icon">
                <CalendarIcon />
                {unreadTimeOffCount > 0 && (
                  <span className="badge">{unreadTimeOffCount}</span>
                )}
              </Button>
            </Link>
          )}
          <Link href="/">
            <Button variant="linkHover2" size="icon">
              <HomeIcon />
            </Button>
          </Link>
          <ModeToggle />
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
