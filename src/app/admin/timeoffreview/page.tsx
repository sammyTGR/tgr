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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DOMPurify from "dompurify";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  is_future_request: boolean;
  sick_time_history?: {
    year: number;
    hours_used: number;
    employee_name: string;
  }[];
  hours_deducted: number;
}

type RequestAction =
  | "time_off"
  | "deny"
  | "called_out"
  | "left_early"
  | "pending"
  | `Custom: ${string}`;

export default function ApproveRequestsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Query for fetching time off requests
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["timeOffRequests"],
    queryFn: () => {
      return Promise.resolve(
        fetch("/api/time_off_requests?sort=created_at&order=asc").then(
          (response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
          }
        )
      );
    },
  });

  const dialogQuery = useQuery({
    queryKey: ["customApprovalDialog"],
    queryFn: () => ({
      isOpen: false,
      text: "",
      currentRequestId: null as number | null,
    }),
    staleTime: Infinity,
  });

  const leftEarlyDialogQuery = useQuery({
    queryKey: ["leftEarlyDialog"],
    queryFn: () => ({
      isOpen: false,
      time: "",
      currentRequestId: null as number | null,
    }),
    staleTime: Infinity,
  });

  const leftEarlyDataQuery = useQuery({
    queryKey: ["leftEarlyData"],
    queryFn: () => ({
      hour: "",
      minute: "",
      period: "PM",
      currentRequestId: null as number | null,
    }),
    staleTime: Infinity,
  });

  const { data: dialogState = { isOpen: false, requestId: null, text: "" } } =
    useQuery({
      queryKey: ["customApprovalDialog"],
      queryFn: () => ({ isOpen: false, requestId: null, text: "" }),
      staleTime: Infinity,
    });

  const dialogMutation = useMutation({
    mutationFn: (newState: {
      isOpen: boolean;
      text: string;
      currentRequestId: number | null;
    }) => {
      return Promise.resolve(
        queryClient.setQueryData(["customApprovalDialog"], newState)
      );
    },
  });

  const leftEarlyDialogMutation = useMutation({
    mutationFn: (newState: {
      isOpen: boolean;
      time: string;
      currentRequestId: number | null;
    }) => {
      return Promise.resolve(
        queryClient.setQueryData(["leftEarlyDialog"], newState)
      );
    },
  });

  // Mutation for handling request updates
  const updateRequestMutation = useMutation({
    mutationFn: ({
      request_id,
      action,
      use_sick_time,
      use_vacation_time,
    }: {
      request_id: number;
      action: RequestAction;
      use_sick_time?: boolean;
      use_vacation_time?: boolean;
    }) => {
      return Promise.resolve(
        fetch("/api/approve_request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            request_id,
            action,
            use_sick_time,
            use_vacation_time,
          }),
        }).then((response) => {
          if (!response.ok) {
            throw new Error("Failed to update request");
          }
          return response.json();
        })
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeOffRequests"] });
    },
  });

  // Mutation for marking duplicates
  const markDuplicateMutation = useMutation({
    mutationFn: (request_id: number) => {
      return Promise.resolve(
        fetch("/api/mark_duplicate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ request_id }),
        }).then((response) => {
          if (!response.ok) {
            throw new Error("Failed to mark as duplicate");
          }
          return response.json();
        })
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeOffRequests"] });
    },
  });

  // Mutation for sending emails
  const sendEmailMutation = useMutation({
    mutationFn: ({
      email,
      subject,
      templateName,
      templateData,
    }: {
      email: string;
      subject: string;
      templateName: string;
      templateData: any;
    }) => {
      return Promise.resolve(
        fetch("/api/send_email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            subject,
            templateName,
            templateData,
          }),
        }).then((response) => {
          if (!response.ok) {
            throw new Error("Failed to send email");
          }
          return response.json();
        })
      );
    },
  });

  // Mutation for updating time usage
  const timeUsageMutation = useMutation({
    mutationFn: async ({
      requestId,
      useSickTime,
      useVacationTime,
    }: {
      requestId: number;
      useSickTime: boolean;
      useVacationTime: boolean;
    }) => {
      const response = await fetch("/api/approve_request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: requestId,
          action: "pending",
          use_sick_time: useSickTime,
          use_vacation_time: useVacationTime,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update time usage");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeOffRequests"] });
    },
  });

  // Dialog handler functions
  const handleOpenCustomApproval = (requestId: number) => {
    dialogMutation.mutate({
      isOpen: true,
      text: "",
      currentRequestId: requestId,
    });
  };

  const handleCloseCustomApproval = () => {
    dialogMutation.mutate({
      isOpen: false,
      text: "",
      currentRequestId: null,
    });
  };

  const handleCustomApprovalTextChange = (text: string) => {
    const currentState = queryClient.getQueryData([
      "customApprovalDialog",
    ]) as any;
    dialogMutation.mutate({
      ...currentState,
      text: DOMPurify.sanitize(text),
    });
  };

  const handleSubmitCustomApproval = () => {
    const dialogState = queryClient.getQueryData([
      "customApprovalDialog",
    ]) as any;
    if (dialogState?.currentRequestId && dialogState?.text) {
      handleCustomApproval(dialogState.currentRequestId, dialogState.text);
      handleCloseCustomApproval();
    }
  };

  // Handler for time usage switches
  const handleTimeUsageChange = (
    requestId: number,
    type: "sick" | "vacation",
    checked: boolean
  ) => {
    const request = requests.find(
      (req: TimeOffRequest) => req.request_id === requestId
    );
    if (!request) {
      console.error("Request not found:", requestId);
      return;
    }

    console.log("Handling time usage change:", {
      requestId,
      type,
      checked,
      currentState: {
        useSickTime: request.use_sick_time,
        useVacationTime: request.use_vacation_time,
      },
    });

    timeUsageMutation.mutate(
      {
        requestId,
        useSickTime: type === "sick" ? checked : false,
        useVacationTime: type === "vacation" ? checked : false,
      },
      {
        onSuccess: () => {
          console.log("Switch update successful");
        },
        onError: (error) => {
          console.error("Switch update failed:", error);
        },
      }
    );
  };

  // Update the JSX for the switches
  const renderTimeUsageSwitches = (request: TimeOffRequest) => {
    return (
      <div className="grid grid-cols-2 gap-4">
        <div>
          {request.pay_type?.toLowerCase() === "salary" ? (
            <p className="text-sm mt-2">Not applicable for salary employees</p>
          ) : (
            <>
              <div className="space-y-1">
                <p>
                  <strong>Available Sick Time:</strong>{" "}
                  {request.available_sick_time.toFixed(1)} Hours
                </p>
                {request.use_sick_time && request.hours_deducted && (
                  <p className="text-sm text-muted-foreground">
                    Potential usage with this request:{" "}
                    {request.hours_deducted.toFixed(1)} hours
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <Switch
                  checked={request.use_sick_time}
                  onCheckedChange={(checked) =>
                    timeUsageMutation.mutate({
                      requestId: request.request_id,
                      useSickTime: checked,
                      useVacationTime: false,
                    })
                  }
                  disabled={
                    request.use_vacation_time ||
                    (request.available_sick_time <= 0 && !request.use_sick_time)
                  }
                />
                <span>Use Sick Time</span>
              </div>
            </>
          )}
        </div>
        <div>
          {request.pay_type?.toLowerCase() === "salary" ? (
            <>
              <p>
                <strong>Available Vacation Time:</strong>{" "}
                {request.vacation_time} Hours
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <Switch
                  checked={request.use_vacation_time}
                  onCheckedChange={(checked) =>
                    timeUsageMutation.mutate({
                      requestId: request.request_id,
                      useSickTime: false,
                      useVacationTime: checked,
                    })
                  }
                />
                <span>Use Vacation Time</span>
              </div>
            </>
          ) : (
            <p className="text-sm mt-2">
              Not applicable for non-salaried employees
            </p>
          )}
        </div>
      </div>
    );
  };

  // Update the dialog JSX
  const renderCustomApprovalDialog = () => (
    <Dialog
      open={dialogState.isOpen}
      onOpenChange={(open) => {
        if (!open) handleCloseCustomApproval();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Custom Approval</DialogTitle>
        </DialogHeader>
        <Textarea
          value={dialogState.text}
          onChange={(e) => handleCustomApprovalTextChange(e.target.value)}
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
  );

  // Update the action buttons JSX
  const renderActionButtons = (request: TimeOffRequest) => (
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
        onClick={() => handleOpenCustomApproval(request.request_id)}
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
        onClick={() => handleLeftEarlyWithTime(request.request_id)}
      >
        Leaving Early
      </Button>
      <Button
        className="w-full"
        variant="outline"
        onClick={() => markDuplicateMutation.mutateAsync(request.request_id)}
      >
        Mark As Duplicate
      </Button>
    </div>
  );

  const formatDateWithDay = (dateString: string) => {
    const date = parseISO(dateString);
    return format(date, "EEEE, MMMM d, yyyy");
  };

  const handleRequest = async (
    request_id: number,
    action: RequestAction,
    emailMessage: string,
    use_sick_time: boolean = false,
    use_vacation_time: boolean = false
  ) => {
    const request = requests.find(
      (req: TimeOffRequest) => req.request_id === request_id
    );
    if (!request) return;

    let templateName: string;
    let templateData: any;

    // Determine email template and data based on action
    switch (action) {
      case "time_off":
        templateName = "TimeOffApproved";
        templateData = {
          name: DOMPurify.sanitize(request.name),
          startDate: formatDateWithDay(request.start_date),
          endDate: formatDateWithDay(request.end_date),
          message: emailMessage,
        };
        break;
      case "deny":
        templateName = "TimeOffDenied";
        templateData = {
          name: DOMPurify.sanitize(request.name),
          startDate: formatDateWithDay(request.start_date),
          endDate: formatDateWithDay(request.end_date),
          message: emailMessage,
        };
        break;
      case "called_out":
        templateName = "CalledOut";
        templateData = {
          name: DOMPurify.sanitize(request.name),
          date: formatDateWithDay(request.start_date),
          message: emailMessage,
        };
        break;
      case "left_early":
        templateName = "LeftEarly";
        templateData = {
          name: DOMPurify.sanitize(request.name),
          date: formatDateWithDay(request.start_date),
          message: emailMessage,
        };
        break;
      case "pending":
        templateName = "StatusUpdate";
        templateData = {
          name: DOMPurify.sanitize(request.name),
          startDate: formatDateWithDay(request.start_date),
          endDate: formatDateWithDay(request.end_date),
          status: "pending",
          message: emailMessage,
        };
        break;
      default:
        if (action.startsWith("Custom: Left Early @")) {
          templateName = "LeftEarly";
          templateData = {
            name: DOMPurify.sanitize(request.name),
            date: formatDateWithDay(request.start_date),
            time: action.split("Left Early @ ")[1],
            message: emailMessage,
          };
        } else if (action.startsWith("Custom: ")) {
          templateName = "CustomStatus";
          templateData = {
            name: DOMPurify.sanitize(request.name),
            startDate: formatDateWithDay(request.start_date),
            endDate: formatDateWithDay(request.end_date),
            customMessage: DOMPurify.sanitize(action.slice(8)),
            message: emailMessage,
          };
        } else {
          throw new Error("Invalid action");
        }
    }

    const subject = action.startsWith("Custom: Left Early @")
      ? "Left Early Notification"
      : action === "deny"
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

    // Chain mutations
    return Promise.resolve()
      .then(() =>
        updateRequestMutation.mutateAsync({
          request_id,
          action,
          use_sick_time,
          use_vacation_time,
        })
      )
      .then(() =>
        sendEmailMutation.mutateAsync({
          email: request.email,
          subject,
          templateName,
          templateData,
        })
      );
  };

  const handleApprove = (request_id: number) => {
    const request = requests.find(
      (req: TimeOffRequest) => req.request_id === request_id
    );
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

  const handleDeny = (request_id: number) => {
    handleRequest(
      request_id,
      "deny",
      "Your Time Off Request Has Been Denied. Please Contact Management Directly For Details."
    );
  };

  const handleCalledOut = (request_id: number) => {
    const request = requests.find(
      (req: TimeOffRequest) => req.request_id === request_id
    );
    if (request) {
      handleRequest(
        request_id,
        "called_out",
        "Your Schedule Has Been Updated To Reflect That You Called Out.",
        request.use_sick_time,
        request.use_vacation_time
      );
    }
  };

  const handleLeftEarlyWithTime = (requestId: number) => {
    const request = requests.find(
      (req: TimeOffRequest) => req.request_id === requestId
    );
    if (request) {
      leftEarlyDialogMutation.mutate({
        isOpen: true,
        time: "",
        currentRequestId: requestId,
      });
    }
  };

  const handleCustomApproval = (request_id: number, customText: string) => {
    const request = requests.find(
      (req: TimeOffRequest) => req.request_id === request_id
    );
    if (request) {
      handleRequest(
        request_id,
        `Custom: ${DOMPurify.sanitize(customText)}` as RequestAction,
        `Your Time Off Request Has Been Approved!`,
        request.use_sick_time,
        request.use_vacation_time
      );
    }
  };

  const handleLeftEarlyTimeChange = (time: string) => {
    const currentState = queryClient.getQueryData(["leftEarlyDialog"]) as any;
    leftEarlyDialogMutation.mutate({
      ...currentState,
      time: DOMPurify.sanitize(time),
    });
  };

  const handleSubmitLeftEarly = () => {
    const dialogState = queryClient.getQueryData(["leftEarlyDialog"]) as any;
    if (dialogState?.currentRequestId && dialogState?.time) {
      handleRequest(
        dialogState.currentRequestId,
        `Custom: Left Early @ ${dialogState.time}` as RequestAction,
        `Your schedule has been updated to reflect that you left early at ${dialogState.time}.`
      );
      leftEarlyDialogMutation.mutate({
        isOpen: false,
        time: "",
        currentRequestId: null,
      });
    }
  };

  return (
    <RoleBasedWrapper allowedRoles={["admin", "ceo", "super admin", "dev"]}>
      <div className="w-full max-w-4xl mx-auto px-4 py-8 md:py-12">
        <h1 className="text-2xl font-bold mb-6">
          <TextGenerateEffect words={title} />
        </h1>
        <div className="space-y-6">
          {requests.map((request: TimeOffRequest) => (
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
                    {renderTimeUsageSwitches(request)}
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
                        onClick={() =>
                          handleOpenCustomApproval(request.request_id)
                        }
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
                        onClick={() =>
                          handleLeftEarlyWithTime(request.request_id)
                        }
                      >
                        Leaving Early
                      </Button>
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() =>
                          markDuplicateMutation.mutateAsync(request.request_id)
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

          <Dialog
            open={dialogQuery.data?.isOpen || false}
            onOpenChange={(open) => {
              if (!open) handleCloseCustomApproval();
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Custom Approval</DialogTitle>
              </DialogHeader>
              <Textarea
                value={dialogQuery.data?.text || ""}
                onChange={(e) => handleCustomApprovalTextChange(e.target.value)}
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

          <Dialog
            open={leftEarlyDialogQuery.data?.isOpen || false}
            onOpenChange={(open) => {
              if (!open) {
                leftEarlyDialogMutation.mutate({
                  isOpen: false,
                  time: "",
                  currentRequestId: null,
                });
              }
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Left Early Time</DialogTitle>
              </DialogHeader>
              <div className="flex space-x-2">
                <div className="flex-1">
                  <Label>Hour</Label>
                  <Input
                    type="text"
                    placeholder="HH"
                    maxLength={2}
                    value={leftEarlyDataQuery.data?.hour || ""}
                    onChange={(e) => {
                      const currentData = queryClient.getQueryData([
                        "leftEarlyData",
                      ]) as any;
                      queryClient.setQueryData(["leftEarlyData"], {
                        ...currentData,
                        hour: e.target.value,
                      });
                    }}
                  />
                </div>
                <div className="flex-1">
                  <Label>Minute</Label>
                  <Input
                    type="text"
                    placeholder="MM"
                    maxLength={2}
                    value={leftEarlyDataQuery.data?.minute || ""}
                    onChange={(e) => {
                      const currentData = queryClient.getQueryData([
                        "leftEarlyData",
                      ]) as any;
                      queryClient.setQueryData(["leftEarlyData"], {
                        ...currentData,
                        minute: e.target.value,
                      });
                    }}
                  />
                </div>
                <div className="flex-1">
                  <Label>AM/PM</Label>
                  <Select
                    value={leftEarlyDataQuery.data?.period || "PM"}
                    onValueChange={(value) => {
                      const currentData = queryClient.getQueryData([
                        "leftEarlyData",
                      ]) as any;
                      queryClient.setQueryData(["leftEarlyData"], {
                        ...currentData,
                        period: value,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AM">AM</SelectItem>
                      <SelectItem value="PM">PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    leftEarlyDialogMutation.mutate({
                      isOpen: false,
                      time: "",
                      currentRequestId: null,
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    const data = queryClient.getQueryData([
                      "leftEarlyData",
                    ]) as any;
                    if (data?.hour && data?.minute && data?.period) {
                      const formattedTime = `${data.hour}:${data.minute} ${data.period}`;
                      handleRequest(
                        leftEarlyDialogQuery.data?.currentRequestId!,
                        `Custom: Left Early @ ${formattedTime}` as RequestAction,
                        `Your schedule has been updated to reflect that you left early at ${formattedTime}.`
                      );
                      leftEarlyDialogMutation.mutate({
                        isOpen: false,
                        time: "",
                        currentRequestId: null,
                      });
                    }
                  }}
                >
                  Submit
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </RoleBasedWrapper>
  );
}
