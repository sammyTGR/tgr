"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { eachDayOfInterval, format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { useRole } from "@/context/RoleContext";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import { toZonedTime, format as formatTZ } from "date-fns-tz";
import { supabase } from "@/utils/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { CalendarIcon } from "@radix-ui/react-icons";

const title = "Submit Time Off Requests";

interface CalendarEvent {
  day_of_week: string;
  start_time: string;
  end_time: string;
}

interface EmployeeCalendar {
  name: string;
  events: CalendarEvent[];
}

interface TimeOffReason {
  id: number;
  reason: string;
}

interface TimeoffFormProps {
  onSubmitSuccess?: () => void;
}

type EmployeeName = string | null;
type Reason = string | null;

const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

interface TimeOffFormData {
  employee_name: string;
  reason: string;
  other_reason?: string;
  [key: string]: any; // This allows for additional properties
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export default function TimeoffForm({ onSubmitSuccess }: TimeoffFormProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: timeOffReasons = [] } = useQuery({
    queryKey: ["timeOffReasons"],
    queryFn: async () => {
      const response = await fetch("/api/time_off_reasons");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
  });

  const { data: calendarData = [], refetch: refetchCalendarData } = useQuery({
    queryKey: ["calendarData", "", ""],
    queryFn: async ({ queryKey }: any) => {
      const [_, start_date, end_date] = queryKey;
      if (!start_date || !end_date) return [];
      const response = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start_date, end_date }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    enabled: false,
  });

  const { data: selectedDates = [] } = useQuery<Date[]>({
    queryKey: ["selectedDates"],
    queryFn: () => [],
    enabled: false,
  });

  const {
    data: activeEmployees = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["activeEmployees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("name")
        .eq("status", "active")
        .order("name");

      if (error) {
        throw new Error("Failed to fetch active employees");
      }

      return data.map((employee) => employee.name);
    },
  });

  const { data: showOtherTextarea = false } = useQuery<boolean>({
    queryKey: ["showOtherTextarea"],
    queryFn: () => false,
    enabled: false,
  });

  const { data: selectedReason = "" } = useQuery<string>({
    queryKey: ["reason"],
    queryFn: () => "",
    enabled: false,
  });

  const { data: employeeName = null } = useQuery<string | null>({
    queryKey: ["employee_name"],
    queryFn: () => null,
    enabled: false,
  });

  const { data: formData } = useQuery<TimeOffFormData | null>({
    queryKey: ["formData"],
    queryFn: () => null,
    enabled: false,
  });

  const { data: showAlertDialog = false } = useQuery<boolean>({
    queryKey: ["showAlertDialog"],
    queryFn: () => false,
    enabled: false,
  });

  const { data: popoverOpen = false } = useQuery({
    queryKey: ["timeOffPopoverOpen"],
    queryFn: () => false,
    staleTime: Infinity,
  });

  const { data: date = undefined } = useQuery<Date | undefined>({
    queryKey: ["date"],
    queryFn: () => undefined,
    enabled: false,
  });

  const { data: dateRange = { from: undefined, to: undefined } } =
    useQuery<DateRange>({
      queryKey: ["timeOffDateRange"],
      queryFn: () => ({ from: undefined, to: undefined }),
      staleTime: Infinity,
    });

