"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { supabase } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import { toZonedTime, format as formatTZ } from "date-fns-tz";
import { format, parseISO } from "date-fns";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
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
  const [isCustomApprovalOpen, setIsCustomApprovalOpen] = useState(false);

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
      //console.("Failed to fetch time off requests:", error.message);
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
      //console.("Failed to deny request:", error);
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
    setIsCustomApprovalOpen(true);
  };

  const handleCloseCustomApproval = () => {
    setIsCustomApprovalOpen(false);
    setCustomApprovalText("");
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
          request.use_sick_time,
          request.use_vacation_time
        );
      }
      handleCloseCustomApproval();
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
      //console.("Failed to mark as duplicate:", error.message);
    }
  };

  const sendEmail = async (
    email: string,
    subject: string,
    templateName: string,
    templateData: any
  ) => {
    try {
      //console.log("Sending email:", { email, subject, templateName, templateData });
      const response = await fetch("/api/send_email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, subject, templateName, templateData }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        //console.("Email sending failed:", responseData);
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${JSON.stringify(
            responseData
          )}`
        );
      }

      //console.log("Email sent successfully:", responseData);
      return responseData;
    } catch (error: any) {
      //console.("Failed to send email:", error);
      // You might want to show an error message to the user here
      throw error; // Re-throw the error so it can be caught in handleRequest
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
      //console.log("Handling request:", { request_id, action, emailMessage, use_sick_time, use_vacation_time });

      const request = requests.find((req) => req.request_id === request_id);
      if (!request) {
        throw new Error("Request not found");
      }

      let templateName: string;
      let templateData: any;

      const formatDateWithDay = (dateString: string) => {
        const date = parseISO(dateString);
        return format(date, "EEEE, MMMM d, yyyy");
      };

      switch (action) {
        case "time_off":
          templateName = "TimeOffApproved";
          templateData = {
            name: request.name,
            startDate: formatDateWithDay(request.start_date),
            endDate: formatDateWithDay(request.end_date),
          };
          break;
        case "deny":
          templateName = "TimeOffDenied";
          templateData = {
            name: request.name,
            startDate: formatDateWithDay(request.start_date),
            endDate: formatDateWithDay(request.end_date),
          };
          break;
        case "called_out":
          templateName = "CalledOut";
          templateData = {
            name: request.name,
            date: formatDateWithDay(request.start_date),
          };
          break;
        case "left_early":
          templateName = "LeftEarly";
          templateData = {
            name: request.name,
            date: formatDateWithDay(request.start_date),
          };
          break;
        default:
          if (action.startsWith("Custom: ")) {
            templateName = "CustomStatus";
            templateData = {
              name: request.name,
              startDate: formatDateWithDay(request.start_date),
              endDate: formatDateWithDay(request.end_date),
              customMessage: action.slice(8),
            };
          } else {
            throw new Error("Invalid action");
          }
      }

      //console.log("Prepared template data:", templateData);

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
          ? "Time Off Request Approval"
          : "Time Off Request Status Update";

      //console.log("Calling approve_request API");
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
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`
        );
      }

      const result = await response.json();
      //console.log("API response:", result);

      //console.log("Sending email");
      await sendEmail(request.email, subject, templateName, templateData);

      //console.log("Updating local state");
      setRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.request_id === request_id
            ? { ...req, status: action, use_sick_time, use_vacation_time }
            : req
        )
      );

      //console.log("Re-fetching updated requests");
      await fetchRequests();

      //console.log("Request handled successfully");
    } catch (error: any) {
      //console.("Failed to handle request:", error);
      // You might want to show an error message to the user here
    }
  };

  return (
    <RoleBasedWrapper allowedRoles={["admin", "super admin", "dev"]}>
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

        <Dialog
          open={isCustomApprovalOpen}
          onOpenChange={setIsCustomApprovalOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Custom Approval</DialogTitle>
            </DialogHeader>
            <Textarea
              value={customApprovalText}
              onChange={(e) => setCustomApprovalText(e.target.value)}
              placeholder="Enter custom approval text..."
              className="min-h-[100px]"
            />
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseCustomApproval}>
                Cancel
              </Button>
              <Button onClick={handleSubmitCustomApproval}>Submit</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RoleBasedWrapper>
  );
}
