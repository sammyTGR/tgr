"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PaymentButtonProps {
  classId: number;
}

interface CheckoutSession {
  sessionId: string;
  url: string;
}

export function PaymentButton({ classId }: PaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const createCheckoutSession = async (): Promise<CheckoutSession> => {
    const response = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classId }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create checkout session");
    }
    return response.json();
  };

  const { mutate: initiatePayment } = useMutation<CheckoutSession, Error, void>(
    {
      mutationFn: createCheckoutSession,
      onMutate: () => {
        setIsLoading(true);
      },
      onSuccess: (data: CheckoutSession) => {
        if (data.url) {
          window.location.href = data.url;
        } else {
          console.error("No URL returned from checkout session creation");
          toast.error("Failed to initiate payment. Please try again.");
        }
      },
      onError: (error: Error) => {
        console.error("Error in handlePayNow:", error);
        toast.error("Failed to initiate payment. Please try again.");
      },
      onSettled: () => {
        setIsLoading(false);
      },
    }
  );

  const handlePayNow = () => {
    initiatePayment();
  };

  return (
    <Button
      onClick={handlePayNow}
      className="px-4 py-2"
      variant="outline"
      disabled={isLoading}
    >
      {isLoading ? "Processing..." : "Purchase A Seat"}
    </Button>
  );
}
