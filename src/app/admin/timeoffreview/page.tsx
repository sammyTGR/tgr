"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { supabase } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";

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

export default function ApproveRequestsPage() {
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const [showCustomApprovalModal, setShowCustomApprovalModal] = useState(false);
  const [customApprovalText, setCustomApprovalText] = useState("");
  const [currentRequestId, setCurrentRequestId] = useState<number | null>(null);
  const router = useRouter();

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

  const handleCustomApproval = (request_id: number) => {
    setCurrentRequestId(request_id);
    setShowCustomApprovalModal(true);
  };

  const handleSubmitCustomApproval = async () => {
    if (currentRequestId !== null) {
      await handleRequest(currentRequestId, `Custom: ${customApprovalText}`);
      setShowCustomApprovalModal(false);
      setCustomApprovalText("");
      setCurrentRequestId(null);
    }
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

      // Check reference schedules before updating the status
      const { employee_id, start_date, end_date } = result;
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      const dates = [];
      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
      ) {
        dates.push(new Date(d));
      }

      for (const date of dates) {
        const formattedDate = date.toISOString().split("T")[0];
        const dayOfWeek = date.getUTCDay(); // Get the day of the week (0-6)
        const daysOfWeek = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];
        const dayName = daysOfWeek[dayOfWeek];

        // Fetch the reference schedule
        const { data: refSchedules, error: refError } = await supabase
          .from("reference_schedules")
          .select("start_time, end_time")
          .eq("employee_id", employee_id)
          .eq("day_of_week", dayName)
          .single();

        if (refError) {
          console.error(
            `Error fetching reference schedule for ${dayName}:`,
            refError
          );
          continue;
        }

        // Log the reference schedule data
        console.log(`Reference schedule for ${dayName}:`, refSchedules);

        // Check if the reference schedule is empty or start_time and end_time are null
        if (
          !refSchedules ||
          (refSchedules.start_time === null && refSchedules.end_time === null)
        ) {
          console.log(
            `Skipping custom status update for ${dayName}, scheduled day off.`
          );
          continue;
        }

        // Update or insert the schedule
        const { data: scheduleData, error: scheduleFetchError } = await supabase
          .from("schedules")
          .select("*")
          .eq("employee_id", employee_id)
          .eq("schedule_date", formattedDate)
          .single();

        if (scheduleFetchError && scheduleFetchError.code !== "PGRST116") {
          console.error(
            `Error fetching schedule for date ${formattedDate}:`,
            scheduleFetchError
          );
          continue;
        }

        if (!scheduleData) {
          console.log(`Inserting new schedule for date ${formattedDate}`);
          const { error: scheduleInsertError } = await supabase
            .from("schedules")
            .insert({
              employee_id,
              schedule_date: formattedDate,
              day_of_week: dayName,
              status: action,
            });

          if (scheduleInsertError) {
            console.error(
              `Error inserting schedule for date ${formattedDate}:`,
              scheduleInsertError
            );
            // Handle error appropriately in the client-side context, e.g., show a notification
          }
        } else {
          console.log(`Updating existing schedule for date ${formattedDate}`);
          const { error: scheduleUpdateError } = await supabase
            .from("schedules")
            .update({ status: action })
            .eq("employee_id", employee_id)
            .eq("schedule_date", formattedDate);

          if (scheduleUpdateError) {
            console.error(
              `Error updating schedule for date ${formattedDate}:`,
              scheduleUpdateError
            );
            // Handle error appropriately in the client-side context, e.g., show a notification
          }
        }
      }

      // Update the is_read field if the status changes
      if (action !== "pending") {
        const { error: updateError } = await supabase
          .from("time_off_requests")
          .update({ is_read: true })
          .eq("request_id", request_id);

        if (updateError) {
          throw new Error(updateError.message);
        }
      }

      // Refresh the requests list after approval/denial
      const updatedRequests = requests.filter(
        (request) => request.request_id !== request_id
      );
      setRequests(updatedRequests);
    } catch (error: any) {
      console.error("Failed to handle request:", error.message);
      // Handle error appropriately in the client-side context, e.g., show a notification
    }
  };

  return (
    <RoleBasedWrapper allowedRoles={["admin", "super admin"]}>
      <div className="w-full max-w-4xl mx-auto px-4 py-8 md:py-12">
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
                  <Button
                    variant="outline"
                    onClick={() => handleCustomApproval(request.request_id)}
                  >
                    Custom Approval
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {showCustomApprovalModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 ">
            <div className="bg-muted dark:bg-muted p-6 rounded-lg shadow-lg">
              <h2 className="text-center text-xl font-bold mb-4">
                Custom Approval
              </h2>
              <textarea
                value={customApprovalText}
                onChange={(e) => setCustomApprovalText(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded mb-4"
                rows={4}
                placeholder="Enter custom approval text..."
              />
              <div className="flex justify-center space-between gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCustomApprovalModal(false)}
                >
                  Cancel
                </Button>
                <Button variant="outline" onClick={handleSubmitCustomApproval}>
                  Submit
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleBasedWrapper>
  );
}
