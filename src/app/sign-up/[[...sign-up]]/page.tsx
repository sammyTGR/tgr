'use client';

import dynamic from 'next/dynamic';
import LoadingIndicator from '@/components/LoadingIndicator';

const LazySignUpContent = dynamic(() => import('./SignUpContent'), {
  loading: () => <LoadingIndicator />,
  ssr: false,
});

export default function SignUp() {
  return <LazySignUpContent />;
}
