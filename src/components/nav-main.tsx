"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import {
  FileTextIcon,
  CalendarIcon,
  BookOpen,
  Settings2,
  ClipboardCheck,
  FileText,
  Users,
  Building2,
  GraduationCap,
  Wrench,
  DollarSign,
  FileQuestion,
  ScrollText,
  Newspaper,
} from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase/client";

// Define role types
type Role =
  | "super admin"
  | "ceo"
  | "dev"
  | "admin"
  | "gunsmith"
  | "user"
  | "customer"
  | "auditor";

interface NavigationSection {
  title: string;
  icon: LucideIcon;
  url: string;
  items: {
    title: string;
    url: string;
    description: string;
    allowedRoles: Role[];
  }[];
}

const navigationSections: { [key: string]: NavigationSection } = {
  auditing: {
    title: "Auditing",
    icon: ClipboardCheck,
    url: "#",
    items: [
      {
        title: "Submit & Review Audits",
        url: "/admin/audits",
        description: "Enter Audits & Review Existing Ones",
        allowedRoles: ["super admin", "ceo", "dev", "admin", "auditor"],
      },
      {
        title: "DROS Guidance",
        url: "/TGR/dros/guide",
        description: "Sometimes We All Need A Lil' Help",
        allowedRoles: [
          "super admin",
          "ceo",
          "dev",
          "admin",
          "user",
          "gunsmith",
          "auditor",
        ],
      },
    ],
  },
  staffManagement: {
    title: "Scheduling",
    icon: CalendarIcon,
    url: "#",
    items: [
      {
        title: "Team Calendar",
        url: "/TGR/crew/calendar",
        description: "Schedules & Time Off Requests",
        allowedRoles: [
          "super admin",
          "ceo",
          "dev",
          "admin",
          "user",
          "gunsmith",
          "auditor",
        ],
      },
      {
        title: "Review Time Off Requests",
        url: "/admin/timeoffreview",
        description: "View All Requests For Time Off",
        allowedRoles: ["super admin", "ceo", "dev", "admin"],
      },
      {
        title: "Create | Manage Schedules",
        url: "/admin/schedules",
        description: "Manage Schedules & Timesheets",
        allowedRoles: ["super admin", "ceo", "dev", "admin"],
      },
    ],
  },
  formsAndReports: {
    title: "Forms & Reports",
    icon: FileText,
    url: "#",
    items: [
      {
        title: "View Certifications",
        url: "/TGR/certifications",
        description: "View All Certifications",
        allowedRoles: [
          "super admin",
          "ceo",
          "dev",
          "admin",
          "user",
          "gunsmith",
          "auditor",
        ],
      },
      {
        title: "Range Walks & Repairs",
        url: "/TGR/crew/range",
        description: "Daily Range Walks & Repairs",
        allowedRoles: [
          "super admin",
          "ceo",
          "dev",
          "admin",
          "user",
          "gunsmith",
          "auditor",
        ],
      },
      {
        title: "Submit Special Orders",
        url: "/sales/orders",
        description: "Submit Requests For Customers",
        allowedRoles: [
          "super admin",
          "ceo",
          "dev",
          "admin",
          "user",
          "auditor",
          "gunsmith",
        ],
      },
      {
        title: "View Special Orders",
        url: "/sales/orderreview/crew",
        description: "View All Submitted Orders",
        allowedRoles: ["super admin", "dev", "user"],
      },
      {
        title: "Special Orders Report",
        url: "/sales/orderreview",
        description: "View Submitted Orders",
        allowedRoles: ["super admin", "ceo", "dev", "admin"],
      },
      {
        title: "Gunsmithing",
        url: "/TGR/gunsmithing",
        description: "Weekly Gunsmithing Maintenance",
        allowedRoles: ["super admin", "ceo", "dev", "admin", "gunsmith"],
      },
      {
        title: "Rental Firearms Checklist",
        url: "/TGR/rentals/checklist",
        description: "Rental Inventory Check",
        allowedRoles: [
          "super admin",
          "ceo",
          "dev",
          "admin",
          "user",
          "gunsmith",
          "auditor",
        ],
      },
      {
        title: "Submit Daily Deposits",
        url: "/TGR/deposits",
        description: "Daily Deposits",
        allowedRoles: ["super admin", "ceo", "dev", "admin", "user", "auditor"],
      },
      {
        title: "DROS Training",
        url: "/TGR/dros/training",
        description: "DROS Simulation",
        allowedRoles: ["super admin", "ceo", "dev", "admin", "user", "auditor"],
      },
      {
        title: "Bulletin Board",
        url: "/TGR/crew/bulletin",
        description: "Bulletin Board",
        allowedRoles: [
          "super admin",
          "ceo",
          "dev",
          "admin",
          "user",
          "gunsmith",
          "auditor",
        ],
      },
      {
        title: "Points Submissions",
        url: "/TGR/crew/points",
        description: "Report All Submitted Points",
        allowedRoles: ["super admin", "ceo", "dev", "admin", "user", "auditor"],
      },
      {
        title: "Email Blasts",
        url: "/public/subscribe",
        description: "Sign Customers Up For Email Blasts",
        allowedRoles: ["super admin", "ceo", "dev", "admin", "user", "auditor"],
      },
    ],
  },
  management: {
    title: "Staff Management",
    icon: Users,
    url: "#",
    items: [
      {
        title: "Staff Profiles",
        url: "/admin/dashboard",
        description: "All Profiles",
        allowedRoles: ["super admin", "ceo", "dev", "admin"],
      },
      {
        title: "Weekly Meetings",
        url: "/admin/meetings",
        description: "Update & Meet Weekly",
        allowedRoles: ["super admin", "ceo", "dev", "admin"],
      },
      {
        title: "Manage Staff Data",
        url: "/TGR/employees",
        description: "Set All Staff Details",
        allowedRoles: ["super admin", "dev"],
      },
      {
        title: "Upload Files",
        url: "/admin/upload",
        description: "Uploadthing",
        allowedRoles: ["super admin", "dev"],
      },
      {
        title: "Onboarding",
        url: "/admin/onboarding",
        description: "New Member Onboarding",
        allowedRoles: ["super admin", "dev"],
      },
      {
        title: "Products & Pricing",
        url: "/pricing",
        description: "All Products & Subscriptions",
        allowedRoles: ["super admin", "ceo", "dev", "admin"],
      },
      {
        title: "Classes Schedule",
        url: "/public/classes",
        description: "Class Scheduling Page",
        allowedRoles: ["super admin", "ceo", "dev", "admin", "user"],
      },
      {
        title: "Patch Notes",
        url: "/patch-notes",
        description: "Patch Notes",
        allowedRoles: [
          "super admin",
          "ceo",
          "dev",
          "admin",
          "user",
          "gunsmith",
          "auditor",
        ],
      },
    ],
  },
  sops: {
    title: "SOPs",
    icon: ScrollText,
    url: "#",
    items: [
      {
        title: "TGR SOPs",
        url: "/TGR/sop",
        description: "SOPs For Front Of The House",
        allowedRoles: [
          "super admin",
          "ceo",
          "dev",
          "admin",
          "user",
          "gunsmith",
          "auditor",
        ],
      },
      {
        title: "Admin SOPs",
        url: "/admin/sop",
        description: "SOPs For Back Of The House",
        allowedRoles: ["super admin", "ceo", "dev", "admin", "auditor"],
      },
    ],
  },
};

