"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/utils/supabase/client";

function SuccessPageContent() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
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

          if (response.ok) {
            setStatus("success");
          } else {
            setStatus("error");
          }
        } catch (error) {
          console.error("Error verifying payment:", error);
          setStatus("error");
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
        There was an error processing your payment. Please contact support.
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
