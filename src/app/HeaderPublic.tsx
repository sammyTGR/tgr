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
      <div className="flex items-center ">
        <Link href="/sign-in">
          <Button variant="linkHover1">Sign In</Button>
        </Link>
        <Link href="/">
          <Button variant="linkHover2" size="icon">
            <HomeIcon />
          </Button>
        </Link>
        <ModeToggle />
      </div>
    </header>
  );
});

HeaderPublic.displayName = "HeaderPublic";

export default HeaderPublic;
