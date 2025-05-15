'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import DOMPurify from 'isomorphic-dompurify';
import { supabase } from '@/utils/supabase/client';
import LoadingIndicator from '@/components/LoadingIndicator';
import dynamic from 'next/dynamic';

interface UserSession {
  user: any;
  role?: string;
  employee_id?: number;
}

const LazyLandingPageCustomer = dynamic(() => import('@/components/LandingPageCustomer'), {
  loading: () => <LoadingIndicator />,
});

export default function Home() {
  const router = useRouter();

  // Query for checking auth user with caching
  const {
    data: session,
    isLoading,
    error,
  } = useQuery<UserSession | null>({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) return null;

      // Try to get role from user metadata first
      const userRole = user.app_metadata?.role;
      if (userRole) {
        return { user, role: userRole };
      }

      // If no role in metadata, check database once
      const { data: employeeData } = await supabase
        .from('employees')
        .select('role, employee_id')
        .eq('user_uuid', user.id)
        .single();

      if (employeeData) {
        return {
          user,
          role: employeeData.role,
          employee_id: employeeData.employee_id,
        };
      }

      // If not an employee, check customers table
      const { data: customerData } = await supabase
        .from('customers')
        .select('role')
        .eq('email', user.email)
        .single();

      return customerData ? { user, role: customerData.role } : null;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1, // Only retry once
  });

  // Handle role-based routing
  useQuery({
    queryKey: ['role-routing', session?.role],
    enabled: !!session?.role,
    queryFn: () => {
      const role = session?.role;
      const employeeId = session?.employee_id;

      if (role === 'ceo' || role === 'super admin') {
        router.push('/admin/reports/dashboard/ceo');
      } else if (role === 'dev') {
        router.push('/admin/reports/dashboard/dev');
      } else if (role === 'admin') {
        router.push('/admin/reports/dashboard/admin');
      } else if (employeeId) {
        router.push('/TGR/crew/bulletin');
      }
      return null;
    },
    staleTime: Infinity,
  });

  // Handle loading state
  if (isLoading) {
    return <LoadingIndicator />;
  }

  // Handle no user state
  if (!session) {
    return router.push('/sign-in');
  }

  // Handle customer role
  if (session.role === 'customer') {
    return <LazyLandingPageCustomer />;
  }

  // Handle error state
  if (error) {
    const errorMessage = DOMPurify.sanitize(error.message || 'An error occurred');
    return <div>Error: {errorMessage}</div>;
  }

  return null;
}
