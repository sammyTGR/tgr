import { ReactNode, useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

interface WithRoleProps {
  children: ReactNode;
  allowedRoles: string[];
}

const WithRole = ({ children, allowedRoles }: WithRoleProps) => {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      const userRole = user?.publicMetadata?.role; // Access the role property here
      if (userRole && allowedRoles.includes(userRole as string)) {
        setAuthorized(true);
      } else {
        router.push('/sign-in'); // Redirect to a not authorized page or login
      }
    }
  }, [isLoaded, user]);

  if (!isLoaded || !authorized) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
};

export default WithRole;
