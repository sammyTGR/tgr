'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

function PaymentConfirmationContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const { data, isLoading, error } = useQuery({
    queryKey: ['verifyPayment', sessionId],
    queryFn: async () => {
      if (!sessionId) throw new Error('Session ID not found');
      const response = await fetch('/api/verify-stripe-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      if (!response.ok) throw new Error('Error verifying payment');
      return response.json();
    },
    enabled: !!sessionId,
  });

  if (isLoading) {
    return <div>Our gnomes are working as quickly as they can...</div>;
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-6 shadow-md rounded-lg">
        <h1 className="text-3xl font-bold mb-6">Payment Verification Failed</h1>
        <p>
          We couldn&apos;t verify your payment. Please contact support if you believe this is an
          error.
        </p>
        <p className="text-red-500 mb-6">{(error as Error).message}</p>
        <Link href="/pricing">
          <Button variant="outline" className="mt-6">
            Return to Products
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 shadow-md rounded-lg">
      <h1 className="text-3xl font-bold mb-6">Payment Confirmed!</h1>
      <p className="mb-4">Thank you for your purchase!</p>
      <p className="mb-6">Your transaction was successful and your account has been updated.</p>
      <Link href="/customer/orders">
        <Button variant="outline" className="mt-6">
          View Your Purchases
        </Button>
      </Link>
    </div>
  );
}

export default function PaymentConfirmation() {
  return (
    <Suspense fallback={<div></div>}>
      <PaymentConfirmationContent />
    </Suspense>
  );
}
