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
    <header className="flex justify-between items-center p-1">
      <NavigationMenu>
        <NavigationMenuList className="flex mr-3">
          <NavigationMenuItem>
            <Link href="/">
            <Button variant="linkHover2">Home</Button>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
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
            <Link href="/sign-in">
            <Button variant="linkHover2">Sign In</Button>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/sign-up">
            <Button variant="linkHover2">Sign Up</Button>
            </Link>
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