  const submitTimeOffMutation = useMutation({
    mutationFn: async (payload: any) => {
      // console.log("Submitting payload:", payload);

      try {
        const response = await fetch("/api/time_off", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        // Log the raw response text first
        const rawResponse = await response.text();
        // console.log("Raw server response:", rawResponse);

        // If the response is empty, throw an error
        if (!rawResponse) {
          throw new Error("Empty response from server");
        }

        try {
          const data = JSON.parse(rawResponse);

          if (!response.ok) {
            throw new Error(
              data.error || `HTTP error! status: ${response.status}`
            );
          }

          return data;
        } catch (parseError) {
          console.error("Parse error:", parseError);
          console.error("Raw response that failed to parse:", rawResponse);
          throw new Error(`Failed to parse server response: ${rawResponse}`);
        }
      } catch (error) {
        console.error("Full error:", error);
        throw error;
      }
    },
    onError: (error: Error) => {
      console.error("Time off submission error:", {
        message: error.message,
        stack: error.stack,
      });
      toast.error(`Failed to submit time off request: ${error.message}`, {
        description:
          "Please try again or contact support if the issue persists.",
      });
    },
    onSuccess: (data) => {
      // console.log("Submission successful:", data);
      toast.success("Time off request submitted successfully");
    },
  });

  const sendNotificationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/send_email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to send email");
      }
      return response.json();
    },
  });

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const date = new Date();
    date.setHours(Number(hours), Number(minutes));
    return date
      .toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      })
      .replace(" ", "");
  };

  const renderEmployeeRow = (employee: EmployeeCalendar) => {
    const eventsByDay: { [key: string]: CalendarEvent[] } = {};
    daysOfWeek.forEach((day) => {
      eventsByDay[day] = employee.events.filter(
        (event) => event.day_of_week === day
      );
    });

    return (
      <div
        key={employee.name}
        className="grid grid-cols-8 items-center divide-y divide-gray-200 dark:divide-gray-800"
      >
        <div className="py-3 px-4 font-medium">{employee.name}</div>
        {daysOfWeek.map((day) => (
          <div key={day} className="py-3 px-4">
            {eventsByDay[day].map((event, index) => {
              const [startHours, startMinutes] = event.start_time.split(":");
              const startTime = new Date();
              startTime.setHours(Number(startHours), Number(startMinutes));
              const compareTime = new Date();
              compareTime.setHours(11, 30);
              const textColor =
                startTime <= compareTime
                  ? "text-amber-500 dark:text-amber-400"
                  : "text-blue-500 dark:text-blue-400";
              return (
                <div key={index} className={textColor}>
                  {`${formatTime(event.start_time)}  ${formatTime(
                    event.end_time
                  )}`}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const handleReasonChange = (value: string) => {
    const reasonsRequiringTextarea = [
      "Other",
      "Swapping Schedules",
      "Starting Late",
      "Leaving Early",
      "Personal",
      "Vacation",
    ];
    const showOtherTextarea = reasonsRequiringTextarea.includes(value);
    queryClient.setQueryData(["showOtherTextarea"], showOtherTextarea);
    queryClient.setQueryData(["reason"], value);
  };

  const getPlaceholderText = (reason: string) => {
    switch (reason) {
      case "Swapping Schedules":
        return "Please specify who you are swapping with and the dates you are swapping (dates must be during the same week)";
      case "Starting Late":
        return "Please specify the reason for starting late and what time you will be arriving";
      case "Leaving Early":
        return "Please specify the reason for leaving early and what time you will be leaving";
      case "Personal":
        return "Please provide details for your personal time off";
      default:
        return "Please specify who is covering for the dates you are requesting off (swapped dates must be during the same week)";
    }
  };

  const handleSelectDates = (dates: Date[] | undefined) => {
    if (dates && dates.length > 0) {
      // Keep popover open while selecting dates
      queryClient.setQueryData(["selectedDates"], dates);

      // Update the date range for display
      const range = {
        from: dates[0],
        to: dates.length > 1 ? dates[dates.length - 1] : undefined,
      };
      queryClient.setQueryData(["dateRange"], range);

      // Only close popover when at least one date is selected
      if (dates.length >= 1) {
        const start_date = format(dates[0], "yyyy-MM-dd");
        const end_date = format(dates[dates.length - 1], "yyyy-MM-dd");
        queryClient.setQueryData(
          ["calendarData", start_date, end_date],
          undefined
        );
        refetchCalendarData();
      }
    } else {
      queryClient.setQueryData(["selectedDates"], []);
      queryClient.setQueryData(["dateRange"], {
        from: undefined,
        to: undefined,
      });
    }
    queryClient.setQueryData(["date"], dates?.[0]);
  };

  const sendNotificationToAdmins = async (
    timeOffData: any,
    selectedDates: Date[]
  ) => {
    try {
      // Get the earliest and latest dates from the selection
      const firstDate = new Date(
        Math.min(...selectedDates.map((date) => date.getTime()))
      );
      const lastDate = new Date(
        Math.max(...selectedDates.map((date) => date.getTime()))
      );

      // Format dates consistently using date-fns-tz
      const timeZone = "America/Los_Angeles";
      const startDate = formatTZ(
        toZonedTime(firstDate, timeZone),
        "EEEE, MMMM d, yyyy"
      );
      const endDate = formatTZ(
        toZonedTime(lastDate, timeZone),
        "EEEE, MMMM d, yyyy"
      );

      // Fetch admin emails from Supabase
      const { data: employees, error: employeesError } = await supabase
        .from("employees")
        .select("contact_info, name")
        .in("name", ["Sammy", "Russ", "Slim Jim", "Sam"]);

      if (employeesError) throw employeesError;
      if (!employees || employees.length === 0) {
        console.warn("No super admin emails found");
        return;
      }

      const recipientEmails = employees.map((emp) => emp.contact_info);

      // Send email notification
      const response = await fetch("/api/send_email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: recipientEmails,
          subject: "New Time Off Request Submitted",
          templateName: "TimeOffRequest",
          templateData: {
            employeeName: timeOffData.employee_name,
            startDate,
            endDate,
            reason: timeOffData.reason,
            other_reason: timeOffData.other_reason || "",
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send notification email");
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to send notification email:", error);
      throw error;
    }
  };

  const { data: isSubmitting = false } = useQuery({
    queryKey: ["isSubmitting"],
    queryFn: () => false,
    enabled: false,
  });

  const updateIsSubmitting = useMutation({
    mutationFn: (newValue: boolean) => Promise.resolve(newValue),
    onSuccess: (newValue) => {
      queryClient.setQueryData(["isSubmitting"], newValue);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateIsSubmitting.mutate(true);
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    const formDataObject: TimeOffFormData = Object.fromEntries(
      data.entries()
    ) as TimeOffFormData;
    queryClient.setQueryData(["formData"], formDataObject);
    queryClient.setQueryData(["showAlertDialog"], true);
  };

  const submitForm = async () => {
    if (!formData) {
      toast.error("No form data available");
      return;
    }

    const selectedDates = queryClient.getQueryData(["selectedDates"]) as Date[];

    if (selectedDates.length < 1) {
      toast.error("Please select at least one date.");
      return;
    }

    if (!formData.employee_name) {
      toast.error("Please select an employee name.");
      return;
    }

    if (!formData.reason) {
      toast.error("Please select a reason for time off.");
      return;
    }

    const timeZone = "America/Los_Angeles";
    const start_date = formatTZ(
      toZonedTime(
        new Date(Math.min(...selectedDates.map((date) => date.getTime()))),
        timeZone
      ),
      "yyyy-MM-dd"
    );
    const end_date = formatTZ(
      toZonedTime(
        new Date(Math.max(...selectedDates.map((date) => date.getTime()))),
        timeZone
      ),
      "yyyy-MM-dd"
    );

    try {
      const payload = {
        ...formData,
        start_date,
        end_date,
      };

      await submitTimeOffMutation.mutateAsync(payload);
      await sendNotificationToAdmins(payload, selectedDates);

      // Reset form and query data
      queryClient.setQueryData(["selectedDates"], []);
      queryClient.setQueryData(["showOtherTextarea"], false);
      queryClient.setQueryData(["reason"], null);
      queryClient.setQueryData(["employee_name"], null);
      queryClient.setQueryData(["formData"], null);
      queryClient.setQueryData(["showAlertDialog"], false);
      queryClient.invalidateQueries({ queryKey: ["selectedDates"] });

      // Reset the Calendar component
      const calendarElement = document.querySelector(
        ".react-calendar"
      ) as HTMLElement;
      if (calendarElement) {
        const selectedElements = calendarElement.querySelectorAll(
          '[aria-pressed="true"]'
        );
        selectedElements.forEach((el) =>
          el.setAttribute("aria-pressed", "false")
        );
      }

      toast.success("Your Request Has Been Submitted", {
        position: "bottom-right",
      });
      onSubmitSuccess?.();
    } catch (error) {
      console.error("Failed to submit time off request:", error);
      updateIsSubmitting.mutate(false);
    }
  };

  const updateShowAlertDialog = useMutation({
    mutationFn: (newValue: boolean) => Promise.resolve(newValue),
    onSuccess: (newValue) => {
      queryClient.setQueryData(["showAlertDialog"], newValue);
    },
  });

  const updateEmployeeName = useMutation({
    mutationFn: (newValue: string) => Promise.resolve(newValue),
    onSuccess: (newValue) => {
      queryClient.setQueryData(["employee_name"], newValue);
    },
  });

  const updatePopoverOpen = useMutation({
    mutationFn: (newValue: boolean) => Promise.resolve(newValue),
    onSuccess: (newValue) => {
      queryClient.setQueryData(["timeOffPopoverOpen"], newValue);
    },
  });

  const updateSelectedDates = useMutation({
    mutationFn: (dates: Date[] | undefined) => Promise.resolve(dates),
    onSuccess: (dates) => {
      queryClient.setQueryData(["selectedDates"], dates);
    },
  });

  const updateDateRange = useMutation({
    mutationFn: (range: DateRange) => Promise.resolve(range),
    onSuccess: (range) => {
      queryClient.setQueryData(["timeOffDateRange"], range);
      // Also update selectedDates for compatibility
      if (range.from && range.to) {
        const dates = eachDayOfInterval({ start: range.from, end: range.to });
        queryClient.setQueryData(["selectedDates"], dates);
      } else {
        queryClient.setQueryData(["selectedDates"], []);
      }
    },
  });

  return (
    <RoleBasedWrapper
      allowedRoles={[
        "gunsmith",
        "user",
        "auditor",
        "admin",
        "super admin",
        "dev",
      ]}
    >
      <div className="w-full max-w-lg mx-auto px-4 py-8 md:py-12">
        <Card>
          <CardHeader>
            <CardTitle>
              <TextGenerateEffect words={title} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full space-y-4">
              <form onSubmit={handleSubmit}>
                <div className="flex flex-col space-y-4 max-w-2xl">
                  <div className="grid gap-2">
                    <Label htmlFor="date">Select Dates</Label>
                    <Popover
                      modal={true}
                      open={popoverOpen}
                      onOpenChange={(open) => {
                        updatePopoverOpen.mutate(open);
                      }}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-1 h-4 w-4 -translate-x-1" />
                          {dateRange.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "LLL dd, y")} -{" "}
                                {format(dateRange.to, "LLL dd, y")}
                              </>
                            ) : (
                              format(dateRange.from, "LLL dd, y")
                            )
                          ) : (
                            "Pick a date range"
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={dateRange?.from}
                          selected={{
                            from: dateRange?.from,
                            to: dateRange?.to || dateRange?.from,
                          }}
                          onSelect={(range) => {
                            updateDateRange.mutate({
                              from: range?.from,
                              to: range?.to || range?.from,
                            });
                            if (range?.from && range?.to) {
                              const start_date = format(
                                range.from,
                                "yyyy-MM-dd"
                              );
                              const end_date = format(range.to, "yyyy-MM-dd");
                              queryClient.setQueryData(
                                ["calendarData", start_date, end_date],
                                undefined
                              );
                              refetchCalendarData();
                            }
                          }}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Select
                    name="employee_name"
                    value={employeeName || ""}
                    onValueChange={(value) => updateEmployeeName.mutate(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Employee Name" />
                    </SelectTrigger>
                    <SelectContent>
                      <Input
                        placeholder="Search Employee Name..."
                        onChange={(e) => {
                          // Implement search functionality here
                        }}
                        className="w-full px-3 py-2"
                      />
                      {isLoading ? (
                        <SelectItem value="loading"></SelectItem>
                      ) : error ? (
                        <SelectItem value="error">
                          Error loading employees
                        </SelectItem>
                      ) : (
                        activeEmployees.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>

                  <Select
                    name="reason"
                    value={selectedReason || ""}
                    onValueChange={handleReasonChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOffReasons.map((reason: TimeOffReason) => (
                        <SelectItem key={reason.id} value={reason.reason}>
                          {reason.reason}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {showOtherTextarea && (
                    <Textarea
                      name="other_reason"
                      placeholder={getPlaceholderText(selectedReason || "")}
                      className="textarea"
                    />
                  )}

                  <Button
                    type="submit"
                    variant="gooeyRight"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Request"}
                  </Button>
                </div>
              </form>

              <AlertDialog
                open={showAlertDialog}
                onOpenChange={(open) => {
                  if (!open) {
                    updateIsSubmitting.mutate(false);
                  }
                  updateShowAlertDialog.mutate(open);
                }}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Important Notice</AlertDialogTitle>
                    <AlertDialogDescription>
                      <span className="text-red-500 mb-4">
                        <ul>
                          Submitting A Request Does NOT Mean It Will Be
                          Approved!
                        </ul>
                      </span>
                      <ul className="mt-4">
                        You Are REQUIRED To Find Someone Trained In Your Duties
                        To Cover For You Before A Request Can Be Approved.
                      </ul>
                      <ul className="mt-4">
                        <span className="text-red-500 font-bold mt-4">
                          If you DO NOT have someone to cover for you listed
                          below, your request will be denied.
                        </span>
                      </ul>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel
                      onClick={() => {
                        updateShowAlertDialog.mutate(false);
                        updateIsSubmitting.mutate(false);
                        onSubmitSuccess?.();
                      }}
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        updateIsSubmitting.mutate(true);
                        await submitForm();
                        onSubmitSuccess?.();
                      }}
                    >
                      Submit Request
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleBasedWrapper>
  );
}
