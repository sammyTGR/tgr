"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { supabase } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import { toZonedTime, format as formatTZ } from "date-fns-tz";
import { format } from "date-fns";


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
  email: string;
  use_sick_time: boolean; // New field
  available_sick_time: number; // New field
}

export default function ApproveRequestsPage() {
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
      setIsLoading(false);
    } catch (error: any) {
      console.error("Failed to fetch time off requests:", error.message);
    }
  };

  const handleApprove = (request_id: number) => {
    const request = requests.find((req) => req.request_id === request_id);
    if (request) {
      handleRequest(
        request_id,
        "time_off",
        `Your Time Off Request For ${request.start_date} - ${request.end_date} Has Been Approved!`,
        request.use_sick_time // Pass the use_sick_time parameter
      );
    }
  };

  const handleDeny = async (request_id: number) => {
    await handleRequest(
      request_id,
      "denied",
      "Your Time Off Request Has Been Denied. Please Contact Management Directly For Details."
    );
  };

  const handleCalledOut = async (request_id: number) => {
    const request = requests.find((req) => req.request_id === request_id);
    if (request) {
      await handleRequest(
        request_id,
        "called_out",
        "Your Schedule Has Been Updated To Reflect That You Called Out.",
        request.use_sick_time // Pass the use_sick_time parameter
      );
    }
  };

  const handleLeftEarly = async (request_id: number) => {
    await handleRequest(
      request_id,
      "left_early",
      "Your Schedule Has Been Updated To Reflect That You Left Early."
    );
  };

  const handleCustomApproval = (request_id: number) => {
    setCurrentRequestId(request_id);
    setShowCustomApprovalModal(true);
  };

  const handleSubmitCustomApproval = async () => {
    if (currentRequestId !== null) {
      const request = requests.find(
        (req) => req.request_id === currentRequestId
      );
      if (request) {
        await handleRequest(
          currentRequestId,
          `Custom: ${customApprovalText}`,
          `Your Time Off Request For ${request.start_date} - ${request.end_date} Has Been Approved!`,
          request.use_sick_time // Pass the use_sick_time parameter
        );
      }
      setShowCustomApprovalModal(false);
      setCustomApprovalText("");
      setCurrentRequestId(null);
    }
  };

  const handleMarkAsDuplicate = async (request_id: number) => {
    try {
      const response = await fetch("/api/mark_duplicate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ request_id }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedRequests = requests.filter(
        (request) => request.request_id !== request_id
      );
      setRequests(updatedRequests);
    } catch (error: any) {
      console.error("Failed to mark as duplicate:", error.message);
    }
  };

  const sendEmail = async (email: string, subject: string, message: string) => {
    try {
      const response = await fetch("/api/send_email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, subject, message }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Email sent successfully:", result);
    } catch (error: any) {
      console.error("Failed to send email:", error.message);
    }
  };

  const handleRequest = async (
    request_id: number,
    action: string,
    emailMessage: string,
    use_sick_time: boolean = false
  ) => {
    try {
      const timeZone = 'America/Los_Angeles'; // Set your desired timezone
  
      const shouldUseSickTime =
        use_sick_time &&
        (action === "time_off" ||
          action === "called_out" ||
          action.startsWith("Custom"));
  
      const response = await fetch("/api/approve_request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          request_id,
          action,
          use_sick_time: shouldUseSickTime,
        }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const result = await response.json();
      const { employee_id, start_date, end_date, email } = result;
      if (!email) {
        throw new Error("Email not found in API response");
      }
  
      const startDate = toZonedTime(new Date(start_date), timeZone);
      const endDate = toZonedTime(new Date(end_date), timeZone);
      const dates = [];
      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
      ) {
        dates.push(new Date(d));
      }
  
      for (const date of dates) {
        const formattedDate = formatTZ(date, "yyyy-MM-dd", { timeZone });
        const dayOfWeek = date.getUTCDay();
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
  
        if (
          !refSchedules ||
          (refSchedules.start_time === null && refSchedules.end_time === null)
        ) {
          continue;
        }
  
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
          }
        } else {
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
          }
        }
      }
  
      if (shouldUseSickTime) {
        const { error: deductSickTimeError } = await supabase.rpc(
          "deduct_sick_time",
          {
            p_emp_id: employee_id,
            p_start_date: formatTZ(startDate, "yyyy-MM-dd", { timeZone }),
            p_end_date: formatTZ(endDate, "yyyy-MM-dd", { timeZone }),
          }
        );
  
        if (deductSickTimeError) {
          console.error("Error deducting sick time:", deductSickTimeError);
        }
  
        const { error: updateSickTimeError } = await supabase
          .from("time_off_requests")
          .update({
            use_sick_time: true,
            sick_time_year: new Date().getFullYear(),
          })
          .eq("request_id", request_id);
  
        if (updateSickTimeError) {
          console.error(
            `Error updating time_off_requests for use_sick_time:`,
            updateSickTimeError
          );
        }
      }
  
      if (action !== "pending") {
        const { error: updateError } = await supabase
          .from("time_off_requests")
          .update({ is_read: true })
          .eq("request_id", request_id);
  
        if (updateError) {
          throw new Error(updateError.message);
        }
      }
  
      const subject =
        action === "denied"
          ? "Time Off Request Denied"
          : action === "called_out"
          ? "You've Called Out"
          : action === "left_early"
          ? "You've Left Early"
          : "Time Off Request Approved";
      await sendEmail(email, subject, emailMessage);
  
      // Re-fetch the updated requests after handling the action
      await fetchRequests();
    } catch (error: any) {
      console.error("Failed to handle request:", error.message);
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
                  <p>Reason: {request.reason}</p>
                  {request.other_reason && (
                    <p>Details: {request.other_reason}</p>
                  )}
                  <p>
                    Available Sick Time: {request.available_sick_time} Hours
                  </p>{" "}
                  {/* Display available sick time */}
                  <label>
                    <input
                      type="checkbox"
                      checked={request.use_sick_time}
                      onChange={(e) =>
                        setRequests((prevRequests) =>
                          prevRequests.map((req) =>
                            req.request_id === request.request_id
                              ? { ...req, use_sick_time: e.target.checked }
                              : req
                          )
                        )
                      }
                    />
                    Use Sick Time
                  </label>
                </div>
                <div className="flex flex-col space-y-2">
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
                  <div className="flex">
                    <Button
                      variant="outline"
                      onClick={() => handleMarkAsDuplicate(request.request_id)}
                    >
                      Mark As Duplicate
                    </Button>
                  </div>
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
