import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
} from "@/components/ui/navigation-menu";
import { HomeIcon } from "@radix-ui/react-icons";
import { SignedOut, SignUpButton } from "@clerk/nextjs";

const HeaderPublic = () => {
  return (
    <header className="flex justify-between items-center p-2">
      <NavigationMenu>
        <NavigationMenuList className="flex space-x-4 mr-3">
          <NavigationMenuItem>
            <Link href="/" className="text-white">
              Home
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/public/about" className="text-white">
              About
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/public/contact" className="text-white">
              Contact
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/sign-in" className="text-white">
              Sign In
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/sign-up" className="text-white">
              Sign Up
            </Link>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <div className="flex items-center mr-1 gap-2">
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
};

export default HeaderPublic;
