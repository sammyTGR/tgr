"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { supabase } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import { toZonedTime, format as formatTZ } from "date-fns-tz";
import { format } from "date-fns";
import { parseISO } from "date-fns";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const title = "Review Time Off Requests";
const timeZone = "America/Los_Angeles"; // Set your desired timezone
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
  created_at: string; // Add this line
  pay_type: "hourly" | "salary";
  vacation_time: number;
  use_vacation_time: boolean;
  hire_date: string;
}

type RequestAction =
  | "time_off"
  | "deny"
  | "called_out"
  | "left_early"
  | "pending"
  | `Custom: ${string}`;

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
    setIsLoading(true);
    try {
      const response = await fetch(
        "/api/time_off_requests?sort=created_at&order=asc"
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // console.log("Fetched and sorted data:", data);
      setRequests(data);
    } catch (error: any) {
      console.error("Failed to fetch time off requests:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = (request_id: number) => {
    const request = requests.find((req) => req.request_id === request_id);
    if (request) {
      if (request.use_sick_time && request.use_vacation_time) {
        alert(
          "Cannot use both sick time and vacation time for the same request"
        );
        return;
      }
      handleRequest(
        request_id,
        "time_off",
        `Your Time Off Request For ${request.start_date} - ${request.end_date} Has Been Approved!`,
        request.use_sick_time,
        request.use_vacation_time
      );
    }
  };

  const handleDeny = async (request_id: number) => {
    try {
      // Handle the request
      await handleRequest(
        request_id,
        "deny",
        "Your Time Off Request Has Been Denied. Please Contact Management Directly For Details."
      );

      // Remove the denied request from the state to update the review page
      setRequests((prevRequests) =>
        prevRequests.filter((request) => request.request_id !== request_id)
      );
    } catch (error) {
      console.error("Failed to deny request:", error);
    }
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
          `Custom: ${customApprovalText}` as RequestAction,
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

  const sendEmail = async (
    email: string,
    subject: string,
    templateName: string,
    templateData: any
  ) => {
    try {
      const response = await fetch("/api/send_email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, subject, templateName, templateData }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      // console.log("Email sent successfully:", result);
    } catch (error: any) {
      console.error("Failed to send email:", error.message);
    }
  };

  const handleRequest = async (
    request_id: number,
    action: RequestAction,
    emailMessage: string,
    use_sick_time: boolean = false,
    use_vacation_time: boolean = false
  ) => {
    try {
      const request = requests.find((req) => req.request_id === request_id);
      if (!request) {
        throw new Error("Request not found");
      }

      let templateName: string;
      let templateData: any;

      switch (action) {
        case "time_off":
          templateName = "TimeOffApproved";
          templateData = {
            name: request.name,
            startDate: request.start_date,
            endDate: request.end_date,
          };
          break;
        case "deny":
          templateName = "TimeOffDenied";
          templateData = {
            name: request.name,
            startDate: request.start_date,
            endDate: request.end_date,
          };
          break;
        case "called_out":
          templateName = "CalledOut";
          templateData = { name: request.name, date: request.start_date };
          break;
        case "left_early":
          templateName = "LeftEarly";
          templateData = { name: request.name, date: request.start_date };
          break;
        case "pending":
          templateName = "Pending"; // Define a default template name for pending
          templateData = { name: request.name }; // Add any relevant data
          break;
        default:
          if (action.startsWith("Custom: ")) {
            templateName = "CustomStatus"; // Or create a custom template
            templateData = {
              name: request.name,
              startDate: request.start_date,
              endDate: request.end_date,
              customMessage: action.slice(8), // Remove 'Custom: ' prefix
            };
          } else {
            throw new Error("Invalid action");
          }
      }

      const subject =
        action === "deny"
          ? "Time Off Request Denied"
          : action === "called_out"
          ? "You've Called Out"
          : action === "left_early"
          ? "You've Left Early"
          : action === "time_off"
          ? "Time Off Request Approved"
          : action.startsWith("Custom: ")
          ? "Time Off Request Custom Approval"
          : "Time Off Request Status Update";

      if (action !== "pending") {
       
        await sendEmail(request.email, subject, templateName, templateData);
      }

      const shouldUseSickTime =
        use_sick_time &&
        (action === "time_off" ||
          action === "called_out" ||
          action.startsWith("Custom"));

      const shouldUseVacationTime =
        use_vacation_time &&
        action === "time_off" &&
        request.pay_type === "salary";

      const response = await fetch("/api/approve_request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          request_id,
          action,
          use_sick_time,
          use_vacation_time,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      // console.log("API response:", result);
      const { employee_id, start_date, end_date, email } = result;
      if (!email) {
        throw new Error("Email not found in API response");
      }

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
          // Skip inserting or updating schedules for days the employee isn't scheduled to work
          continue;
        }

        if (shouldUseVacationTime) {
          const { error: deductVacationTimeError } = await supabase.rpc(
            "deduct_vacation_time",
            {
              p_emp_id: employee_id,
              p_start_date: formatTZ(startDate, "yyyy-MM-dd", { timeZone }),
              p_end_date: formatTZ(endDate, "yyyy-MM-dd", { timeZone }),
            }
          );

          if (deductVacationTimeError) {
            console.error(
              "Error deducting vacation time:",
              deductVacationTimeError
            );
          }

          const { error: updateVacationTimeError } = await supabase
            .from("time_off_requests")
            .update({
              use_vacation_time: true,
            })
            .eq("request_id", request_id);

          if (updateVacationTimeError) {
            console.error(
              `Error updating time_off_requests for use_vacation_time:`,
              updateVacationTimeError
            );
          }
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
        <div className="space-y-6">
          {requests.map((request) => (
            <Card key={request.request_id}>
              <CardHeader>
                <CardTitle>Time Off Request - {request.name}</CardTitle>
                <CardDescription>
                  Submitted on{" "}
                  {formatTZ(
                    toZonedTime(parseISO(request.created_at), timeZone),
                    "MMM d, yyyy 'at' h:mm a",
                    { timeZone }
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="details">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="time">Use Sick Or Vacation</TabsTrigger>
                    <TabsTrigger value="actions">Actions</TabsTrigger>
                  </TabsList>
                  <TabsContent value="details">
                    <div className="space-y-2">
                      <p>
                        <strong>Start Date:</strong>{" "}
                        {formatTZ(
                          toZonedTime(parseISO(request.start_date), timeZone),
                          "MMM d, yyyy",
                          { timeZone }
                        )}
                      </p>
                      <p>
                        <strong>End Date:</strong>{" "}
                        {formatTZ(
                          toZonedTime(parseISO(request.end_date), timeZone),
                          "MMM d, yyyy",
                          { timeZone }
                        )}
                      </p>
                      <p>
                        <strong>Reason:</strong> {request.reason}
                      </p>
                      {request.other_reason && (
                        <p>
                          <strong>Details:</strong> {request.other_reason}
                        </p>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="time">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p>
                          <strong>Available Sick Time:</strong>{" "}
                          {request.available_sick_time} Hours
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Switch
                            checked={request.use_sick_time}
                            onCheckedChange={(checked) =>
                              setRequests((prevRequests) =>
                                prevRequests.map((req) =>
                                  req.request_id === request.request_id
                                    ? {
                                        ...req,
                                        use_sick_time: checked,
                                        use_vacation_time: false,
                                      }
                                    : req
                                )
                              )
                            }
                            disabled={request.use_vacation_time}
                          />
                          <span>Use Sick Time</span>
                        </div>
                      </div>
                      <div>
                        <p>
                          <strong>Available Vacation Time:</strong>{" "}
                          {request.vacation_time} Hours
                        </p>
                        {request.pay_type?.toLowerCase() === "salary" ? (
                          <div className="flex items-center space-x-2 mt-2">
                            <Switch
                              checked={request.use_vacation_time}
                              onCheckedChange={(checked) =>
                                setRequests((prevRequests) =>
                                  prevRequests.map((req) =>
                                    req.request_id === request.request_id
                                      ? {
                                          ...req,
                                          use_vacation_time: checked,
                                          use_sick_time: false,
                                        }
                                      : req
                                  )
                                )
                              }
                              disabled={request.use_sick_time}
                            />
                            <span>Use Vacation Time</span>
                          </div>
                        ) : (
                          <p className="text-sm  mt-2">
                            Not applicable for non-salaried employees
                          </p>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="actions">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => handleApprove(request.request_id)}
                      >
                        Approve
                      </Button>
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => handleDeny(request.request_id)}
                      >
                        Deny
                      </Button>
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => handleCustomApproval(request.request_id)}
                      >
                        Custom Approval
                      </Button>
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => handleCalledOut(request.request_id)}
                      >
                        Called Out
                      </Button>
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => handleLeftEarly(request.request_id)}
                      >
                        Left Early
                      </Button>

                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() =>
                          handleMarkAsDuplicate(request.request_id)
                        }
                      >
                        Mark As Duplicate
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
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
