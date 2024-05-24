"use client";

import * as React from "react";
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
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  SignInButton,
  SignOutButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import UserSessionHandler from "../components/UserSessionHandler";
import { cn } from "@/lib/utils";

const components: { title: string; href: string; description: string }[] = [
  {
    title: "Submit Audits",
    href: "/audits/submit",
    description: "LesssGOOOOO!!!",
  },
  {
    title: "Review Audits",
    href: "/auditreview",
    description: "Take A Gander At Audits",
  },
  {
    title: "DROS Guidance",
    href: "/audits/drosguide",
    description: "Sometimes We All Need A Lil' Help",
  },
];

const sched: { title: string; href: string; description: string }[] = [
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
    description: "DENIED!",
  },
];

export function HeaderAdmin() {
  return (
    <header className="flex justify-between items-center p-2">
      <NavigationMenu>
        <NavigationMenuList className="flex space-x-4 mr-3">
          <NavigationMenuItem>
            <NavigationMenuTrigger>Auditing</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                {components.map((component) => (
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
                {sched.map((sched) => (
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
      <div className="flex items-center mr-1 gap-2">
        <Link href="/">
          <Button variant="outline" size="icon">
            <HomeIcon />
          </Button>
        </Link>
        <Link href="/">
          <Button variant="outline" size="icon">
            <ModeToggle />
          </Button>
        </Link>
        <SignedOut>
          <SignUpButton>
            <Button>Sign Up</Button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <UserButton />
          <div className="mx-3 flex items-end">
            <UserSessionHandler />
          </div>
        </SignedIn>
      </div>
    </header>
  );
}

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
