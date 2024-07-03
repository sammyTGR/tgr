"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { HomeIcon, ChatBubbleIcon, DotFilledIcon } from "@radix-ui/react-icons";
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
    title: "Check On Orders",
    href: "/sales/orderreview/crew",
    description: "Check On Submitted Order Status",
  },
];

const formComps = [
  {
    title: "Gunsmithing",
    href: "/TGR/gunsmithing",
    description: "Weekly Firearms Maintenance",
  },
  {
    title: "Certifications",
    href: "/TGR/certifications",
    description: "View All Certifications",
  },
];

const HeaderGunsmith = React.memo(() => {
  const [user, setUser] = useState<any>(null);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const [isOnline, setIsOnline] = useState<boolean>(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data) {
        setUser(data.user);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      const fetchUnreadMessages = async () => {
        const { count } = await supabase
          .from("direct_messages")
          .select("*", { count: "exact" })
          .eq("receiver_id", user.id)
          .eq("is_read", false);
        setUnreadMessages(count || 0);
      };

      const fetchIsOnline = async () => {
        const { data } = await supabase
          .from("employees")
          .select("is_online")
          .eq("user_uuid", user.id)
          .single();
        if (data) {
          setIsOnline(data.is_online);
        }
      };

      fetchUnreadMessages();
      fetchIsOnline();

      const subscription = supabase
        .channel("direct_messages")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "direct_messages" },
          (payload) => {
            if (payload.new.receiver_id === user.id) {
              setUnreadMessages((prev) => prev + 1);
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/"; // Redirect to sign-in page after sign-out
  };

  return (
    <RoleBasedWrapper allowedRoles={["gunsmith"]}>
      <header className="flex justify-between items-center p-2">
        <NavigationMenu>
          <NavigationMenuList className="flex space-x-4 mr-3 ml-1">
            <NavigationMenuItem>
              <Link href="/TGR/sop">
                <Button variant="linkHover2">TGR SOPs</Button>
              </Link>
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
              <NavigationMenuTrigger>Forms & Reports</NavigationMenuTrigger>
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
              <Link href="/TGR/crew/chat">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={async () => {
                    // Reset unread messages count in the state
                    setUnreadMessages(0);

                    // Update the database to mark messages as read
                    if (user) {
                      const { data, error } = await supabase
                        .from("direct_messages")
                        .update({ is_read: true })
                        .eq("receiver_id", user.id)
                        .eq("is_read", false);

                      if (error) {
                        console.error(
                          "Error marking messages as read:",
                          error.message
                        );
                      }
                    }
                  }}
                >
                  <ChatBubbleIcon className="w-6 h-6" />
                  {unreadMessages > 0 && (
                    <span className="text-red-600 ml-1">{unreadMessages}</span>
                  )}
                </Button>
              </Link>
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
    </RoleBasedWrapper>
  );
});

HeaderGunsmith.displayName = "HeaderGunsmith";

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

export default HeaderGunsmith;
