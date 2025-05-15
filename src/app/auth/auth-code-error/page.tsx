'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSupabase } from '@/providers/supabase-provider';

export default function AuthCodeErrorPage() {
  const router = useRouter();
  const { supabase } = useSupabase();

  useEffect(() => {
    // Sign out the user if they're in an invalid state
    const handleSignOut = async () => {
      await supabase.auth.signOut();
    };
    handleSignOut();
  }, [supabase.auth]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <h1 className="text-2xl font-bold">Authentication Error</h1>
        <p className="text-muted-foreground">
          There was a problem with the authentication process. Please try signing in again.
        </p>
        <div className="space-y-4">
          <Button onClick={() => router.push('/sign-in')} className="w-full">
            Return to Sign In
          </Button>
          <Button variant="outline" onClick={() => router.push('/')} className="w-full">
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
