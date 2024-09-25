"use client";

import * as React from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { HomeIcon } from "@radix-ui/react-icons";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

const aboutComps = [
  {
    title: "About Us",
    href: "/public/about",
    description: "Our Mission Statement & Values",
  },
  {
    title: "Contact Us",
    href: "/public/contact",
    description: "Here's Our Digits, Hit Us Up!",
  },
];

const prodComps = [
  {
    title: "Class Schedule",
    href: "/public/classes",
    description: "Our Class Schedules",
  },
  {
    title: "Memberships & Products",
    href: "/pricing",
    description: "You'll Find Something You Like!",
  },
];

const HeaderPublic = React.memo(() => {
  return (
    <header className="flex justify-between items-center p-1">
      <NavigationMenu>
        <NavigationMenuList className="flex mr-3">
          <NavigationMenuItem>
            <Link href="/">
              <Button variant="linkHover2">Home</Button>
            </Link>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuTrigger>TGR Info</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                {aboutComps.map((component) => (
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
            <NavigationMenuTrigger>
              All Classes & Products
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                {prodComps.map((component) => (
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
            <Link href="/public/about">
              <Button variant="linkHover2">About</Button>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/public/contact">
              <Button variant="linkHover2">Contact</Button>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/public/classes">
              <Button variant="linkHover2">Classes</Button>
            </Link>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <Link href="/pricing">
              <Button variant="linkHover2">Products & Pricing</Button>
            </Link>
          </NavigationMenuItem> */}
          <NavigationMenuItem>
            <Link href="/sign-up">
              <Button variant="linkHover2">Sign Up</Button>
            </Link>
          </NavigationMenuItem>
          {/* <NavigationMenuItem>
            <Link href="/sign-in">
              <Button variant="linkHover1">Sign In</Button>
            </Link>
          </NavigationMenuItem> */}
        </NavigationMenuList>
      </NavigationMenu>
      <div className="flex items-center mr-1">
        <Link href="/sign-in">
          <Button variant="linkHover1">Sign In</Button>
        </Link>
        {/* <Link href="/">
          <Button variant="linkHover2" size="icon">
            <HomeIcon />
          </Button>
        </Link> */}
        <ModeToggle />
      </div>
    </header>
  );
});

HeaderPublic.displayName = "HeaderPublic";

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

export default HeaderPublic;
