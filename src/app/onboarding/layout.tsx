import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  if (
    (auth().sessionClaims?.metadata as { onboardingComplete?: boolean }).onboardingComplete === true
  ) {
    redirect('/');
  }

  return <>{children}</>;
}
