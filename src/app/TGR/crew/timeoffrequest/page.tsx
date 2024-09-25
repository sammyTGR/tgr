"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
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

const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function TimeOffRequestPage() {
  const [calendarData, setCalendarData] = useState<EmployeeCalendar[]>([]);
  const [employeeNames, setEmployeeNames] = useState<string[]>([]);
  const [timeOffReasons, setTimeOffReasons] = useState<TimeOffReason[]>([]);
  const [timeOffData, setTimeOffData] = useState({
    employee_name: "",
    reason: "",
    other_reason: "",
  });
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [showOtherTextarea, setShowOtherTextarea] = useState(false);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    fetchEmployeeNames();
    fetchTimeOffReasons();
  }, []);

  useEffect(() => {
    if (selectedDates.length > 0) {
      const start_date = format(selectedDates[0], "yyyy-MM-dd");
      const end_date = format(selectedDates[selectedDates.length - 1], "yyyy-MM-dd");
      fetchCalendarData(start_date, end_date);
    }
  }, [selectedDates]);

  const fetchCalendarData = async (start_date: string, end_date: string) => {
    try {
      const response = await fetch("/api/calendar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ start_date, end_date }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCalendarData(data);
    } catch (error: any) {
      console.error("Failed to fetch calendar data:", error.message);
      toast.error("Failed to fetch calendar data. Please try again.");
    }
  };

  const fetchEmployeeNames = async () => {
    try {
      const response = await fetch("/api/employees");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setEmployeeNames(data);
    } catch (error: any) {
      console.error("Failed to fetch employee names:", error.message);
      toast.error("Failed to fetch employee names. Please refresh the page.");
    }
  };

  const fetchTimeOffReasons = async () => {
    try {
      // console.log("Fetching time off reasons...");
      const response = await fetch("/api/time_off_reasons");
      // console.log("Response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      const data = await response.json();
      // console.log("Fetched time off reasons:", data);
      setTimeOffReasons(data);
    } catch (error: any) {
      console.error("Failed to fetch time off reasons:", error.message);
      toast.error("Failed to fetch time off reasons. Please refresh the page.");
    }
  };

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
    setTimeOffData({ ...timeOffData, reason: value });
    const reasonsRequiringTextarea = [
      "Other",
      "Swapping Schedules",
      "Starting Late",
      "Leaving Early",
      "Personal",
      "Vacation",
    ];
    setShowOtherTextarea(reasonsRequiringTextarea.includes(value));
  };
  const getPlaceholderText = (reason: string) => {
    switch (reason) {
      case "Swapping Schedules":
        return "Please specify who you are swapping with and the dates you are swapping (dates must be during the same week)";
      case "Starting Late":
        return "Please specify the reason for starting late";
      case "Leaving Early":
        return "Please specify the reason for leaving early";
      case "Personal":
        return "Please provide details for your personal time off";
      default:
        return "Please specify who is covering for the dates you are requesting off (swapped dates must be during the same week)";
    }
  };

  const handleSelectDates = (dates: Date[] | undefined) => {
    setSelectedDates(dates || []);
  };

  async function sendNotificationToAdmins(
    timeOffData: any,
    selectedDates: Date[]
  ) {
    const startDate = format(selectedDates[0], "yyyy-MM-dd");
    const endDate = format(
      selectedDates[selectedDates.length - 1],
      "yyyy-MM-dd"
    );

    try {
      // Fetch super admin emails
      const { data: employees, error: employeesError } = await supabase
        .from("employees")
        .select("contact_info, name")
        .in("name", ["Sammy"]);

      if (employeesError) throw employeesError;

      const recipientEmails = employees.map((emp) => emp.contact_info);

      if (recipientEmails.length === 0) {
        console.warn("No super admin emails found");
        return;
      }

      const response = await fetch("/api/send_email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: recipientEmails,
          subject: "New Time Off Request Submitted",
          templateName: "TimeOffRequest",
          templateData: {
            employeeName: timeOffData.employee_name,
            startDate,
            endDate,
            reason: timeOffData.reason,
            other_reason: timeOffData.other_reason,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send email");
      }

      // console.log("Notification email sent to super admins");
    } catch (error) {
      console.error("Failed to send notification email:", error);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDates.length < 1) {
      toast.error("Please select at least one date.");
      return;
    }

    const timeZone = "America/Los_Angeles";
    const start_date = formatTZ(
      toZonedTime(new Date(Math.min(...selectedDates.map(date => date.getTime()))), timeZone),
      "yyyy-MM-dd"
    );
    const end_date = formatTZ(
      toZonedTime(new Date(Math.max(...selectedDates.map(date => date.getTime()))), timeZone),
      "yyyy-MM-dd"
    );

    const payload = {
      ...timeOffData,
      start_date,
      end_date,
    };

    try {
      const response = await fetch("/api/time_off", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server response:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      
      // Refresh calendar data after submission
      fetchCalendarData(start_date, end_date);
      
      // Reset form
      setTimeOffData({
        employee_name: "",
        reason: "",
        other_reason: "",
      });
      setSelectedDates([]);
      setShowOtherTextarea(false);
      
      // Show success toast
      toast.success("Your Request Has Been Submitted", {
        position: "bottom-right",
        action: {
          label: "Noice!",
          onClick: () => {},
        },
      });
      
      await sendNotificationToAdmins(payload, selectedDates);
    } catch (error: any) {
      console.error("Failed to submit time off request:", error.message);
      toast.error("Failed to submit time off request. Please try again.");
    }
  };

  return (
    <RoleBasedWrapper
      allowedRoles={["gunsmith", "user", "auditor", "admin", "super admin"]}
    >
      <div className="w-full max-w-lg mx-auto px-4 py-8 md:py-12">
        <h1 className="text-2xl font-bold mb-4">
          <TextGenerateEffect words={title} />
        </h1>
        <div className="w-full space-y-4">
          <form onSubmit={handleSubmit} className="mt-8">
            <div className="flex flex-col space-y-4 max-w-2xl">
              <div className="flex flex-col border border-gray-200 dark:border-gray-800 rounded-lg max-w-lg mx-auto">
                <Calendar
                  mode="multiple"
                  selected={selectedDates}
                  onSelect={handleSelectDates}
                />
              </div>
              <label className="text-lg font-medium flex justify-center text-center">
                Select Dates By Clicking On All Dates You&apos;ll Be Out
              </label>
              <Select
                value={timeOffData.employee_name}
                onValueChange={(value) =>
                  setTimeOffData({ ...timeOffData, employee_name: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Employee Name" />
                </SelectTrigger>
                <SelectContent>
                  <Input
                    placeholder="Search Employee Name..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="w-full px-3 py-2"
                  />
                  {employeeNames
                    .filter((name) =>
                      name.toLowerCase().includes(searchText.toLowerCase())
                    )
                    .map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <Select
                value={timeOffData.reason}
                onValueChange={handleReasonChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Reason" />
                </SelectTrigger>
                <SelectContent>
                  {timeOffReasons.map((reason) => (
                    <SelectItem key={reason.id} value={reason.reason}>
                      {reason.reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {showOtherTextarea && (
                <Textarea
                  placeholder={getPlaceholderText(timeOffData.reason)}
                  value={timeOffData.other_reason}
                  onChange={(e) =>
                    setTimeOffData({
                      ...timeOffData,
                      other_reason: e.target.value,
                    })
                  }
                  className="textarea"
                />
              )}

              <Button type="submit" variant="gooeyRight">
                Submit Request
              </Button>
            </div>
          </form>
        </div>
      </div>
    </RoleBasedWrapper>
  );
}
