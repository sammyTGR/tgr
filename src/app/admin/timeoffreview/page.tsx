"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { useUser } from '@clerk/clerk-react';
import { useRouter } from "next/navigation";
import WithRole from "@/components/withRole"; // Import the HOC
import UserSessionHandler from "@/components/UserSessionHandler"; // Import UserSessionHandler

const title = "Review Time Off Requests";

interface TimeOffRequest {
  request_id: number;
  employee_id: number;
  start_date: string;
  end_date: string;
  reason: string;
  other_reason: string;
  status: string;
  name: string;
}

function ApproveRequestsPage() {
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    async function fetchUserRole() {
      if (user) {
        const email = user.primaryEmailAddress?.emailAddress.toLowerCase() || user.emailAddresses[0]?.emailAddress.toLowerCase();
        const response = await fetch(`/api/getUserRole?email=${encodeURIComponent(email)}`);
        if (!response.ok) {
          console.error('Failed to fetch user role:', await response.text());
          router.push('/unauthorized');
          setIsLoading(false);
        } else {
          const data = await response.json();
          setUserRole(data.role);
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    }

    fetchUserRole();
  }, [user, router]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch("/api/time_off_requests");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setRequests(data);
    } catch (error: any) {
      console.error("Failed to fetch time off requests:", error.message);
    }
  };

  if (isLoading) {
    return <p>Checking authorization...</p>;
  }

  if (!userRole || (userRole !== 'admin' && userRole !== 'super admin')) {
    return <p>Unauthorized access</p>;
  }

  const handleApprove = async (request_id: number) => {
    await handleRequest(request_id, "approved");
  };

  const handleDeny = async (request_id: number) => {
    await handleRequest(request_id, "denied");
  };

  const handleCalledOut = async (request_id: number) => {
    await handleRequest(request_id, "called_out");
  };

  const handleLeftEarly = async (request_id: number) => {
    await handleRequest(request_id, "left_early");
  };

  const handleRequest = async (request_id: number, action: string) => {
    try {
      const response = await fetch("/api/approve_request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ request_id, action }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Refresh the requests list after approval/denial
      const updatedRequests = requests.filter(
        (request) => request.request_id !== request_id
      );
      setRequests(updatedRequests);
    } catch (error: any) {
      console.error("Failed to handle request:", error.message);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 md:py-12">
      <UserSessionHandler /> {/* Include UserSessionHandler */}
      <h1 className="text-2xl font-bold mb-6">
        <TextGenerateEffect words={title} />
      </h1>
      <div className="space-y-4">
        {requests.map((request) => (
          <div
            key={request.request_id}
            className="p-4 bg-white dark:bg-gray-950 rounded-lg shadow-md"
          >
            <div className="flex justify-between">
              <div>
                <p className="font-medium">Employee: {request.name}</p>
                <p>Start Date: {request.start_date}</p>
                <p>End Date: {request.end_date}</p>
                <p>
                  Reason: {request.reason}{" "}
                  {request.reason === "Other" &&
                    request.other_reason &&
                    `: ${request.other_reason}`}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => handleApprove(request.request_id)}
                >
                  Approve
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDeny(request.request_id)}
                >
                  Deny
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleCalledOut(request.request_id)}
                >
                  Called Out
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleLeftEarly(request.request_id)}
                >
                  Left Early
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Wrap the page with the WithRole HOC and specify allowed roles
export default function ProtectedApproveRequestsPage() {
  return (
    <WithRole allowedRoles={['admin', 'super admin']}>
      <ApproveRequestsPage />
    </WithRole>
  );
}
