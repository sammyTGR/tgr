'use client';

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/client';

// Define role types
type Role = 'super admin' | 'ceo' | 'dev' | 'admin' | 'gunsmith' | 'user' | 'customer' | 'auditor';

export default function SupportPage() {
  // User data and role queries
  const { data: currentUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
    staleTime: Infinity,
  });

  const { data: userData, isLoading: isLoadingRole } = useQuery({
    queryKey: ['userRole'],
    queryFn: async () => {
      const response = await fetch('/api/getUserRole');
      if (!response.ok) {
        throw new Error('Failed to fetch user role');
      }
      const data = await response.json();
      return data;
    },
    enabled: !!currentUser,
    staleTime: Infinity,
  });

  const userRole = userData?.role as Role;
  const isLoading = isLoadingUser || isLoadingRole;

  // Function to check if a section should be visible based on role
  const isSectionVisible = (title: string) => {
    if (!userRole) return false;

    // Only admin roles can see Audit Management and Management
    if (title === 'Audit Management') {
      return ['super admin', 'ceo', 'dev', 'admin', 'auditor'].includes(userRole);
    } else if (title === 'Management') {
      return ['super admin', 'ceo', 'dev', 'admin'].includes(userRole);
    }

    // All other sections are visible to all roles
    return true;
  };

  const supportSections = [
    {
      title: 'Getting Started',
      description: 'Learn the basics of navigating and using the dashboard',
      href: '/support/getting-started',
    },
    {
      title: 'Audit Management',
      description: 'How to create, edit, and manage audits effectively',
      href: '/support/audit-management',
    },
    {
      title: 'DROS Guidance',
      description: 'Detailed instructions for all DROS-related features',
      href: '/support/dros-guide',
    },
    {
      title: 'Scheduling',
      description: 'Detailed instructions for all scheduling-related features',
      href: '/support/scheduling',
    },
    {
      title: 'Forms & Reports',
      description: 'Understanding and utilizing forms and reports',
      href: '/support/forms-and-reports',
    },
    {
      title: 'Management',
      description: 'Detailed instructions for all management-related features',
      href: '/support/management',
    },
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Support Center</h1>
        <p className="text-muted-foreground">
          Welcome to the TGR support center. Find detailed guides and documentation to help you make
          the most of the TGR application.
        </p>
      </div>

      <ScrollArea className="h-[calc(100vh-250px)]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {supportSections
            .filter((section) => isSectionVisible(section.title))
            .map((section) => (
              <Link href={section.href} key={section.title}>
                <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle>{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
        </div>
      </ScrollArea>
    </div>
  );
}
