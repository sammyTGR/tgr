"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChatBubbleIcon, HomeIcon } from "@radix-ui/react-icons";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { useRole } from "../context/RoleContext";
import { supabase } from "@/utils/supabase/client";

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
    title: "Range Walks",
    href: "/TGR/rangewalk",
    description: "Submit Daily Range Walks",
  },
  {
    title: "Range Repairs",
    href: "/TGR/rangerepairs",
    description: "Submit ALL Range Repairs",
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
  const { role } = useRole();

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data) {
        setUser(data.user);
      }
    };
    fetchUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/"; // Redirect to sign-in page after sign-out
  };

  if (role !== "admin") {
    return null; // Prevent rendering if the role is not admin
  }

  return (
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
              variant="outline"
              className="bg-red-500 text-white dark:bg-red-500 dark:text-white"
              size="sm"
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </>
        ) : (
          <Link href="/TGR/crew/login">
            <Button>Sign In</Button>
          </Link>
        )}
        <Link href="/TGR/crew/chat">
          <Button variant="ghost" size="icon">
            <ChatBubbleIcon />
          </Button>
        </Link>
        <Link href="/">
          <Button variant="ghost" size="icon">
            <HomeIcon />
          </Button>
        </Link>
        <ModeToggle />
      </div>
    </header>
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
