"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";

// Make sure to set this environment variable in your .env.local file
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

function CheckoutPageContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get("session_id");

  useEffect(() => {
    if (sessionId) {
      stripePromise.then((stripe) => {
        stripe?.redirectToCheckout({ sessionId });
      });
    }
  }, [sessionId]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting to checkout...</p>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          Loading...
        </div>
      }
    >
      <CheckoutPageContent />
    </Suspense>
  );
}
