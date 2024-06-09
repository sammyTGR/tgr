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
} from "@/components/ui/navigation-menu";

const HeaderPublic = React.memo(() => {
  return (
    <header className="flex justify-between items-center p-2">
      <NavigationMenu>
        <NavigationMenuList className="flex space-x-4 mr-3">
          <NavigationMenuItem>
            <Link href="/">Home</Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/public/about">About</Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/public/contact">Contact</Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/sign-in">Sign In</Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/sign-up">Sign Up</Link>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <div className="flex items-center mr-1 gap-2">
        <Link href="/TGR/crew/login">
          <Button
            variant="outline"
            size="sm"
            className="bg-red-500 text-white dark:bg-red-500 dark:text-white"
          >
            TGR Employees
          </Button>
        </Link>
        <Link href="/">
          <Button variant="outline" size="icon">
            <HomeIcon />
          </Button>
        </Link>
        <Button variant="outline" size="icon">
          <ModeToggle />
        </Button>
      </div>
    </header>
  );
});

HeaderPublic.displayName = "HeaderPublic";

export default HeaderPublic;
