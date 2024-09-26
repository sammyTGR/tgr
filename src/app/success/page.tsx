"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";

interface ClassDetails {
  id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  price: number;
}

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get("session_id");
  const classId = searchParams?.get("class_id");

  const verifyPaymentMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/verify-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
      });
      if (!response.ok) {
        throw new Error("Failed to verify payment");
      }
      return response.json();
    },
  });

  const classQuery = useQuery({
    queryKey: ["class", classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_schedules")
        .select("*")
        .eq("id", classId)
        .single();

      if (error) throw error;
      return data as ClassDetails;
    },
    enabled: !!classId,
  });

  useEffect(() => {
    if (sessionId) {
      verifyPaymentMutation.mutate();
    }
  }, [sessionId]);

  if (verifyPaymentMutation.isPending || classQuery.isPending) {
    return <div>Verifying payment...</div>;
  }

  if (verifyPaymentMutation.isError || classQuery.isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            There was an error processing your payment:{" "}
            {verifyPaymentMutation.error?.message || classQuery.error?.message}
          </p>
          <p>Please contact support for assistance.</p>
        </CardContent>
      </Card>
    );
  }

  const classDetails = classQuery.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Successful!</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Thank you for your purchase.</p>
        {classDetails && (
          <div className="mt-4">
            <h2 className="text-xl font-semibold">{classDetails.title}</h2>
            <p>{classDetails.description}</p>
            <p>
              Date: {new Date(classDetails.start_time).toLocaleDateString()}
            </p>
            <p>
              Time: {new Date(classDetails.start_time).toLocaleTimeString()} -{" "}
              {new Date(classDetails.end_time).toLocaleTimeString()}
            </p>
            <p>Price: ${classDetails.price.toFixed(2)}</p>
          </div>
        )}
        <Button
          className="mt-4"
          onClick={() => (window.location.href = "/classes")}
        >
          Back to Classes
        </Button>
      </CardContent>
    </Card>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessPageContent />
    </Suspense>
  );
}
