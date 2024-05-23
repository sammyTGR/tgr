import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { getUserRole } from '../../../supabase/lib/supabaseUserRole';

export function useUserRole() {
  const { userId } = useAuth();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserRole() {
      if (userId) {
        const role = await getUserRole(userId);
        setRole(role);
      }
    }

    fetchUserRole();
  }, [userId]);

  return role;
}
