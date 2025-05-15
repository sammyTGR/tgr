'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import DOMPurify from 'isomorphic-dompurify';
import { supabase } from '@/utils/supabase/client';
import LandingPageCustomer from '@/components/LandingPageCustomer';
import LoadingIndicator from '@/components/LoadingIndicator';
import dynamic from 'next/dynamic';

interface UserSession {
  user: any;
  role?: string;
  employee_id?: number;
}

const LazyLandingPageCustomer = dynamic(
  () =>
    import('@/components/LandingPageCustomer').then((module) => ({
      default: module.default,
    })),
  {
    loading: () => <LoadingIndicator />,
  }
);

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Query for checking auth user with caching
  const sessionQuery = useQuery<UserSession | null>({
    queryKey: ['auth-user'],
    queryFn: () =>
      supabase.auth.getUser().then(({ data: { user }, error: userError }) => {
        if (userError || !user) {
          return null;
        }
        return { user };
      }),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Query for fetching user role with caching
  const roleQuery = useQuery<UserSession, Error>({
    queryKey: ['user-role', sessionQuery.data?.user?.id],
    enabled: !!sessionQuery.data?.user,
    queryFn: async () => {
      const user = sessionQuery.data?.user;
      if (!user) throw new Error('No user found');

      // Try to get role from user metadata first
      const userRole = user.app_metadata?.role;
      if (userRole) {
        return {
          user,
          role: userRole,
        };
      }

      // If no role in metadata, check database
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('role, employee_id')
        .eq('user_uuid', user.id)
        .single();

      if (!employeeError && employeeData) {
        return {
          user,
          role: employeeData.role,
          employee_id: employeeData.employee_id,
        };
      }

      // If not an employee, check customers table
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('role')
        .eq('email', user.email)
        .single();

      if (customerError || !customerData) {
        throw new Error('User role not found');
      }

      return {
        user,
        role: customerData.role,
      };
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Handle role-based routing with caching
  useQuery({
    queryKey: ['role-routing', roleQuery.data?.role],
    enabled: !!roleQuery.data?.role,
    queryFn: () =>
      Promise.resolve().then(() => {
        const role = roleQuery.data?.role;
        const employeeId = roleQuery.data?.employee_id;

        if (role === 'ceo' || role === 'super admin') {
          router.push('/admin/reports/dashboard/ceo');
        } else if (role === 'dev') {
          router.push('/admin/reports/dashboard/dev');
        } else if (['admin'].includes(role || '')) {
          router.push('/admin/reports/dashboard/admin');
        } else if (employeeId) {
          router.push(`/TGR/crew/bulletin`);
        }
        return null;
      }),
    staleTime: Infinity,
  });

  // Handle loading states
  if (sessionQuery.isLoading) {
    return <LoadingIndicator />;
  }

  // Handle no user state
  if (!sessionQuery.data) {
    return router.push('/sign-in');
  }

  // Handle customer role
  if (roleQuery.data?.role === 'customer') {
    return <LazyLandingPageCustomer />;
  }

  // Handle error states
  if (sessionQuery.error || roleQuery.error) {
    const errorMessage = DOMPurify.sanitize(
      (sessionQuery.error || roleQuery.error)?.message || 'An error occurred'
    );
    return <div>Error: {errorMessage}</div>;
  }

  return null;
}
