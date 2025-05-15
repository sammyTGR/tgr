'use client';

import dynamic from 'next/dynamic';
import LoadingIndicator from '@/components/LoadingIndicator';

const LazySignInContent = dynamic(() => import('./SignInContent'), {
  loading: () => <LoadingIndicator />,
  ssr: false,
});

export default function SignIn() {
  return <LazySignInContent />;
}
