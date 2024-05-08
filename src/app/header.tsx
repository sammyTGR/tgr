import { ModeToggle } from "@/components/mode-toggle";
import { Button } from '@/components/ui/button'
import Link from "next/link";
import { HomeIcon } from "@radix-ui/react-icons";

const Header = () => {
    return (
        
        <nav className="ml-auto mr-3 hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link className="text-muted-foreground transition-colors hover:text-foreground" href="/auditreview">
            Review Audits
          </Link>
          <Link className="text-muted-foreground transition-colors hover:text-foreground" href="/audits/drosguide">
            DROS Guide
          </Link>
          <Link className="text-muted-foreground transition-colors hover:text-foreground" href="/audits/supaaudits">
            Submit Audits
          </Link>
          <Link className="text-foreground transition-colors hover:text-foreground" href="#">
            Settings
          </Link>
          <Link className="flex items-center gap-2 text-lg font-semibold md:text-base" href="/">
            <Button variant="outline" size="icon">
            <HomeIcon  />
            </Button>
            <ModeToggle />
          </Link>
        </nav>
       
    )
}
export default Header