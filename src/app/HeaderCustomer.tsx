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
import { supabase } from "@/utils/supabase/client";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";

const accountComponents = [
  {
    title: "Account Settings",
    href: "/customer/account",
    description: "Manage your account settings and preferences.",
  },
  {
    title: "Order History",
    href: "/customer/orders",
    description: "View your past orders and track current ones.",
  },
];

const HeaderCustomer = React.memo(() => {
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/"; // Redirect to sign-in page after sign-out
  };

  return (
    <RoleBasedWrapper allowedRoles={["customer"]}>
    <header className="flex justify-between items-center p-2">
      <NavigationMenu>
        <NavigationMenuList className="flex space-x-4 mr-3">
          <NavigationMenuItem>
            <NavigationMenuTrigger>Account</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                {accountComponents.map((component) => (
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
      <div className="flex items-center mr-1 gap-2">
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
          <Link href="/sign-in">
            <Button>Sign In</Button>
          </Link>
        )}
        <Link href="/">
          <Button variant="outline" size="icon">
            <HomeIcon />
          </Button>
        </Link>
        <ModeToggle />
      </div>
    </header>
    </RoleBasedWrapper>
  );
});

HeaderCustomer.displayName = "HeaderCustomer";

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

export default HeaderCustomer;
