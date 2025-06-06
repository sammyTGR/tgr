'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { HomeIcon, PersonIcon, SunIcon, MoonIcon, ShadowIcon } from '@radix-ui/react-icons';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import { supabase } from '@/utils/supabase/client';
import RoleBasedWrapper from '@/components/RoleBasedWrapper';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useTheme } from 'next-themes';
import LoadingIndicator from '@/components/LoadingIndicator';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

const schedComponents = [
  {
    title: 'Team Calendar',
    href: '/TGR/crew/calendar',
    description: 'Schedules & Time Off Requests',
  },
];

const serviceComponents = [
  {
    title: 'Special Order Form',
    href: '/sales/orders',
    description: 'Submit Requests For Customers',
  },
  {
    title: 'Check On Orders',
    href: '/sales/orderreview/crew',
    description: 'Check On Submitted Order Status',
  },
  {
    title: 'Newsletter',
    href: '/public/subscribe',
    description: 'Subscribe To Our Email List',
  },
];

const formComps = [
  {
    title: 'Range Walks & Repairs',
    href: '/TGR/crew/range',
    description: 'Daily Range Walks & Repairs',
  },
  {
    title: 'Points Submissions',
    href: '/TGR/crew/points',
    description: 'Report All Submitted Points',
  },
  {
    title: 'Daily Deposits',
    href: '/TGR/deposits',
    description: 'Submit Daily Deposits',
  },
  {
    title: 'Certifications',
    href: '/TGR/certifications',
    description: 'View All Certifications',
  },
  {
    title: 'Rental Gun Checklist',
    href: '/TGR/rentals/checklist',
    description: 'Daily Rental Checklist',
  },
  {
    title: 'Bulletin Board',
    href: '/TGR/crew/bulletin',
    description: 'Bulletin Board',
  },
  {
    title: 'Patch Notes',
    href: '/patch-notes',
    description: 'Site Updates',
  },
];

const LazyNavigationMenu = dynamic(
  () =>
    import('@/components/ui/navigation-menu').then((module) => ({
      default: module.NavigationMenu,
    })),
  {
    loading: () => <p>Loading navigation...</p>,
  }
);

const LazyNavigationMenuList = dynamic(
  () =>
    import('@/components/ui/navigation-menu').then((module) => ({
      default: module.NavigationMenuList,
    })),
  {
    loading: () => <p>Loading menu...</p>,
  }
);

const LazyDropdownMenu = dynamic(
  () =>
    import('@/components/ui/dropdown-menu').then((module) => ({
      default: module.DropdownMenu,
    })),
  {
    loading: () => <p>Loading menu...</p>,
  }
);

const HeaderUser = React.memo(() => {
  const { setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading: userLoading,
    error: userError,
  } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    },
    retry: 3,
    retryDelay: 1000,
  });

  const {
    data: employeeData,
    isLoading: employeeLoading,
    error: employeeError,
  } = useQuery({
    queryKey: ['employee', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('role, employee_id')
        .eq('user_uuid', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    retry: 3,
    retryDelay: 1000,
  });

  useEffect(() => {
    if (userError || employeeError) {
      console.error('Auth error:', userError || employeeError);
      router.push('/sign-in');
    }
  }, [userError, employeeError, router]);

  const handleHomeClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (employeeData?.employee_id) {
      router.push(`/TGR/crew/profile/${employeeData.employee_id}`);
    } else {
      router.push('/');
    }
  };

  const handleSignOut = async () => {
    queryClient.clear();
    await supabase.auth.signOut();
    router.push('/sign-in');
  };

  const isLoading = userLoading || employeeLoading;

  return (
    <RoleBasedWrapper allowedRoles={['user']}>
      {isLoading && <LoadingIndicator />}
      <header className="flex justify-between items-center p-2">
        <LazyNavigationMenu>
          <LazyNavigationMenuList className="flex space-x-4 mr-3 ml-1">
            <NavigationMenuItem>
              <Link href="/TGR/dros/guide">
                <Button variant="linkHover2">DROS Guide</Button>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/TGR/sop">
                <Button variant="linkHover2">TGR SOPs</Button>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Scheduling</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                  {schedComponents.map((component) => (
                    <ListItem key={component.title} title={component.title} href={component.href}>
                      {component.description}
                    </ListItem>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Forms & Reports</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                  {formComps.map((component) => (
                    <ListItem key={component.title} title={component.title} href={component.href}>
                      {component.description}
                    </ListItem>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Sales & Service</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                  {serviceComponents.map((sched) => (
                    <ListItem key={sched.title} title={sched.title} href={sched.href}>
                      {sched.description}
                    </ListItem>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </LazyNavigationMenuList>
        </LazyNavigationMenu>
        <div className="flex items-center mr-1">
          <Button variant="linkHover2" size="icon" onClick={handleHomeClick}>
            <HomeIcon />
          </Button>
          {user ? (
            <>
              <LazyDropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="linkHover2" size="icon" className="mr-2">
                    <PersonIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mr-2">
                  <DropdownMenuLabel>Profile & Settings</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* <DropdownMenuItem>
                    <Link
                      href="/TGR/employees/profiles"
                      className="flex items-center w-full"
                    >
                      <PersonIcon className="mr-2 h-4 w-4" />

                      <span>Manage Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator /> */}

                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <ShadowIcon className="mr-2 h-4 w-4" />
                      <span>Change Theme</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={() => setTheme('light')}>
                          <SunIcon className="mr-2 h-4 w-4" />
                          <span>Light</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme('dark')}>
                          <MoonIcon className="mr-2 h-4 w-4" />
                          <span>Dark</span>
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>Sign Out</DropdownMenuItem>
                </DropdownMenuContent>
              </LazyDropdownMenu>
            </>
          ) : (
            <Link href="/sign-in">
              <Button variant="linkHover2">Sign In</Button>
            </Link>
          )}
        </div>
      </header>
    </RoleBasedWrapper>
  );
});

HeaderUser.displayName = 'HeaderUser';

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

export default HeaderUser;
