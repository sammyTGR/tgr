"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/utils/supabase/client";

function SuccessPageContent() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get("session_id");

  useEffect(() => {
    const verifyPayment = async () => {
      if (sessionId) {
        try {
          const response = await fetch("/api/verify-payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ sessionId }),
          });

          const result = await response.json();

          if (response.ok) {
            setStatus("success");
          } else {
            setStatus("error");
            setErrorMessage(result.error || "Unknown error occurred");
          }
        } catch (error) {
          console.error("Error verifying payment:", error);
          setStatus("error");
          setErrorMessage("Network error occurred");
        }
      }
    };

    verifyPayment();
  }, [sessionId]);

  if (status === "loading") {
    return <div>Verifying payment...</div>;
  }

  if (status === "error") {
    return (
      <div>
        <h1>Payment Error</h1>
        <p>There was an error processing your payment: {errorMessage}</p>
        <p>Please contact support for assistance.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Payment Successful!</h1>
      <p>Thank you for your purchase.</p>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessPageContent />
    </Suspense>
  );
}
