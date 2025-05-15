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

interface AuthState {
  isLoading: boolean;
  isValidating: boolean;
  hasSession: boolean;
  progress: number;
  role: string | null;
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

  // Query for checking auth user
  const sessionQuery = useQuery<UserSession | null>({
    queryKey: ['auth-user'],
    queryFn: () =>
      supabase.auth.getUser().then(({ data: { user }, error: userError }) => {
        if (userError || !user) {
          return null;
        }
        return { user };
      }),
  });

  // Query for fetching user role
  const roleQuery = useQuery<UserSession, Error>({
    queryKey: ['user-role', sessionQuery.data?.user?.id],
    enabled: !!sessionQuery.data?.user,
    queryFn: () => {
      const user = sessionQuery.data?.user;

      return Promise.resolve()
        .then(() =>
          supabase.from('employees').select('role, employee_id').eq('user_uuid', user.id).single()
        )
        .then(({ data: employeeData, error: employeeError }) => {
          if (!employeeError && employeeData) {
            return {
              user: sessionQuery.data?.user,
              role: employeeData.role,
              employee_id: employeeData.employee_id,
            };
          }

          // If not an employee, check customers table
          return Promise.resolve()
            .then(() => supabase.from('customers').select('role').eq('email', user.email).single())
            .then(({ data: customerData, error: customerError }) => {
              if (customerError || !customerData) {
                throw new Error('User role not found');
              }

              return {
                user: sessionQuery.data?.user,
                role: customerData.role,
              };
            });
        });
    },
  });

  // Navigation state query
  const navigationQuery = useQuery({
    queryKey: ['navigation', pathname, searchParams],
    queryFn: () =>
      Promise.resolve()
        .then(() => new Promise((resolve) => setTimeout(resolve, 100)))
        .then(() => null),
    staleTime: 0,
    refetchInterval: 0,
  });

  // Handle role-based routing
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
  if (sessionQuery.isLoading || navigationQuery.isLoading) {
    return <LoadingIndicator />;
  }

  // Handle role validation state
  if (roleQuery.isLoading) {
    return <div>Validating Role...</div>;
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
