'use client';

import * as React from 'react';
import { ModeToggle } from '@/components/mode-toggle';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { HomeIcon } from '@radix-ui/react-icons';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import LoadingIndicator from '@/components/LoadingIndicator';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const aboutComps = [
  {
    title: 'About Us',
    href: '/public/about',
    description: 'Our Mission Statement & Values',
  },
  {
    title: 'Contact Us',
    href: '/public/contact',
    description: "Here's Our Digits, Hit Us Up!",
  },
];

const prodComps = [
  {
    title: 'Class Schedule',
    href: '/public/classes',
    description: 'Our Class Schedules',
  },
  {
    title: 'Memberships & Products',
    href: '/pricing',
    description: "You'll Find Something You Like!",
  },
  {
    title: 'Newsletter',
    href: '/public/subscribe',
    description: 'Sign Up For Insider Deals',
  },
];

const HeaderPublic = React.memo(() => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { isLoading } = useQuery({
    queryKey: ['navigation', pathname, searchParams],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return null;
    },
    staleTime: 0,
    refetchInterval: 0,
  });

  return (
    <>
      {isLoading && <LoadingIndicator />}
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
                    <ListItem key={component.title} title={component.title} href={component.href}>
                      {component.description}
                    </ListItem>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger>All Classes & Products</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                  {prodComps.map((component) => (
                    <ListItem key={component.title} title={component.title} href={component.href}>
                      {component.description}
                    </ListItem>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <Link href="/sign-up">
                <Button variant="linkHover2">Sign Up</Button>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        <div className="flex items-center mr-1">
          <Link href="/sign-in">
            <Button variant="outline">Sign In</Button>
          </Link>
          <ModeToggle />
        </div>
      </header>
    </>
  );
});

HeaderPublic.displayName = 'HeaderPublic';

const ListItem = React.forwardRef<React.ElementRef<'a'>, React.ComponentPropsWithoutRef<'a'>>(
  ({ className, title, children, href, ...props }, ref) => {
    const queryClient = useQueryClient();
    const router = useRouter();

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      queryClient.invalidateQueries({ queryKey: ['navigation'] });
      router.push(href || '');
    };

    return (
      <li>
        <NavigationMenuLink asChild>
          <a
            ref={ref}
            href={href}
            onClick={handleClick}
            className={cn(
              'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
              className
            )}
            {...props}
          >
            <div className="text-sm font-medium leading-none">{title}</div>
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{children}</p>
          </a>
        </NavigationMenuLink>
      </li>
    );
  }
);

ListItem.displayName = 'ListItem';

export default HeaderPublic;
