"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PaymentConfirmation() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [productName, setProductName] = useState<string>("");
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setStatus("error");
        return;
      }

      try {
        const response = await fetch("/api/verify-stripe-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionId }),
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error);

        setProductName(data.productName);
        setStatus("success");
      } catch (error) {
        console.error("Error verifying payment:", error);
        setStatus("error");
      }
    };

    verifyPayment();
  }, [sessionId]);

  if (status === "loading") {
    return <div>Verifying your payment...</div>;
  }

  if (status === "error") {
    return (
      <div>
        <h1>Payment Verification Failed</h1>
        <p>
          We couldn&apos;t verify your payment. Please contact support if you
          believe this is an error.
        </p>
        <Link href="/pricing">
          <Button>Return to Pricing</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-3xl font-bold mb-6">Payment Confirmed!</h1>
      <p className="mb-4">Thank you for your purchase of {productName}.</p>
      <p className="mb-6">
        Your transaction was successful and your account has been updated.
      </p>
      <Link href="/dashboard">
        <Button>Go to Dashboard</Button>
      </Link>
    </div>
  );
}
