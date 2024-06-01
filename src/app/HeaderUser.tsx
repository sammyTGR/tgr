"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { HomeIcon } from "@radix-ui/react-icons";
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

const schedComponents = [
  {
    title: "Calendar",
    href: "/TGR/crew/calendar",
    description: "Check Out The Work Schedule",
  },
  {
    title: "Time Off Request",
    href: "/TGR/crew/timeoffrequest",
    description: "Submit A Request",
  },
];

const serviceComponents = [
  {
    title: "Special Order Form",
    href: "/sales/orders",
    description: "Submit Requests For Customers",
  },
  {
    title: "Safety Waiver",
    href: "/public/waiver",
    description: "Submit A Safety Waiver",
  },
];

const formComps = [
  {
    title: "Daily Deposits",
    href: "/TGR/deposits",
    description: "Submit Daily Deposits",
  },
];

const HeaderUser = React.memo(() => {
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

  if (role !== "user") {
    return null; // Prevent rendering if the role is not user
  }

  return (
    <header className="flex justify-between items-center p-2">
      <NavigationMenu>
        <NavigationMenuList className="flex space-x-4 mr-3 ml-1">
          <NavigationMenuItem>
            <Link href="/TGR/dros/guide">DROS Guide</Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Scheduling</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                {schedComponents.map((component) => (
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

HeaderUser.displayName = "HeaderUser";

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

export default HeaderUser;
