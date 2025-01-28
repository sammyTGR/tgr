// TGR\crew\profile\[employeeId]\page.tsx
"use client";
import { Suspense, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/utils/supabase/client";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import SchedulesComponent from "@/components/SchedulesComponent";
import { CalendarIcon } from "lucide-react";
import { CustomCalendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogOverlay,
  DialogClose,
} from "@radix-ui/react-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import SuggestionForm from "@/components/SuggestionForm";
import {
  format,
  startOfWeek,
  endOfWeek,
  subWeeks,
  startOfDay,
  endOfDay,
  addDays,
  isSunday,
  previousSunday,
  nextSaturday,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { toZonedTime, format as formatTZ } from "date-fns-tz";
import { toast } from "sonner";
import TimeOffRequestComponent from "@/components/TimeOffRequestComponent";
import { Textarea } from "@/components/ui/textarea";
import { ClockIcon } from "@radix-ui/react-icons";
import { DataTable } from "../../../../admin/audits/contest/data-table";
import { Input } from "@/components/ui/input";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import PointsForm from "@/components/PointsForm";
import PointsComponent from "../../points/page";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import styles from "./profiles.module.css";
import classNames from "classnames";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import { CustomCalendarMulti } from "@/components/ui/calendar";
import { Progress } from "@/components/ui/progress";
import { ProgressBar } from "@/components/ProgressBar";
import { Separator } from "@radix-ui/react-dropdown-menu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DOMPurify from "dompurify";
import { useFlags } from "flagsmith/react";

const schedulestitle = "Scheduling";
const performancetitle = "Individual Performance";
const formtitle = "Your Forms";

// Types and interfaces
interface TimeOffReason {
  id: number;
  reason: string;
}

interface Audit {
  dros_number: string;
  salesreps: string;
  audit_type: string;
  trans_date: string;
  audit_date: string;
  error_location: string;
  error_details: string;
  error_notes: string;
  dros_cancel: string;
}

type EmployeeProfileData = {
  name: string;
  last_name: string;
  phone_number: string;
  street_address: string;
  city: string;
  state: string;
  zip: string;
};

interface Review {
  id: number;
  employee_id: number;
  review_quarter: string;
  review_year: number;
  overview_performance: string;
  achievements_contributions: string[];
  attendance_reliability: string[];
  quality_work: string[];
  communication_collaboration: string[];
  strengths_accomplishments: string[];
  areas_growth: string[];
  recognition: string[];
  created_by: string;
  created_at: string;
}

interface PointsCalculation {
  category: string;
  error_location: string;
  points_deducted: number;
}

interface Shift {
  id: number;
  employee_id: number;
  employee_name: string;
  start_time: string;
  end_time?: string;
  total_hours?: string;
}

type TimeOffFormData = {
  selectedDates: Date[];
  reason: string;
  otherReason?: string;
};

type ReviewDialogState = {
  isOpen: boolean;
  reviewId: string | null;
};

const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;

const schema = z.object({
  employee: z.string().nonempty({ message: "Employee name is required" }),
  dros_status: z.string().nonempty({ message: "DROS status is required" }),
  dros_number: z.string().min(2, { message: "DROS Number is required" }),
  invoice_number: z.string().min(2, { message: "Invoice Number is required" }),
  serial_number: z.string().min(2, { message: "Serial Number is required" }),
  start_trans: z
    .string()
    .nonempty({ message: "Start Transaction status is required" }),
  details: z.string().optional(),
  selectedDates: z.array(z.date()).optional(),
});

type FormData = z.infer<typeof schema>;

const EmployeeProfilePage = () => {
  const flags = useFlags(["is_timecard_enabled"]);
  const params = useParams();
  const employeeIdParam = params?.employeeId ?? "";
  const employeeId = Array.isArray(employeeIdParam)
    ? parseInt(employeeIdParam[0], 10)
    : parseInt(employeeIdParam, 10);
  const userUuid = params?.userUuid ?? "";
  const queryClient = useQueryClient();
  const router = useRouter();

  // Queries

  const { data: employee } = useQuery({
    queryKey: ["employee", employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*, contact_info")
        .eq("employee_id", employeeId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: availableTimeOff } = useQuery({
    queryKey: ["availableTimeOff", employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_off_requests")
        .select("sick_time_year, use_sick_time")
        .eq("employee_id", employeeId);

      if (error) throw error;

      const usedSickTime = data.reduce((acc: number, request: any) => {
        if (request.use_sick_time) {
          acc +=
            (new Date(request.end_date).getTime() -
              new Date(request.start_date).getTime()) /
              (1000 * 60 * 60 * 24) +
            1;
        }
        return acc;
      }, 0);

      return 40 - usedSickTime;
    },
  });

  const { data: availableSickTime } = useQuery({
    queryKey: ["availableSickTime", employeeId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        "calculate_available_sick_time",
        {
          p_emp_id: employeeId,
        }
      );

      if (error) throw error;
      return data;
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ["reviews", employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_quarterly_reviews")
        .select("*")
        .eq("employee_id", employeeId)
        .eq("published", true)
        .order("created_at", { ascending: false }); // Add ordering to show newest first

      if (error) {
        console.error("Error fetching reviews:", error);
        throw error;
      }

      if (!data) return [];
      return data as Review[];
    },
    enabled: !!employeeId, // Only run query when employeeId is available
  });

  const { data: weeklySummary } = useQuery({
    queryKey: ["weeklySummary", employeeId],
    queryFn: async () => {
      const startOfWeekDate = startOfWeek(new Date(), { weekStartsOn: 0 });
      const endOfWeekDate = endOfWeek(new Date(), { weekStartsOn: 0 });

      const { data, error } = await supabase
        .from("employee_clock_events")
        .select("*")
        .eq("employee_id", employeeId)
        .gte("event_date", format(startOfWeekDate, "yyyy-MM-dd"))
        .lte("event_date", format(endOfWeekDate, "yyyy-MM-dd"));

      if (error) throw error;

      const totalHours = data.reduce((acc, shift) => {
        if (shift.total_hours) {
          const [hours, minutes, seconds] = shift.total_hours
            .split(":")
            .map(Number);
          const duration = hours + minutes / 60 + seconds / 3600;
          return acc + duration;
        }
        return acc;
      }, 0);

      return totalHours > 100 ? 0 : totalHours.toFixed(2);
    },
    staleTime: Infinity,
  });

  const { data: payPeriodSummary } = useQuery({
    queryKey: ["payPeriodSummary", employeeId],
    queryFn: async () => {
      const timeZone = "America/Los_Angeles";
      const now = toZonedTime(new Date(), timeZone);
      const lastKnownPayPeriodStart = new Date(2023, 9, 22);

      let currentPeriodStart = startOfDay(lastKnownPayPeriodStart);
      while (currentPeriodStart <= now) {
        currentPeriodStart = addDays(currentPeriodStart, 14);
      }
      currentPeriodStart = addDays(currentPeriodStart, -14);

      const currentPeriodEnd = endOfDay(addDays(currentPeriodStart, 13));

      const startDate = formatTZ(currentPeriodStart, "yyyy-MM-dd", {
        timeZone,
      });
      const endDate = formatTZ(currentPeriodEnd, "yyyy-MM-dd", { timeZone });

      const { data, error } = await supabase
        .from("employee_clock_events")
        .select("*")
        .eq("employee_id", employeeId)
        .gte("event_date", startDate)
        .lte("event_date", endDate);

      if (error) throw error;

      let totalHours = data.reduce((acc, shift) => {
        if (shift.total_hours) {
          const [hours, minutes, seconds] = shift.total_hours
            .split(":")
            .map(Number);
          const duration = hours + minutes / 60 + seconds / 3600;
          return acc + duration;
        }
        return acc;
      }, 0);

      totalHours = totalHours > 336 ? 0 : totalHours;

      return {
        hours: totalHours.toFixed(2),
        payPeriodDates: {
          start: formatTZ(currentPeriodStart, "MMM d", { timeZone }),
          end: formatTZ(currentPeriodEnd, "MMM d", { timeZone }),
        },
      };
    },
    staleTime: Infinity,
  });

  const { data: currentShift } = useQuery({
    queryKey: ["currentShift", employeeId],
    queryFn: async () => {
      const eventDate = format(new Date(), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("employee_clock_events")
        .select("*")
        .eq("employee_id", employeeId)
        .eq("event_date", eventDate)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    staleTime: 1000, // Add a small stale time to prevent excessive refetching
  });

  const updateTimeOffForm = useMutation({
    mutationFn: (newData: Partial<FormData>) => {
      return Promise.resolve({ ...timeOffFormQuery.data, ...newData });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["timeOffForm"], data);
    },
  });

  const timeOffFormQuery = useQuery({
    queryKey: ["timeOffForm"],
    queryFn: () => ({
      selectedDates: [],
      reason: "",
      otherReason: "",
    }),
  });

  const { control, handleSubmit } = useForm<TimeOffFormData>({
    defaultValues: {
      selectedDates: [],
      reason: "",
      otherReason: "",
    },
  });

  const {
    control: timeOffControl,
    handleSubmit: handleSubmitTimeOff,
    reset: timeOffReset,
  } = useForm<TimeOffFormData>({
    defaultValues: {
      selectedDates: [],
      reason: "",
      otherReason: "",
    },
  });

  // For the employee profile form
  const { register: profileRegister, handleSubmit: handleSubmitProfile } =
    useForm<EmployeeProfileData>();

  const { data: timeOffReasons } = useQuery({
    queryKey: ["timeOffReasons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_off_reasons")
        .select("*");

      if (error) throw error;
      return data as TimeOffReason[];
    },
  });

  const { data: audits } = useQuery({
    queryKey: ["audits", employee?.lanid],
    queryFn: async () => {
      if (!employee?.lanid) return [];
      const { data, error } = await supabase
        .from("Auditsinput")
        .select("*")
        .eq("salesreps", employee.lanid)
        .order("audit_date", { ascending: false });

      if (error) throw error;
      return data as Audit[];
    },
    enabled: !!employee?.lanid,
  });

  // Update the unacknowledged bulletins query
  const { data: unacknowledgedBulletins } = useQuery({
    queryKey: ["unacknowledgedBulletins", employeeId],
    queryFn: async () => {
      // console.log(
      //   "Checking unacknowledged bulletins for employee:",
      //   employeeId
      // );

      // First get all bulletins that require acknowledgment
      const { data: bulletins, error: bulletinsError } = await supabase
        .from("bulletin_posts")
        .select("*")
        .eq("requires_acknowledgment", true);

      if (bulletinsError) {
        console.error("Error fetching bulletins:", bulletinsError);
        throw bulletinsError;
      }

      // console.log("Bulletins requiring acknowledgment:", bulletins);

      if (!bulletins || bulletins.length === 0) return [];

      // Then get all acknowledgments for this employee
      const { data: acknowledgments, error: acksError } = await supabase
        .from("bulletin_acknowledgments")
        .select("post_id") // Changed from bulletin_id to post_id
        .eq("employee_id", employeeId);

      if (acksError) {
        console.error("Error fetching acknowledgments:", acksError);
        throw acksError;
      }

      // console.log("Employee acknowledgments:", acknowledgments);

      // Create a set of acknowledged bulletin IDs
      const acknowledgedIds = new Set(
        acknowledgments?.map((ack) => ack.post_id)
      );

      // Filter out bulletins that have been acknowledged
      const unacknowledged = bulletins.filter(
        (bulletin) => !acknowledgedIds.has(bulletin.id)
      );

      // console.log("Unacknowledged bulletins:", unacknowledged);

      return unacknowledged;
    },
    staleTime: 0,
  });

  // Mutations
  const clockInMutation = useMutation({
    mutationFn: async () => {
      const timeZone = "America/Los_Angeles";
      const now = toZonedTime(new Date(), timeZone);
      const eventDate = formatTZ(now, "yyyy-MM-dd", { timeZone });
      const startTime = formatTZ(now, "HH:mm:ss", { timeZone });

      // Check for existing clock-in
      const { data: existingClockIn } = await supabase
        .from("employee_clock_events")
        .select("*")
        .eq("employee_id", employeeId)
        .eq("event_date", eventDate)
        .maybeSingle();

      if (existingClockIn?.start_time) {
        throw new Error("Already clocked in for today");
      }

      // Create new clock-in record
      const { data: clockInData, error: clockInError } = await supabase
        .from("employee_clock_events")
        .upsert({
          employee_id: employeeId,
          employee_name: employee?.name,
          event_date: eventDate,
          start_time: startTime,
        })
        .select()
        .single();

      if (clockInError) throw clockInError;
      return clockInData;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["currentShift", employeeId], data);
      toast.success(`Welcome Back ${employee?.name}!`);
      if (data.start_time) {
        scheduleOvertimeAlert(
          new Date(data.start_time),
          employeeId,
          employee?.name || "",
          employee?.contact_info || ""
        );
      }
    },
    onError: (error: Error) => {
      if (error.message === "Already clocked in for today") {
        toast.error("You have already clocked in for today.");
      } else {
        console.error("Clock in error:", error);
        toast.error("Failed to clock in. Please try again.");
      }
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: async () => {
      const timeZone = "America/Los_Angeles";
      const now = toZonedTime(new Date(), timeZone);
      const endTime = formatTZ(now, "HH:mm:ss", { timeZone });
      const eventDate = formatTZ(now, "yyyy-MM-dd", { timeZone });

      if (!currentShift) {
        throw new Error("No active shift found");
      }

      let duration = calculateDurationWithLunch(
        currentShift.start_time,
        endTime,
        currentShift.lunch_start,
        currentShift.lunch_end
      );

      if (duration === "00:00:00") {
        throw new Error("Invalid duration calculated");
      }

      const { error } = await supabase
        .from("employee_clock_events")
        .update({
          end_time: endTime,
          total_hours: duration,
        })
        .eq("employee_id", employeeId)
        .eq("event_date", eventDate);

      if (error) throw error;

      return { ...currentShift, end_time: endTime, total_hours: duration };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["currentShift", employeeId], data);
      toast.success(`Thank You For Your Hard Work Today ${employee?.name}!`);
    },
    onError: (error) => {
      toast.error("Failed to clock out. Please try again.");
    },
  });

  const startLunchBreakMutation = useMutation({
    mutationFn: async () => {
      const timeZone = "America/Los_Angeles";
      const now = toZonedTime(new Date(), timeZone);
      const lunchStart = formatTZ(now, "HH:mm:ss", { timeZone });

      if (!currentShift) {
        throw new Error("No active shift found");
      }

      const { error } = await supabase
        .from("employee_clock_events")
        .update({
          lunch_start: lunchStart,
        })
        .eq("id", currentShift.id);

      if (error) throw error;

      return { ...currentShift, lunch_start: lunchStart };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["currentShift", employeeId], data);
      toast.success(`Enjoy Your Lunch ${employee?.name}!`);
    },
    onError: (error) => {
      toast.error("Failed to start lunch break. Please try again.");
    },
  });

  const endLunchBreakMutation = useMutation({
    mutationFn: async () => {
      const timeZone = "America/Los_Angeles";
      const now = toZonedTime(new Date(), timeZone);
      const lunchEnd = formatTZ(now, "HH:mm:ss", { timeZone });
      const eventDate = formatTZ(now, "yyyy-MM-dd", { timeZone });

      // First fetch the current shift
      const { data: currentShift, error: fetchError } = await supabase
        .from("employee_clock_events")
        .select("*")
        .eq("employee_id", employeeId)
        .eq("event_date", eventDate)
        .single();

      if (fetchError) throw fetchError;
      if (!currentShift) throw new Error("No active shift found");

      // Check if 30 minutes have passed since lunch start
      if (currentShift.lunch_start) {
        const lunchStartTime = new Date(
          `1970-01-01T${currentShift.lunch_start}`
        );
        const currentTime = new Date(`1970-01-01T${lunchEnd}`);
        const timeDiff =
          (currentTime.getTime() - lunchStartTime.getTime()) / 1000 / 60;

        if (timeDiff < 29) {
          const remainingMinutes = Math.ceil(29 - timeDiff);

          // Store the lock timestamp
          await supabase
            .from("employee_clock_events")
            .update({
              lunch_lock: new Date(
                Date.now() + remainingMinutes * 60 * 1000
              ).toISOString(),
            })
            .eq("id", currentShift.id);

          throw new Error(
            `Please wait ${remainingMinutes} more minutes before clocking back in from lunch.`
          );
        }

        // Check if there's an active lunch lock
        if (currentShift.lunch_lock) {
          const lockTime = new Date(currentShift.lunch_lock);
          if (lockTime > new Date()) {
            const remainingMinutes = Math.ceil(
              (lockTime.getTime() - Date.now()) / (60 * 1000)
            );
            throw new Error(
              `Please wait ${remainingMinutes} more minutes before clocking back in from lunch.`
            );
          }
        }
      }

      // If all validations pass, update with lunch end time
      const { data, error } = await supabase
        .from("employee_clock_events")
        .update({
          lunch_end: lunchEnd,
          lunch_lock: null, // Clear the lock when successfully clocking back in
        })
        .eq("id", currentShift.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["currentShift", employeeId], data);
      toast.success("Let's Get Dis Bread!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const timeOffRequestMutation = useMutation({
    mutationFn: async ({
      selectedDates,
      reason,
      otherReason,
    }: {
      selectedDates: Date[];
      reason: string;
      otherReason: string;
    }) => {
      if (selectedDates.length < 1) {
        throw new Error("Please select at least one date.");
      }

      const timeZone = "America/Los_Angeles";
      const startDate = toZonedTime(
        new Date(Math.min(...selectedDates.map((date) => date.getTime()))),
        timeZone
      );
      const endDate = toZonedTime(
        new Date(Math.max(...selectedDates.map((date) => date.getTime()))),
        timeZone
      );

      const start_date = formatTZ(startDate, "yyyy-MM-dd", { timeZone });
      const end_date = formatTZ(endDate, "yyyy-MM-dd", { timeZone });

      const payload = {
        start_date,
        end_date,
        reason,
        other_reason: otherReason,
        employee_id: employeeId,
        name: employee?.name,
        email: employee?.contact_info,
        sick_time_year: new Date().getFullYear(),
      };

      const { data, error } = await supabase
        .from("time_off_requests")
        .insert([payload]);

      if (error) throw error;

      return payload;
    },
    onSuccess: async (data, variables) => {
      toast.success("Time off request submitted successfully!");
      await sendNotificationToAdmins(data, variables.selectedDates);
      queryClient.invalidateQueries({
        queryKey: ["availableTimeOff", employeeId],
      });
    },
    onError: (error) => {
      toast.error("Failed to submit time off request.");
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: EmployeeProfileData) => {
      const { error } = await supabase
        .from("employees")
        .update(data)
        .eq("user_uuid", employee?.user_uuid);

      if (error) throw error;

      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["employee", employeeId], (oldData: any) => ({
        ...oldData,
        ...data,
      }));
      toast.success("Profile updated successfully!");
    },
    onError: (error) => {
      toast.error("Failed to update profile. Please try again.");
    },
  });

  // Helper functions
  const calculateDurationWithLunch = (
    start: string,
    end: string,
    lunchStart: string | null,
    lunchEnd: string | null
  ): string => {
    let startTime = new Date(`1970-01-01T${start}Z`).getTime();
    let endTime = new Date(`1970-01-01T${end}Z`).getTime();

    if (endTime < startTime) {
      endTime += 24 * 60 * 60 * 1000;
    }

    let totalDuration = endTime - startTime;

    if (lunchStart && lunchEnd) {
      const lunchStartTime = new Date(`1970-01-01T${lunchStart}Z`).getTime();
      const lunchEndTime = new Date(`1970-01-01T${lunchEnd}Z`).getTime();
      const lunchDuration = lunchEndTime - lunchStartTime;
      totalDuration -= lunchDuration;
    }

    if (totalDuration < 0 || totalDuration > 24 * 60 * 60 * 1000) {
      console.error("Invalid duration calculated:", totalDuration);
      return "00:00:00";
    }

    const totalSeconds = Math.floor(totalDuration / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const scheduleOvertimeAlert = (
    clockInTime: Date,
    employeeId: number,
    employeeName: string,
    employeeEmail: string
  ) => {
    const alertTime = new Date(clockInTime.getTime() + 9 * 60 * 60 * 1000);
    const now = new Date();
    const timeUntilAlert = alertTime.getTime() - now.getTime();

    if (timeUntilAlert > 0) {
      setTimeout(async () => {
        const hasClockedOut = await checkIfClockedOut(employeeId.toString());
        if (!hasClockedOut) {
          Promise.all([
            sendOvertimeAlert(
              employeeName,
              employeeEmail,
              formatTZ(clockInTime, "h:mm a", {
                timeZone: "America/Los_Angeles",
              }),
              formatTZ(new Date(), "h:mm a", {
                timeZone: "America/Los_Angeles",
              }),
              "EmployeeOvertimeAlert"
            ),
            sendOvertimeAlertToAdmins(
              employeeId.toString(),
              employeeName,
              formatTZ(clockInTime, "h:mm a", {
                timeZone: "America/Los_Angeles",
              }),
              formatTZ(new Date(), "h:mm a", {
                timeZone: "America/Los_Angeles",
              })
            ),
          ]).catch((error) => {
            console.error("Failed to send overtime alerts:", error);
          });
        } else {
          // console.log("Employee has already clocked out. No alert needed.");
        }
      }, timeUntilAlert);
    }
  };

  const checkIfClockedOut = async (employeeId: string): Promise<boolean> => {
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("employee_clock_events")
      .select("end_time")
      .eq("employee_id", employeeId)
      .eq("event_date", today)
      .single();

    if (error) {
      console.error("Error checking clock-out status:", error);
      return false;
    }

    return !!data?.end_time;
  };

  const sendOvertimeAlert = async (
    employeeName: string,
    recipientEmail: string | string[],
    clockInTime: string,
    currentTime: string,
    templateName: string
  ) => {
    try {
      const response = await fetch("/api/send_email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: recipientEmail,
          subject: "Overtime Alert",
          templateName: templateName,
          templateData: {
            employeeName,
            clockInTime,
            currentTime,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send overtime alert email");
      }

      // console.log(
      //   `Overtime alert sent to ${
      //     Array.isArray(recipientEmail)
      //       ? recipientEmail.join(", ")
      //       : recipientEmail
      //   }`
      // );
    } catch (error) {
      console.error("Error sending overtime alert:", error);
    }
  };

  const sendOvertimeAlertToAdmins = async (
    employeeId: string,
    employeeName: string,
    clockInTime: string,
    currentTime: string
  ) => {
    try {
      const hasClockedOut = await checkIfClockedOut(employeeId);

      if (hasClockedOut) {
        // console.log("Employee has already clocked out. No alert needed.");
        return;
      }

      const { data: admins, error } = await supabase
        .from("employees")
        .select("contact_info, name")
        .in("name", ["Sammy", "Russ", "Slim Jim"]);

      if (error) throw error;

      const adminEmails = admins.map((admin) => admin.contact_info);

      if (adminEmails.length > 0) {
        await sendOvertimeAlert(
          employeeName,
          adminEmails,
          clockInTime,
          currentTime,
          "AdminOvertimeAlert"
        );
      }
    } catch (error) {
      console.error("Failed to send overtime alert to admins:", error);
    }
  };

  const sendNotificationToAdmins = async (
    timeOffData: any,
    selectedDates: Date[]
  ) => {
    try {
      // Get admin emails from Supabase
      const { data: admins, error: employeesError } = await supabase
        .from("employees")
        .select("contact_info, name")
        .in("name", ["Sammy", "Russ", "Slim Jim"]);

      if (employeesError) throw employeesError;

      if (!admins || admins.length === 0) {
        console.warn("No admin emails found");
        return;
      }

      const adminEmails = admins.map((admin) => admin.contact_info);

      // Format dates consistently
      const timeZone = "America/Los_Angeles";
      const startDate = formatTZ(
        toZonedTime(selectedDates[0], timeZone),
        "EEEE, MMMM d, yyyy",
        { timeZone }
      );
      const endDate = formatTZ(
        toZonedTime(selectedDates[selectedDates.length - 1], timeZone),
        "EEEE, MMMM d, yyyy",
        { timeZone }
      );

      // Send email using the API route
      const response = await fetch("/api/send_email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: adminEmails,
          subject: "New Time Off Request Submitted",
          templateName: "TimeOffRequest",
          templateData: {
            employeeName: timeOffData.name,
            startDate,
            endDate,
            reason: timeOffData.reason,
            other_reason: timeOffData.other_reason || "",
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send notification email");
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to send notification email:", error);
      throw error;
    }
  };

  // For the time off request form
  const onSubmitTimeOff = async (data: TimeOffFormData) => {
    try {
      if (!data.selectedDates || data.selectedDates.length === 0) {
        toast.error("Please select at least one date");
        return;
      }

      if (!data.reason) {
        toast.error("Please select a reason for your time off request");
        return;
      }

      // If reason requires additional explanation but none provided
      if (
        (data.reason === "Swapping Schedules" || data.reason === "Other") &&
        !data.otherReason
      ) {
        toast.error("Please provide additional details for your request");
        return;
      }

      // Submit time off request
      await timeOffRequestMutation.mutateAsync({
        selectedDates: data.selectedDates,
        reason: data.reason,
        otherReason: data.otherReason || "",
      });

      // Reset form after successful submission using the correct reset method
      timeOffReset({
        selectedDates: [],
        reason: "",
        otherReason: "",
      });

      toast.success("Time off request submitted successfully!");
    } catch (error) {
      console.error("Error submitting time off request:", error);
      toast.error("Failed to submit time off request. Please try again.");
    }
  };

  const onSubmitProfile = (data: EmployeeProfileData) => {
    updateProfileMutation.mutate(data);
  };

  // Query for dialog state
  const { data: dialogState } = useQuery<ReviewDialogState>({
    queryKey: ["reviewDialog"],
    queryFn: () => ({ isOpen: false, reviewId: null }),
    initialData: { isOpen: false, reviewId: null },
  });

  // Query for selected review
  const { data: selectedReview } = useQuery({
    queryKey: ["selectedReview", dialogState?.reviewId],
    queryFn: async () => {
      if (!dialogState?.reviewId) return null;
      return (
        reviews?.find((r) => r.id === Number(dialogState.reviewId)) || null
      );
    },
    enabled: !!dialogState?.reviewId,
  });

  const handleClockInAndBulletin = async () => {
    try {
      const timeZone = "America/Los_Angeles";
      const now = toZonedTime(new Date(), timeZone);
      const eventDate = formatTZ(now, "yyyy-MM-dd", { timeZone });
      const startTime = formatTZ(now, "HH:mm:ss", { timeZone });

      // Create the clock-in record first
      const { data: clockInData, error: clockInError } = await supabase
        .from("employee_clock_events")
        .insert({
          employee_id: employeeId,
          employee_name: employee?.name,
          event_date: eventDate,
          start_time: startTime,
        })
        .select()
        .single();

      if (clockInError) throw clockInError;

      // Update the UI with the new clock-in data
      queryClient.setQueryData(["currentShift", employeeId], clockInData);
      toast.success(
        `You're clocked in ${employee?.name}, getting you to the bulletins...`
      );
      // Schedule overtime alert if needed
      scheduleOvertimeAlert(
        new Date(clockInData.start_time),
        employeeId,
        clockInData.event_date,
        clockInData.start_time
      );

      // Redirect to bulletin page
      router.push("/TGR/crew/bulletin");
    } catch (error) {
      toast.error("Failed to clock in. Please try again.");
    }
  };

  if (employee === undefined)
    return <ProgressBar value={100} showAnimation={true} />;

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
      <div className="section w-full">
        <Card className="flex flex-col h-full max-w-6xl mx-auto my-12">
          <header className="bg-gray-100 dark:bg-muted px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <Avatar>
                <img
                  src={
                    employee?.avatar_url ||
                    "https://utfs.io/f/9jzftpblGSv7nvddLr3ZYIXtyiAHqxfuS6V9231FedsGbMWh"
                  }
                  alt="Employee Avatar"
                />
                <AvatarFallback>{employee?.name?.[0] || "?"}</AvatarFallback>
              </Avatar>

              <div>
                <h1 className="text-xl font-bold">
                  Welcome {DOMPurify.sanitize(employee?.name || "")}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {DOMPurify.sanitize(employee?.position || "")}
                </p>
              </div>
            </div>
          </header>
          <Tabs defaultValue="clock" className="w-full">
            <TabsList className="border-b border-gray-200 dark:border-gray-700">
              {flags.is_timecard_enabled.enabled && (
                <TabsTrigger value="clock">Timesheet</TabsTrigger>
              )}
              <TabsTrigger value="schedules">Scheduling</TabsTrigger>
              <TabsTrigger value="performance">Sales & Audits</TabsTrigger>
              <TabsTrigger value="forms">Forms</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              {(employee?.role === "super admin" ||
                employee?.role === "dev") && (
                <TabsTrigger value="profile">Manage Profile</TabsTrigger>
              )}
            </TabsList>
            <ScrollArea className="h-[calc(100vh-300px)]">
              <main
                className={classNames(
                  "grid flex-1 items-start mx-auto my-4 mb-4 max-w-8xl gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 body relative",
                  styles.noScroll
                )}
              >
                <Suspense
                  fallback={<ProgressBar value={100} showAnimation={true} />}
                >
                  {/* Clock tab content */}
                  {flags.is_timecard_enabled.enabled && (
                    <TabsContent value="clock">
                      <h1 className="text-xl font-bold mb-2 ml-2">
                        <TextGenerateEffect words="Time Clock" />
                      </h1>
                      <div className="grid p-2 gap-4 md:grid-cols-3 lg:grid-cols-3">
                        {/* Time Card */}
                        <Card className="mt-4">
                          <CardHeader className="flex justify-between items-center">
                            <CardTitle className="text-2xl font-bold">
                              Time Card
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="mx-auto">
                            {!currentShift?.start_time && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button className="w-full mx-auto">
                                    Clock In
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    {unacknowledgedBulletins &&
                                    unacknowledgedBulletins.length > 0 ? (
                                      <>
                                        <AlertDialogTitle>
                                          Unacknowledged Bulletins
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          You have{" "}
                                          {unacknowledgedBulletins.length}{" "}
                                          bulletin
                                          {unacknowledgedBulletins.length === 1
                                            ? ""
                                            : "s"}{" "}
                                          that require
                                          {unacknowledgedBulletins.length === 1
                                            ? "s"
                                            : ""}{" "}
                                          your acknowledgment. Please review and
                                          acknowledge them.
                                        </AlertDialogDescription>
                                      </>
                                    ) : (
                                      <>
                                        <AlertDialogTitle>
                                          Clock In Confirmation
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you ready to start your shift?
                                        </AlertDialogDescription>
                                      </>
                                    )}
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    {unacknowledgedBulletins &&
                                    unacknowledgedBulletins.length > 0 ? (
                                      <AlertDialogAction
                                        onClick={handleClockInAndBulletin}
                                      >
                                        Clock In & View Bulletin
                                      </AlertDialogAction>
                                    ) : (
                                      <AlertDialogAction
                                        onClick={() => clockInMutation.mutate()}
                                      >
                                        Clock In
                                      </AlertDialogAction>
                                    )}
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                            {currentShift?.start_time &&
                              !currentShift?.end_time && (
                                <>
                                  {!currentShift.lunch_start && (
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="outline"
                                          className="w-full mx-auto"
                                        >
                                          Clock Out
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent>
                                        <div className="flex w-full justify-center space-x-2">
                                          <Button
                                            variant="outline"
                                            onClick={() =>
                                              startLunchBreakMutation.mutate()
                                            }
                                          >
                                            Lunch Break
                                          </Button>
                                          <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                              <Button variant="ghost">
                                                End Shift
                                              </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                              <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                  End Shift Confirmation
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                  Are you sure you want to end
                                                  your shift for the day? Only a
                                                  manager can correct your
                                                  timesheet to fix this.
                                                </AlertDialogDescription>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                <AlertDialogCancel>
                                                  Cancel
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                  onClick={() =>
                                                    clockOutMutation.mutate()
                                                  }
                                                >
                                                  Confirm End Shift
                                                </AlertDialogAction>
                                              </AlertDialogFooter>
                                            </AlertDialogContent>
                                          </AlertDialog>
                                        </div>
                                      </PopoverContent>
                                    </Popover>
                                  )}
                                  {currentShift.lunch_start &&
                                    !currentShift.lunch_end && (
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button
                                            variant="outline"
                                            className="w-full mx-auto"
                                          >
                                            Clock Back In From Lunch
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                          <DialogDescription>
                                            <p className="mb-4">
                                              You must take at least a 30-minute
                                              lunch break.
                                            </p>
                                            <Button
                                              variant="gooeyLeft"
                                              className="w-full mx-auto mt-4"
                                              onClick={() =>
                                                endLunchBreakMutation.mutate()
                                              }
                                            >
                                              Confirm Clocking Back In
                                            </Button>
                                          </DialogDescription>
                                        </DialogContent>
                                      </Dialog>
                                    )}
                                  {currentShift.lunch_start &&
                                    currentShift.lunch_end && (
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            variant="outline"
                                            className="w-full mx-auto"
                                          >
                                            End Shift
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>
                                              End Shift Confirmation
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Are you sure you want to end your
                                              shift for the day? Only a manager
                                              can correct your timesheet to fix
                                              this.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>
                                              Cancel
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() =>
                                                clockOutMutation.mutate()
                                              }
                                            >
                                              Confirm End Shift
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    )}
                                </>
                              )}
                          </CardContent>
                        </Card>
                      </div>

                      <div className="grid p-2 gap-4 md:grid-cols-3 lg:grid-cols-3">
                        {/* Start of Shift */}
                        <Card className="mt-4">
                          <CardHeader className="flex justify-between items-center">
                            <CardTitle className="text-2xl font-bold">
                              Start Of Shift
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="mx-auto">
                            {currentShift?.start_time ? (
                              <div className="text-left">
                                <div className="text-lg font-bold">
                                  {formatTZ(
                                    toZonedTime(
                                      new Date(
                                        `${currentShift.event_date}T${currentShift.start_time}`
                                      ),
                                      "America/Los_Angeles"
                                    ),
                                    "EEEE",
                                    { timeZone: "America/Los_Angeles" }
                                  )}
                                </div>
                                <div>
                                  {formatTZ(
                                    toZonedTime(
                                      new Date(
                                        `${currentShift.event_date}T${currentShift.start_time}`
                                      ),
                                      "America/Los_Angeles"
                                    ),
                                    "MMM d - h:mm a",
                                    { timeZone: "America/Los_Angeles" }
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div>Not clocked in</div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Lunch Break Calculation Card*/}
                        <Card className="mt-4">
                          <CardHeader className="flex justify-between items-center">
                            <CardTitle className="text-2xl font-bold">
                              Lunch Break
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="mx-auto">
                            {currentShift ? (
                              currentShift.lunch_start &&
                              currentShift.lunch_end ? (
                                <div>{`Your Lunch Break Was From ${formatTZ(
                                  toZonedTime(
                                    new Date(
                                      `1970-01-01T${currentShift.lunch_start}`
                                    ),
                                    "America/Los_Angeles"
                                  ),
                                  "h:mm a",
                                  { timeZone: "America/Los_Angeles" }
                                )} to ${formatTZ(
                                  toZonedTime(
                                    new Date(
                                      `1970-01-01T${currentShift.lunch_end}`
                                    ),
                                    "America/Los_Angeles"
                                  ),
                                  "h:mm a",
                                  { timeZone: "America/Los_Angeles" }
                                )}`}</div>
                              ) : currentShift.lunch_start ? (
                                <div>{`You Clocked Out For Lunch At ${formatTZ(
                                  toZonedTime(
                                    new Date(
                                      `1970-01-01T${currentShift.lunch_start}`
                                    ),
                                    "America/Los_Angeles"
                                  ),
                                  "h:mm a",
                                  { timeZone: "America/Los_Angeles" }
                                )}`}</div>
                              ) : (
                                <div>{`Please Start Your Lunch Break By ${formatTZ(
                                  toZonedTime(
                                    new Date(
                                      new Date(
                                        `${currentShift.event_date}T${currentShift.start_time}`
                                      ).getTime() +
                                        5 * 60 * 60 * 1000
                                    ),
                                    "America/Los_Angeles"
                                  ),
                                  "h:mm a",
                                  { timeZone: "America/Los_Angeles" }
                                )}`}</div>
                              )
                            ) : (
                              <div>No active shift</div>
                            )}
                          </CardContent>
                        </Card>

                        {/* End of Shift */}
                        <Card className="mt-4">
                          <CardHeader className="flex justify-between items-center">
                            <CardTitle className="text-2xl font-bold">
                              End Of Shift
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="mx-auto">
                            {currentShift?.start_time &&
                            !currentShift?.end_time ? (
                              <div>
                                {(() => {
                                  const startTime = new Date(
                                    `1970-01-01T${currentShift.start_time}`
                                  );
                                  const endTime = new Date(
                                    startTime.getTime() + 8.5 * 60 * 60 * 1000
                                  ); // 8.5 hours in milliseconds
                                  const formattedEndTime = format(
                                    endTime,
                                    "h:mm a"
                                  );
                                  return `Still on shift until no later than ${formattedEndTime}`;
                                })()}
                              </div>
                            ) : currentShift?.end_time ? (
                              <div>Shift Complete</div>
                            ) : (
                              <div>Not clocked in</div>
                            )}
                          </CardContent>
                        </Card>
                      </div>

                      <div className="grid p-2 gap-4 md:grid-cols-3 lg:grid-cols-3">
                        {/* Daily Summary Card*/}
                        <Card className="mt-4">
                          <CardHeader className="flex justify-between items-center">
                            <CardTitle className="text-2xl font-bold">
                              Daily Summary
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="mx-auto">
                            {currentShift ? (
                              <div>
                                {`You've logged ${calculateDurationWithLunch(
                                  currentShift.start_time,
                                  currentShift.end_time ||
                                    format(new Date(), "HH:mm:ss"),
                                  currentShift.lunch_start,
                                  currentShift.lunch_end
                                )} hours today!`}
                              </div>
                            ) : (
                              <div>No shift data available</div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Weekly Summary Card*/}
                        <Card className="mt-4">
                          <CardHeader className="flex justify-between items-center">
                            <CardTitle className="text-2xl font-bold">
                              Weekly Summary
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="mx-auto">
                            {weeklySummary !== null ? (
                              <div>{weeklySummary} hours</div>
                            ) : (
                              <div>No data</div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Pay Period Card*/}
                        <Card className="mt-4">
                          <CardHeader className="flex justify-between items-center">
                            <CardTitle className="text-2xl font-bold">
                              Pay Period
                              <div className="text-sm text-gray-500">
                                {payPeriodSummary?.payPeriodDates.start} -{" "}
                                {payPeriodSummary?.payPeriodDates.end}
                              </div>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="mx-auto">
                            {payPeriodSummary ? (
                              <div>
                                <div>{payPeriodSummary?.hours} hours</div>
                              </div>
                            ) : (
                              <div>No data</div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                  )}

                  {/* Schedules tab content */}
                  <TabsContent value="schedules">
                    <h1 className="text-xl font-bold mb-2 ml-2">
                      <TextGenerateEffect words={schedulestitle} />
                    </h1>
                    <div className="grid p-2 gap-4 md:grid-cols-2 lg:grid-cols-2">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-2xl font-bold">
                            Request Time Off
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Controller
                            name="selectedDates"
                            control={control}
                            render={({ field }) => (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="w-full pl-3 text-center font-normal"
                                  >
                                    {field.value && field.value.length > 0 ? (
                                      <>
                                        {format(
                                          new Date(
                                            Math.min(
                                              ...field.value.map((date: Date) =>
                                                date.getTime()
                                              )
                                            )
                                          ),
                                          "M/dd"
                                        )}{" "}
                                        -{" "}
                                        {format(
                                          new Date(
                                            Math.max(
                                              ...field.value.map((date: Date) =>
                                                date.getTime()
                                              )
                                            )
                                          ),
                                          "M/dd"
                                        )}
                                      </>
                                    ) : (
                                      <span>Pick dates</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-auto p-0"
                                  align="start"
                                >
                                  <CustomCalendarMulti
                                    selectedDates={field.value}
                                    onDatesChange={(dates) => {
                                      field.onChange(dates);
                                    }}
                                    disabledDays={() => false}
                                  />
                                </PopoverContent>
                              </Popover>
                            )}
                          />
                          <div className="mt-4">
                            <Controller
                              name="reason"
                              control={control}
                              render={({ field }) => (
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Reason" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {timeOffReasons?.map(
                                      (reason: TimeOffReason) => (
                                        <SelectItem
                                          key={reason.id}
                                          value={reason.reason}
                                        >
                                          {reason.reason}
                                        </SelectItem>
                                      )
                                    )}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </div>
                          <Controller
                            name="otherReason"
                            control={control}
                            render={({ field }) => (
                              <Textarea
                                className="mt-4"
                                {...field}
                                placeholder={
                                  field.value === "Swapping Schedules"
                                    ? "Please specify who you are swapping with and the dates you are swapping (dates must be during the same week)"
                                    : "Please specify who is covering for the dates you are requesting off (swapped dates must be during the same week)"
                                }
                              />
                            )}
                          />
                          <Button
                            onClick={handleSubmit(onSubmitTimeOff)}
                            variant="linkHover1"
                            className="mt-4"
                          >
                            Submit Request
                          </Button>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-2xl font-bold">
                            Available Sick Time
                          </CardTitle>
                          <ClockIcon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-medium mt-6">
                            {availableSickTime !== null
                              ? `${availableSickTime} hours`
                              : "Loading..."}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    <Card>
                      <CardHeader></CardHeader>
                      <CardContent>
                        <SchedulesComponent employeeId={employeeId} />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Performance tab content */}
                  <TabsContent value="performance">
                    <h1 className="text-xl font-bold mb-2 ml-2">
                      <TextGenerateEffect words={performancetitle} />
                    </h1>
                    <div className="grid p-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                      {/* ... (Performance cards) ... */}
                    </div>

                    <Card>
                      <CardContent>
                        <table className="w-full">
                          <thead>
                            <tr>
                              <th className="py-2 w-36 text-left">DROS #</th>
                              <th className="py-2 w-32 text-left">
                                Trans Date
                              </th>
                              <th className="py-2 w-32 text-left">Location</th>
                              <th className="py-2 w-48 text-left">Details</th>
                              <th className="py-2 w-64 text-left">Notes</th>
                              <th className="py-2 w-12 text-left">
                                Cancelled?
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {audits?.map((audit, index) => (
                              <tr key={index} className="border-t">
                                <td className="py-2 w-36">
                                  {DOMPurify.sanitize(audit.dros_number)}
                                </td>
                                <td className="py-2 w-30">
                                  {DOMPurify.sanitize(audit.trans_date)}
                                </td>
                                <td className="py-2 w-32">
                                  {DOMPurify.sanitize(audit.error_location)}
                                </td>
                                <td className="py-2 w-48">
                                  {DOMPurify.sanitize(audit.error_details)}
                                </td>
                                <td className="py-2 w-64">
                                  {DOMPurify.sanitize(audit.error_notes)}
                                </td>
                                <td className="py-2 w-12">
                                  {DOMPurify.sanitize(audit.dros_cancel)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Forms tab content */}
                  <TabsContent value="forms">
                    <h1 className="text-xl font-bold mb-2 ml-2">
                      <TextGenerateEffect words={formtitle} />
                    </h1>
                    <div className="grid p-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                      <Card className="mt-4">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-2xl font-bold">
                            Submit Points
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full text-left font-normal"
                              >
                                Submit Points Form
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-2"
                              align="start"
                            >
                              <PointsForm />
                            </PopoverContent>
                          </Popover>
                        </CardContent>
                      </Card>

                      <Card className="mt-4">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-2xl font-bold">
                            Submit A Suggestion
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full text-left font-normal"
                              >
                                Submit Suggestion Form
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-2"
                              align="start"
                            >
                              <SuggestionForm
                                employeeName={DOMPurify.sanitize(
                                  employee?.name || ""
                                )}
                                employeeContactInfo={DOMPurify.sanitize(
                                  employee?.contact_info || ""
                                )}
                              />
                            </PopoverContent>
                          </Popover>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Review tab content */}
                  <TabsContent value="reviews">
                    <h1 className="text-xl font-bold mb-2 ml-2">
                      <TextGenerateEffect words="Your Reviews" />
                    </h1>
                    <div className="grid p-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                      {reviews?.length === 0 ? (
                        <Card className="mt-4 col-span-full">
                          <CardContent className="p-4 text-center text-muted-foreground">
                            No reviews available yet.
                          </CardContent>
                        </Card>
                      ) : (
                        reviews?.map((review) => (
                          <Card key={review.id} className="mt-4">
                            <CardHeader className="flex flex-col items-start justify-between space-y-2 pb-2">
                              <CardTitle className="text-2xl font-bold">
                                {DOMPurify.sanitize(review.review_quarter)}{" "}
                                {review.review_year}
                              </CardTitle>
                              <CardDescription className="text-xs text-gray-500 dark:text-gray-400">
                                - {DOMPurify.sanitize(review.created_by)} on{" "}
                                {new Date(
                                  review.created_at
                                ).toLocaleDateString()}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="p-4">
                              <Button
                                variant="outline"
                                className="w-full text-left font-normal"
                                onClick={() => {
                                  queryClient.setQueryData(["reviewDialog"], {
                                    isOpen: true,
                                    reviewId: review.id,
                                  });
                                }}
                              >
                                View Review
                              </Button>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>

                    {/* Review Dialog */}
                    <Dialog
                      open={dialogState?.isOpen}
                      onOpenChange={(open) => {
                        queryClient.setQueryData(["reviewDialog"], {
                          isOpen: open,
                          reviewId: open ? dialogState?.reviewId : null,
                        });
                      }}
                    >
                      <DialogOverlay className="fixed inset-0 z-50" />
                      <DialogContent className="fixed inset-0 flex items-center justify-center mb-4 bg-muted dark:bg-muted z-50 view-review-dialog">
                        <div className="bg-white dark:bg-black p-6 rounded-lg shadow-lg max-w-3xl w-full space-y-4 overflow-y-auto max-h-screen">
                          {selectedReview && (
                            <>
                              <DialogTitle className="font-size: 1.35rem font-bold">
                                Employee Review
                              </DialogTitle>
                              <DialogDescription>
                                <div className="grid gap-1.5 mb-2">
                                  <Label className="text-md font-bold">
                                    Review
                                  </Label>
                                  <p>{selectedReview.review_quarter}</p>
                                </div>

                                <div className="grid gap-1.5 mb-2">
                                  <Label className="text-md font-bold">
                                    Year
                                  </Label>
                                  <p>{selectedReview.review_year}</p>
                                </div>

                                <div className="grid gap-1.5 mb-2">
                                  <Label className="text-md font-bold">
                                    Overview of Performance
                                  </Label>
                                  <p>{selectedReview.overview_performance}</p>
                                </div>

                                <div className="grid gap-1.5 mb-2">
                                  <Label className="text-md font-bold">
                                    Achievements and Contributions
                                  </Label>
                                  <ul className="list-disc pl-5">
                                    {selectedReview.achievements_contributions.map(
                                      (achievement, index) => (
                                        <li key={index}>{achievement}</li>
                                      )
                                    )}
                                  </ul>
                                </div>

                                <div className="grid gap-1.5 mb-2">
                                  <Label className="text-md font-bold">
                                    Attendance and Reliability
                                  </Label>
                                  <ul className="list-disc pl-5">
                                    {selectedReview.attendance_reliability.map(
                                      (attendance, index) => (
                                        <li key={index}>{attendance}</li>
                                      )
                                    )}
                                  </ul>
                                </div>

                                <div className="grid gap-1.5 mb-2">
                                  <Label className="text-md font-bold">
                                    Quality of Work
                                  </Label>
                                  <ul className="list-disc pl-5">
                                    {selectedReview.quality_work.map(
                                      (quality, index) => (
                                        <li key={index}>{quality}</li>
                                      )
                                    )}
                                  </ul>
                                </div>

                                <div className="grid gap-1.5 mb-2">
                                  <Label className="text-md font-bold">
                                    Communication & Collaboration
                                  </Label>
                                  <ul className="list-disc pl-5">
                                    {selectedReview.communication_collaboration.map(
                                      (communication, index) => (
                                        <li key={index}>{communication}</li>
                                      )
                                    )}
                                  </ul>
                                </div>

                                <div className="grid gap-1.5 mb-2">
                                  <Label className="text-md font-bold">
                                    Strengths & Accomplishments
                                  </Label>
                                  <ul className="list-disc pl-5">
                                    {selectedReview.strengths_accomplishments.map(
                                      (strength, index) => (
                                        <li key={index}>{strength}</li>
                                      )
                                    )}
                                  </ul>
                                </div>

                                <div className="grid gap-1.5 mb-2">
                                  <Label className="text-md font-bold">
                                    Areas for Growth and Development
                                  </Label>
                                  <ul className="list-disc pl-5">
                                    {selectedReview.areas_growth.map(
                                      (area, index) => (
                                        <li key={index}>{area}</li>
                                      )
                                    )}
                                  </ul>
                                </div>

                                <div className="grid gap-1.5 mb-2">
                                  <Label className="text-md font-bold">
                                    Recognition
                                  </Label>
                                  <ul className="list-disc pl-5">
                                    {selectedReview.recognition.map(
                                      (rec, index) => (
                                        <li key={index}>{rec}</li>
                                      )
                                    )}
                                  </ul>
                                </div>

                                <div className="flex justify-end mt-2 space-x-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      queryClient.setQueryData(
                                        ["reviewDialog"],
                                        {
                                          isOpen: false,
                                          reviewId: null,
                                        }
                                      );
                                    }}
                                  >
                                    Close
                                  </Button>
                                </div>
                              </DialogDescription>
                            </>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TabsContent>

                  {/* Manage Profile */}
                  {(employee?.role === "super admin" ||
                    employee?.role === "dev") && (
                    <TabsContent value="profile">
                      <div className="grid p-2 gap-2 md:grid-cols-1 lg:grid-cols-1">
                        <Card className="mt-4">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-2xl font-bold">
                              Manage Your Profile
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4">
                            <form
                              onSubmit={handleSubmitProfile(onSubmitProfile)}
                            >
                              <div className="p-4 rounded-b-lg space-y-6">
                                {[
                                  { label: "First Name", id: "name" },
                                  { label: "Last Name", id: "last_name" },
                                  { label: "Phone Number", id: "phone_number" },
                                  {
                                    label: "Street Address",
                                    id: "street_address",
                                  },
                                  { label: "City", id: "city" },
                                  { label: "State", id: "state" },
                                  { label: "ZIP Code", id: "zip" },
                                ].map((field) => (
                                  <div key={field.id} className="grid gap-2">
                                    <div className="flex items-center justify-between">
                                      <div className="w-full">
                                        <Label htmlFor={field.id}>
                                          {field.label}
                                        </Label>
                                        <Input
                                          id={field.id}
                                          {...profileRegister(
                                            field.id as keyof EmployeeProfileData
                                          )}
                                          className="block w-full mt-1 p-2 border rounded"
                                        />
                                      </div>
                                    </div>
                                    <Separator />
                                  </div>
                                ))}
                                <div className="flex justify-end">
                                  <Button variant="linkHover1" type="submit">
                                    Save Changes
                                  </Button>
                                </div>
                              </div>
                            </form>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                  )}
                </Suspense>
              </main>
              <ScrollBar orientation="vertical" />
            </ScrollArea>
          </Tabs>
        </Card>
      </div>
    </RoleBasedWrapper>
  );
};

// Additional utility functions

const useEmployeeProfile = (employeeId: number, userUuid: string) => {
  const queryClient = useQueryClient();

  const employeeQuery = useQuery({
    queryKey: ["employee", employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*, contact_info")
        .eq("employee_id", employeeId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: EmployeeProfileData) => {
      const { error } = await supabase
        .from("employees")
        .update(data)
        .eq("user_uuid", employeeQuery.data?.user_uuid);

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["employee", employeeId], (oldData: any) => ({
        ...oldData,
        ...data,
      }));
      toast.success("Profile updated successfully!");
    },
    onError: (error) => {
      toast.error("Failed to update profile. Please try again.");
    },
  });

  return {
    employee: employeeQuery.data,
    isLoading: employeeQuery.isLoading,
    error: employeeQuery.error,
    updateProfile: updateProfileMutation.mutate,
  };
};

const useTimeOffRequests = (employeeId: number) => {
  const queryClient = useQueryClient();

  const timeOffRequestMutation = useMutation({
    mutationFn: async ({
      selectedDates,
      reason,
      otherReason,
    }: {
      selectedDates: Date[];
      reason: string;
      otherReason: string;
    }) => {
      if (selectedDates.length < 1) {
        throw new Error("Please select at least one date.");
      }

      const timeZone = "America/Los_Angeles";
      const startDate = toZonedTime(
        new Date(Math.min(...selectedDates.map((date) => date.getTime()))),
        timeZone
      );
      const endDate = toZonedTime(
        new Date(Math.max(...selectedDates.map((date) => date.getTime()))),
        timeZone
      );

      const start_date = formatTZ(startDate, "yyyy-MM-dd", { timeZone });
      const end_date = formatTZ(endDate, "yyyy-MM-dd", { timeZone });

      const payload = {
        start_date,
        end_date,
        reason,
        other_reason: otherReason,
        employee_id: employeeId,
        sick_time_year: new Date().getFullYear(),
      };

      const { data, error } = await supabase
        .from("time_off_requests")
        .insert([payload]);

      if (error) throw error;

      return payload;
    },
    onSuccess: async (data, variables) => {
      toast.success("Time off request submitted successfully!");
      await sendNotificationToAdmins(data, variables.selectedDates);
      queryClient.invalidateQueries({
        queryKey: ["availableTimeOff", employeeId],
      });
    },
    onError: (error) => {
      toast.error("Failed to submit time off request.");
    },
  });

  return {
    submitTimeOffRequest: timeOffRequestMutation.mutate,
  };
};

const useClockEvents = (employeeId: number) => {
  const queryClient = useQueryClient();

  const clockInMutation = useMutation({
    mutationFn: async () => {
      const timeZone = "America/Los_Angeles";
      const now = toZonedTime(new Date(), timeZone);
      const eventDate = formatTZ(now, "yyyy-MM-dd", { timeZone });
      const startTime = formatTZ(now, "HH:mm:ss", { timeZone });

      const { data: existingData, error: fetchError } = await supabase
        .from("employee_clock_events")
        .select("*")
        .eq("employee_id", employeeId)
        .eq("event_date", eventDate)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      if (existingData) {
        if (existingData.start_time) {
          throw new Error("Already clocked in for today.");
        }

        const { error: updateError } = await supabase
          .from("employee_clock_events")
          .update({
            start_time: startTime,
          })
          .eq("id", existingData.id);

        if (updateError) throw updateError;
        return { ...existingData, start_time: startTime };
      } else {
        const { data: insertData, error: insertError } = await supabase
          .from("employee_clock_events")
          .insert({
            employee_id: employeeId,
            event_date: eventDate,
            start_time: startTime,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        return insertData;
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["currentShift", employeeId], data);
      toast.success(`Clocked in successfully!`);
      scheduleOvertimeAlert(
        new Date(data.start_time),
        employeeId,
        data.employee_name,
        data.employee_email
      );
    },
    onError: (error) => {
      toast.error("Failed to clock in. Please try again.");
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: async () => {
      const timeZone = "America/Los_Angeles";
      const now = toZonedTime(new Date(), timeZone);
      const endTime = formatTZ(now, "HH:mm:ss", { timeZone });
      const eventDate = formatTZ(now, "yyyy-MM-dd", { timeZone });

      const { data: currentShift, error: fetchError } = await supabase
        .from("employee_clock_events")
        .select("*")
        .eq("employee_id", employeeId)
        .eq("event_date", eventDate)
        .single();

      if (fetchError) throw fetchError;

      if (!currentShift) {
        throw new Error("No active shift found");
      }

      let duration = calculateDurationWithLunch(
        currentShift.start_time,
        endTime,
        currentShift.lunch_start,
        currentShift.lunch_end
      );

      if (duration === "00:00:00") {
        throw new Error("Invalid duration calculated");
      }

      const { error } = await supabase
        .from("employee_clock_events")
        .update({
          end_time: endTime,
          total_hours: duration,
        })
        .eq("id", currentShift.id);

      if (error) throw error;

      return { ...currentShift, end_time: endTime, total_hours: duration };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["currentShift", employeeId], data);
      queryClient.invalidateQueries({
        queryKey: ["weeklySummary", employeeId],
      });
      queryClient.invalidateQueries({
        queryKey: ["payPeriodSummary", employeeId],
      });
      toast.success(`Clocked out successfully!`);
    },
    onError: (error) => {
      toast.error("Failed to clock out. Please try again.");
    },
  });

  return {
    clockIn: clockInMutation.mutate,
    clockOut: clockOutMutation.mutate,
    startLunchBreak: useMutation({
      mutationFn: async () => {
        const timeZone = "America/Los_Angeles";
        const now = toZonedTime(new Date(), timeZone);
        const lunchStart = formatTZ(now, "HH:mm:ss", { timeZone });
        const eventDate = formatTZ(now, "yyyy-MM-dd", { timeZone });

        const { data: currentShift, error: fetchError } = await supabase
          .from("employee_clock_events")
          .select("*")
          .eq("employee_id", employeeId)
          .eq("event_date", eventDate)
          .single();

        if (fetchError) throw fetchError;

        if (!currentShift) {
          throw new Error("No active shift found");
        }

        const { error } = await supabase
          .from("employee_clock_events")
          .update({
            lunch_start: lunchStart,
          })
          .eq("id", currentShift.id);

        if (error) throw error;

        return { ...currentShift, lunch_start: lunchStart };
      },
      onSuccess: (data) => {
        queryClient.setQueryData(["currentShift", employeeId], data);
        toast.success(`Lunch break started successfully!`);
      },
      onError: (error) => {
        toast.error("Failed to start lunch break. Please try again.");
      },
    }).mutate,
    endLunchBreak: useMutation({
      mutationFn: async () => {
        const timeZone = "America/Los_Angeles";
        const now = toZonedTime(new Date(), timeZone);
        const lunchEnd = formatTZ(now, "HH:mm:ss", { timeZone });
        const eventDate = formatTZ(now, "yyyy-MM-dd", { timeZone });

        // First fetch the current shift
        const { data: currentShift, error: fetchError } = await supabase
          .from("employee_clock_events")
          .select("*")
          .eq("employee_id", employeeId)
          .eq("event_date", eventDate)
          .single();

        if (fetchError) throw fetchError;

        if (!currentShift) {
          throw new Error("No active shift found");
        }

        // Check if 30 minutes have passed since lunch start
        if (currentShift.lunch_start) {
          const lunchStartTime = new Date(
            `1970-01-01T${currentShift.lunch_start}`
          );
          const currentTime = new Date(`1970-01-01T${lunchEnd}`);
          const timeDiff =
            (currentTime.getTime() - lunchStartTime.getTime()) / 1000 / 60;

          if (timeDiff < 30) {
            throw new Error(
              `Please wait ${Math.ceil(
                30 - timeDiff
              )} more minutes before clocking back in from lunch.`
            );
          }
        }

        // Then update with lunch end time
        const { data, error } = await supabase
          .from("employee_clock_events")
          .update({
            lunch_end: lunchEnd,
          })
          .eq("id", currentShift.id)
          .select()
          .single();

        if (error) throw error;

        return data;
      },
      onSuccess: (data) => {
        queryClient.setQueryData(["currentShift", employeeId], data);
        toast.success("Let's Get Dis Bread!");
      },
      onError: (error: Error) => {
        toast.error(error.message);
      },
    }).mutate,
  };
};

const usePerformanceData = (employeeId: number, lanid: string) => {
  const auditsQuery = useQuery({
    queryKey: ["audits", lanid],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("Auditsinput")
        .select("*")
        .eq("salesreps", lanid)
        .order("audit_date", { ascending: false });

      if (error) throw error;
      return data as Audit[];
    },
    enabled: !!lanid,
  });

  const salesDataQuery = useQuery({
    queryKey: ["salesData", lanid],
    queryFn: async () => {
      const startDate = format(startOfMonth(new Date()), "yyyy-MM-dd");
      const endDate = format(endOfMonth(new Date()), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("sales_data")
        .select("*")
        .eq("Lanid", lanid)
        .gte("Date", startDate)
        .lte("Date", endDate)
        .not("subcategory_label", "is", null)
        .not("subcategory_label", "eq", "");

      if (error) throw error;
      return data;
    },
    enabled: !!lanid,
  });

  const calculatePerformanceSummary = (
    salesData: any[],
    auditData: Audit[]
  ) => {
    const totalDros = salesData.length;
    let pointsDeducted = 0;

    salesData.forEach((sale) => {
      if (sale.dros_cancel === "Yes") {
        pointsDeducted += 5;
      }
    });

    auditData.forEach((audit) => {
      const auditDate = new Date(audit.audit_date);
      if (auditDate <= new Date()) {
        // Define pointsCalculation within the component or fetch it from a data source
        const pointsCalculation = [
          { error_location: "some_error", points_deducted: 2 },
          { error_location: "dros_cancel_field", points_deducted: 5 },
          // Add more error types and their corresponding point deductions
        ];

        pointsCalculation.forEach((point) => {
          if (audit.error_location === point.error_location) {
            pointsDeducted += point.points_deducted;
          } else if (
            point.error_location === "dros_cancel_field" &&
            audit.dros_cancel === "Yes"
          ) {
            pointsDeducted += point.points_deducted;
          }
        });
      }
    });

    const totalPoints = 300 - pointsDeducted;

    return {
      totalDros,
      pointsDeducted,
      totalPoints,
    };
  };

  return {
    audits: auditsQuery.data,
    salesData: salesDataQuery.data,
    performanceSummary: useMemo(() => {
      if (auditsQuery.data && salesDataQuery.data) {
        return calculatePerformanceSummary(
          salesDataQuery.data,
          auditsQuery.data
        );
      }
      return null;
    }, [auditsQuery.data, salesDataQuery.data]),
    isLoading: auditsQuery.isLoading || salesDataQuery.isLoading,
    error: auditsQuery.error || salesDataQuery.error,
  };
};

const scheduleOvertimeAlert = (
  clockInTime: Date,
  employeeId: number,
  employeeName: string,
  employeeEmail: string
) => {
  const alertTime = new Date(clockInTime.getTime() + 9 * 60 * 60 * 1000);
  const now = new Date();
  const timeUntilAlert = alertTime.getTime() - now.getTime();

  if (timeUntilAlert > 0) {
    setTimeout(async () => {
      const hasClockedOut = await checkIfClockedOut(employeeId.toString());
      if (!hasClockedOut) {
        Promise.all([
          sendOvertimeAlert(
            employeeName,
            employeeEmail,
            formatTZ(clockInTime, "h:mm a", {
              timeZone: "America/Los_Angeles",
            }),
            formatTZ(new Date(), "h:mm a", {
              timeZone: "America/Los_Angeles",
            }),
            "EmployeeOvertimeAlert"
          ),
          sendOvertimeAlertToAdmins(
            employeeId.toString(),
            employeeName,
            formatTZ(clockInTime, "h:mm a", {
              timeZone: "America/Los_Angeles",
            }),
            formatTZ(new Date(), "h:mm a", { timeZone: "America/Los_Angeles" })
          ),
        ]).catch((error) => {
          console.error("Failed to send overtime alerts:", error);
        });
      } else {
        // console.log("Employee has already clocked out. No alert needed.");
      }
    }, timeUntilAlert);
  }
};

const checkIfClockedOut = async (employeeId: string): Promise<boolean> => {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("employee_clock_events")
    .select("end_time")
    .eq("employee_id", employeeId)
    .eq("event_date", today)
    .single();

  if (error) {
    console.error("Error checking clock-out status:", error);
    return false;
  }

  return !!data?.end_time;
};

const sendOvertimeAlert = async (
  employeeName: string,
  recipientEmail: string | string[],
  clockInTime: string,
  currentTime: string,
  templateName: string
) => {
  try {
    const response = await fetch("/api/send_email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: recipientEmail,
        subject: "Overtime Alert",
        templateName: templateName,
        templateData: {
          employeeName,
          clockInTime,
          currentTime,
        },
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send overtime alert email");
    }

    // console.log(
    //   `Overtime alert sent to ${
    //     Array.isArray(recipientEmail)
    //       ? recipientEmail.join(", ")
    //       : recipientEmail
    //   }`
    // );
  } catch (error) {
    console.error("Error sending overtime alert:", error);
  }
};

const sendOvertimeAlertToAdmins = async (
  employeeId: string,
  employeeName: string,
  clockInTime: string,
  currentTime: string
) => {
  try {
    const hasClockedOut = await checkIfClockedOut(employeeId);

    if (hasClockedOut) {
      // console.log("Employee has already clocked out. No alert needed.");
      return;
    }

    const { data: admins, error } = await supabase
      .from("employees")
      .select("contact_info, name")
      .in("name", ["Sammy", "Russ", "Slim Jim"]);

    if (error) throw error;

    const adminEmails = admins.map((admin) => admin.contact_info);

    if (adminEmails.length > 0) {
      await sendOvertimeAlert(
        employeeName,
        adminEmails,
        clockInTime,
        currentTime,
        "AdminOvertimeAlert"
      );
    }
  } catch (error) {
    console.error("Failed to send overtime alert to admins:", error);
  }
};

const sendNotificationToAdmins = async (
  timeOffData: any,
  selectedDates: Date[]
) => {
  try {
    // Get admin emails from Supabase
    const { data: admins, error: employeesError } = await supabase
      .from("employees")
      .select("contact_info, name")
      .in("name", ["Sammy", "Russ", "Slim Jim"]);

    if (employeesError) throw employeesError;

    if (!admins || admins.length === 0) {
      console.warn("No admin emails found");
      return;
    }

    const adminEmails = admins.map((admin) => admin.contact_info);

    // Format dates consistently
    const timeZone = "America/Los_Angeles";
    const startDate = formatTZ(
      toZonedTime(selectedDates[0], timeZone),
      "EEEE, MMMM d, yyyy",
      { timeZone }
    );
    const endDate = formatTZ(
      toZonedTime(selectedDates[selectedDates.length - 1], timeZone),
      "EEEE, MMMM d, yyyy",
      { timeZone }
    );

    // Send email using the API route
    const response = await fetch("/api/send_email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: adminEmails,
        subject: "New Time Off Request Submitted",
        templateName: "TimeOffRequest",
        templateData: {
          employeeName: timeOffData.name,
          startDate,
          endDate,
          reason: timeOffData.reason,
          other_reason: timeOffData.other_reason || "",
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to send notification email");
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to send notification email:", error);
    throw error;
  }
};

const calculateDurationWithLunch = (
  start: string,
  end: string,
  lunchStart: string | null,
  lunchEnd: string | null
): string => {
  let startTime = new Date(`1970-01-01T${start}Z`).getTime();
  let endTime = new Date(`1970-01-01T${end}Z`).getTime();

  if (endTime < startTime) {
    endTime += 24 * 60 * 60 * 1000;
  }

  let totalDuration = endTime - startTime;

  if (lunchStart && lunchEnd) {
    const lunchStartTime = new Date(`1970-01-01T${lunchStart}Z`).getTime();
    const lunchEndTime = new Date(`1970-01-01T${lunchEnd}Z`).getTime();
    const lunchDuration = lunchEndTime - lunchStartTime;
    totalDuration -= lunchDuration;
  }

  if (totalDuration < 0 || totalDuration > 24 * 60 * 60 * 1000) {
    console.error("Invalid duration calculated:", totalDuration);
    return "00:00:00";
  }

  const totalSeconds = Math.floor(totalDuration / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

export default EmployeeProfilePage;
