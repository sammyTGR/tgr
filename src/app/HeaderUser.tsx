import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { HomeIcon } from "@radix-ui/react-icons";
import {
  SignInButton,
  SignOutButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import UserSessionHandler from "../components/UserSessionHandler";

const HeaderUser = () => {
  return (
    <header className="py-4">
      <nav className="ml-auto mr-3 flex flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <div className="mr-auto ml-3 flex">
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
        <Link
          className="text-muted-foreground transition-colors hover:text-foreground"
          href="/TGR/crew/calendar"
        >
          Calendar
        </Link>
        <Link
          className="text-muted-foreground transition-colors hover:text-foreground"
          href="/audits/drosguide"
        >
          DROS Guide
        </Link>
        <Link
          className="flex items-center gap-2 text-lg font-semibold md:text-base"
          href="/"
        >
          <Button variant="outline" size="icon">
            <HomeIcon />
          </Button>
          <ModeToggle />
        </Link>
      </nav>
    </header>
  );
};

export default HeaderUser;
