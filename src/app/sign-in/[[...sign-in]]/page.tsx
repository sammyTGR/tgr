'use client';

import dynamic from 'next/dynamic';

const LazySignInContent = dynamic(() => import('./SignInContent'), {
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  ),
  ssr: false,
});

export default function SignIn() {
  return <LazySignInContent />;
}
