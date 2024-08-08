"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { HomeIcon } from "@radix-ui/react-icons";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
} from "@/components/ui/navigation-menu";
import { supabase } from "@/utils/supabase/client";

const HeaderPublic = React.memo(() => {
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
    window.location.href = "/"; // Redirect to home page after sign-out
  };

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
          {!user && (
            <NavigationMenuItem>
              <Link href="/sign-up">
                <Button variant="linkHover2">Sign Up</Button>
              </Link>
            </NavigationMenuItem>
          )}
        </NavigationMenuList>
      </NavigationMenu>
      <div className="flex items-center mr-1 gap-2">
        {user ? (
          <Button
            variant="outline"
            className="bg-red-500 text-white dark:bg-red-500 dark:text-white"
            size="sm"
            onClick={handleSignOut}
          >
            Sign Out
          </Button>
        ) : (
          <Link href="/sign-in">
            <Button variant="linkHover2">Sign In</Button>
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
  );
});

HeaderPublic.displayName = "HeaderPublic";

export default HeaderPublic;
