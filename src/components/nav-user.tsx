"use client";

import {
  BadgeIcon,
  BellIcon,
  CaretSortIcon,
  ChevronDownIcon,
  HomeIcon,
  ExitIcon,
  PersonIcon,
  QuestionMarkIcon,
  Pencil2Icon,
  DashboardIcon,
  SunIcon,
  MoonIcon,
  ShadowIcon,
} from "@radix-ui/react-icons";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { User } from "@supabase/supabase-js";

export function NavUser() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const { setTheme } = useTheme();
  const queryClient = useQueryClient();

  // User data query
  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
    staleTime: Infinity,
  }) as { data: User | null };

  // Role data query
  const { data: userData } = useQuery({
    queryKey: ["userRole"],
    queryFn: async () => {
      const response = await fetch("/api/getUserRole");
      if (!response.ok) {
        throw new Error("Failed to fetch user role");
      }
      const data = await response.json();
      return data;
    },
    enabled: !!currentUser,
    staleTime: Infinity,
  });

  // Employee data query
  const { data: employeeData } = useQuery({
    queryKey: ["employee", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return null;
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("user_uuid", currentUser.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!currentUser?.id,
  });

  const handleHomeClick = () => {
    if (!userData?.role) return;

    let redirectUrl;
    switch (userData.role) {
      case "super admin":
      case "ceo":
        redirectUrl = "/admin/reports/dashboard/ceo";
        break;
      case "dev":
        redirectUrl = "/admin/reports/dashboard/dev";
        break;
      case "admin":
        redirectUrl = "/admin/reports/dashboard/admin";
        break;
      default:
        redirectUrl = employeeData?.employee_id
          ? `/TGR/crew/profile/${employeeData.employee_id}`
          : "/";
    }

    router.push(redirectUrl);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      queryClient.clear();
      router.push("/sign-in");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (!currentUser) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage
                  src={
                    currentUser.user_metadata?.avatar_url ||
                    "https://utfs.io/f/9jzftpblGSv7nvddLr3ZYIXtyiAHqxfuS6V9231FedsGbMWh"
                  }
                  alt={currentUser.email || ""}
                />
                <AvatarFallback className="rounded-lg">
                  {currentUser.email?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {currentUser.user_metadata?.full_name || currentUser.email}
                </span>
                <span className="truncate text-xs">
                  {employeeData?.department || "Department Not Set"}
                </span>
              </div>
              <CaretSortIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel>Profile & Settings</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleHomeClick}>
                <HomeIcon className="mr-2 h-4 w-4" />
                Home
              </DropdownMenuItem>
              {employeeData?.employee_id && (
                <DropdownMenuItem
                  onClick={() =>
                    router.push(`/TGR/crew/profile/${employeeData.employee_id}`)
                  }
                >
                  <PersonIcon className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => router.push("/support")}>
                <QuestionMarkIcon className="mr-2 h-4 w-4" />
                Support
              </DropdownMenuItem>
            </DropdownMenuGroup>

            {["super admin", "ceo", "dev", "admin"].includes(
              userData?.role
            ) && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => router.push("/admin/domains")}
                  >
                    <Pencil2Icon className="mr-2 h-4 w-4" />
                    Manage Domains
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/admin/reports/dashboard")}
                  >
                    <DashboardIcon className="mr-2 h-4 w-4" />
                    Admin Dashboard
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <ShadowIcon className="mr-2 h-4 w-4" />
                <span>Theme</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <SunIcon className="mr-2 h-4 w-4" />
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <MoonIcon className="mr-2 h-4 w-4" />
                  Dark
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <ExitIcon className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