export function NavMain() {
  // User data and role queries
  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
    staleTime: Infinity,
  });

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

  const userRole = userData?.role as Role;

  // Function to check if a navigation item should be visible
  const isItemVisible = (allowedRoles: Role[]) => {
    if (!userRole) return false;
    return allowedRoles.includes(userRole);
  };

  // Function to filter navigation items based on role
  const getVisibleItems = (items: NavigationSection["items"]) => {
    return items.filter((item) => isItemVisible(item.allowedRoles));
  };

  if (!currentUser || !userRole) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarMenu>
        {Object.entries(navigationSections).map(([key, section]) => {
          // Skip Staff Management section for non-admin roles
          if (
            key === "management" &&
            !["super admin", "ceo", "dev", "admin"].includes(userRole)
          ) {
            return null;
          }

          // Skip Auditing section for gunsmiths
          if (key === "auditing" && userRole === "gunsmith") {
            return null;
          }

          const visibleItems = getVisibleItems(section.items);
          if (visibleItems.length === 0) return null;

          return (
            <Collapsible key={section.title} asChild>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip={
                    key === "auditing" && userRole === "user"
                      ? "DROS Support"
                      : section.title
                  }
                >
                  <a href={section.url}>
                    <section.icon className="h-4 w-4" />
                    <span>
                      {key === "auditing" && userRole === "user"
                        ? "DROS Support"
                        : section.title}
                    </span>
                  </a>
                </SidebarMenuButton>
                <CollapsibleTrigger asChild>
                  <SidebarMenuAction className="data-[state=open]:rotate-90">
                    <ChevronRight />
                    <span className="sr-only">Toggle</span>
                  </SidebarMenuAction>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {visibleItems.map((item) => (
                      <SidebarMenuSubItem key={item.title}>
                        <SidebarMenuSubButton asChild>
                          <a href={item.url}>
                            <span>{item.title}</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
