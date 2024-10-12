// // TGR\crew\profile\[employeeId]\page.tsx
// "use client";
// import { Suspense, useCallback, useEffect, useState } from "react";
// import { useParams } from "next/navigation";
// import {
//   Card,
//   CardHeader,
//   CardTitle,
//   CardContent,
//   CardDescription,
// } from "@/components/ui/card";
// import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
// import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// import { supabase } from "@/utils/supabase/client";
// import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
// import SchedulesComponent from "@/components/SchedulesComponent";
// import { CalendarIcon } from "lucide-react";
// import { CustomCalendar } from "@/components/ui/calendar";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   Popover,
//   PopoverTrigger,
//   PopoverContent,
// } from "@/components/ui/popover";
// import {
//   Dialog,
//   DialogTrigger,
//   DialogContent,
//   DialogTitle,
//   DialogDescription,
//   DialogOverlay,
//   DialogClose,
// } from "@radix-ui/react-dialog";
// import { Button } from "@/components/ui/button";
// import SuggestionForm from "@/components/SuggestionForm";
// import {
//   format,
//   startOfWeek,
//   endOfWeek,
//   subWeeks,
//   startOfDay,
//   endOfDay,
//   addDays,
//   isSunday,
//   previousSunday,
//   nextSaturday,
// } from "date-fns";
// import { toZonedTime, format as formatTZ } from "date-fns-tz";
// import { toast } from "sonner";
// import TimeOffRequestComponent from "@/components/TimeOffRequestComponent";
// import { Textarea } from "@/components/ui/textarea";
// import { ClockIcon } from "@radix-ui/react-icons";
// import { DataTable } from "../../../../admin/audits/contest/data-table";
// import { Input } from "@/components/ui/input";
// import { useForm, Controller } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import PointsForm from "@/components/PointsForm";
// import PointsComponent from "../../points/page";
// import { Label } from "@/components/ui/label";
// import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
// import styles from "./profiles.module.css";
// import classNames from "classnames";
// import RoleBasedWrapper from "@/components/RoleBasedWrapper";
// import { CustomCalendarMulti } from "@/components/ui/calendar";
// import { Progress } from "@/components/ui/progress";
// import { ProgressBar } from "@/components/ProgressBar";
// import { Separator } from "@radix-ui/react-dropdown-menu";
// import { useQuery } from "@tanstack/react-query";
// import DOMPurify from "dompurify";

// const schedulestitle = "Scheduling";
// const performancetitle = "Individual Performance";
// const formtitle = "Your Forms";

// // TimeOffReason interface for type
// interface TimeOffReason {
//   id: number;
//   reason: string;
// }

// interface Audit {
//   dros_number: string;
//   salesreps: string;
//   audit_type: string;
//   trans_date: string;
//   audit_date: string;
//   error_location: string;
//   error_details: string;
//   error_notes: string;
//   dros_cancel: string;
// }

// type EmployeeProfileData = {
//   name: string;
//   last_name: string;
//   phone_number: string;
//   street_address: string;
//   city: string;
//   state: string;
//   zip: string;
// };

// interface Review {
//   id: number;
//   employee_id: number;
//   review_quarter: string;
//   review_year: number;
//   overview_performance: string;
//   achievements_contributions: string[];
//   attendance_reliability: string[];
//   quality_work: string[];
//   communication_collaboration: string[];
//   strengths_accomplishments: string[];
//   areas_growth: string[];
//   recognition: string[];
//   created_by: string;
//   created_at: string;
// }

// interface PointsCalculation {
//   category: string;
//   error_location: string;
//   points_deducted: number;
// }

// interface Shift {
//   id: number;
//   employee_id: number;
//   employee_name: string;
//   start_time: string;
//   end_time?: string;
//   total_hours?: string;
// }

// const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;

// const schema = z.object({
//   employee: z.string().nonempty({ message: "Employee name is required" }),
//   dros_status: z.string().nonempty({ message: "DROS status is required" }),
//   dros_number: z.string().min(2, { message: "DROS Number is required" }),
//   invoice_number: z.string().min(2, { message: "Invoice Number is required" }),
//   serial_number: z.string().min(2, { message: "Serial Number is required" }),
//   start_trans: z
//     .string()
//     .nonempty({ message: "Start Transaction status is required" }),
//   details: z.string().optional(),
// });

// type FormData = z.infer<typeof schema>;

// const EmployeeProfilePage = () => {
//   const params = useParams();
//   const employeeIdParam = params?.employeeId ?? "";
//   const employeeId = Array.isArray(employeeIdParam)
//     ? parseInt(employeeIdParam[0], 10)
//     : parseInt(employeeIdParam, 10);
//   const [employee, setEmployee] = useState<any>(null);
//   const [availableTimeOff, setAvailableTimeOff] = useState<number | null>(null);
//   const [availableSickTime, setAvailableSickTime] = useState<number | null>(
//     null
//   );
//   const [selectedMonth, setSelectedMonth] = useState<Date | undefined>(
//     undefined
//   );
//   const [summaryData, setSummaryData] = useState<any[]>([]);
//   const [pointsCalculation, setPointsCalculation] = useState<
//     PointsCalculation[]
//   >([]);
//   const userUuid = params?.userUuid ?? ""; // Define userUuid

//   // State for time off request
//   const [selectedDate, setSelectedDate] = useState<Date | null>(null);
//   const [reason, setReason] = useState<string>("");
//   const [showOtherTextarea, setShowOtherTextarea] = useState(false);
//   const [otherReason, setOtherReason] = useState<string>("");
//   const [timeOffReasons, setTimeOffReasons] = useState<TimeOffReason[]>([]);
//   const [audits, setAudits] = useState<Audit[]>([]);
//   const [reviews, setReviews] = useState<Review[]>([]);
//   const [currentReview, setCurrentReview] = useState<Review | null>(null);
//   const [viewReviewDialog, setViewReviewDialog] = useState(false);
//   const [selectedDates, setSelectedDates] = useState<Date[]>([]);
//   const [progress, setProgress] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [isClockedIn, setIsClockedIn] = useState(false);
//   const [onLunchBreak, setOnLunchBreak] = useState(false);
//   const [clockInTime, setClockInTime] = useState<Date | null>(null);
//   const [currentShift, setCurrentShift] = useState<any>(null);
//   const [popoverOpen, setPopoverOpen] = useState(false);
//   const [dialogOpen, setDialogOpen] = useState(false);
//   const [weeklySummary, setWeeklySummary] = useState<string | null>(null);
//   const [payPeriodSummary, setPayPeriodSummary] = useState<string | null>(null);
//   const [lunchBreakTime, setLunchBreakTime] = useState<string | null>(null);
//   const [user, setUser] = useState<any>(null);
//   const {
//     register,
//     handleSubmit: handleSubmitProfile,
//     setValue,
//   } = useForm<EmployeeProfileData>();
//   const [payPeriodDates, setPayPeriodDates] = useState<{
//     start: string;
//     end: string;
//   } | null>(null);

//   const calculateDurationWithLunch = (
//     start: string,
//     end: string,
//     lunchStart: string | null,
//     lunchEnd: string | null
//   ): string => {
//     let startTime = new Date(`1970-01-01T${start}Z`).getTime();
//     let endTime = new Date(`1970-01-01T${end}Z`).getTime();

//     // If end time is earlier than start time, assume it's the next day
//     if (endTime < startTime) {
//       endTime += 24 * 60 * 60 * 1000; // Add 24 hours
//     }

//     let totalDuration = endTime - startTime;

//     if (lunchStart && lunchEnd) {
//       const lunchStartTime = new Date(`1970-01-01T${lunchStart}Z`).getTime();
//       const lunchEndTime = new Date(`1970-01-01T${lunchEnd}Z`).getTime();
//       const lunchDuration = lunchEndTime - lunchStartTime;
//       totalDuration -= lunchDuration;
//     }

//     if (totalDuration < 0 || totalDuration > 24 * 60 * 60 * 1000) {
//       console.error("Invalid duration calculated:", totalDuration);
//       return "00:00:00";
//     }

//     const totalSeconds = Math.floor(totalDuration / 1000);
//     const hours = Math.floor(totalSeconds / 3600);
//     const minutes = Math.floor((totalSeconds % 3600) / 60);
//     const seconds = totalSeconds % 60;

//     return `${hours.toString().padStart(2, "0")}:${minutes
//       .toString()
//       .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
//   };

//   const sendOvertimeAlert = async (
//     employeeName: string,
//     recipientEmail: string | string[],
//     clockInTime: string,
//     currentTime: string,
//     templateName: string
//   ) => {
//     try {
//       const response = await fetch("/api/send_email", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           email: recipientEmail,
//           subject: "Overtime Alert",
//           templateName: templateName,
//           templateData: {
//             employeeName,
//             clockInTime,
//             currentTime,
//           },
//         }),
//       });

//       if (!response.ok) {
//         throw new Error("Failed to send overtime alert email");
//       }

//       console.log(
//         `Overtime alert sent to ${
//           Array.isArray(recipientEmail)
//             ? recipientEmail.join(", ")
//             : recipientEmail
//         }`
//       );
//     } catch (error) {
//       console.error("Error sending overtime alert:", error);
//     }
//   };

//   const timeZone = "America/Los_Angeles";
//   const handleClockIn = async () => {
//     const timeZone = "America/Los_Angeles";
//     const now = toZonedTime(new Date(), timeZone);
//     const eventDate = formatTZ(now, "yyyy-MM-dd", { timeZone });
//     const startTime = formatTZ(now, "HH:mm:ss", { timeZone });

//     const { data: existingData, error: fetchError } = await supabase
//       .from("employee_clock_events")
//       .select("*")
//       .eq("employee_id", employeeId)
//       .eq("event_date", eventDate)
//       .single();

//     if (fetchError && fetchError.code !== "PGRST116") {
//       console.error("Error fetching existing clock-in data:", fetchError);
//       return;
//     }

//     if (existingData) {
//       const { error: updateError } = await supabase
//         .from("employee_clock_events")
//         .update({
//           start_time: startTime,
//         })
//         .eq("id", existingData.id);

//       if (updateError) {
//         console.error("Error updating clock-in data:", updateError);
//       } else {
//         setClockInTime(now);
//         setIsClockedIn(true);
//         setCurrentShift(existingData);

//         // Calculate lunch break time (5 hours after start time)
//         const lunchBreak = new Date(now);
//         lunchBreak.setHours(lunchBreak.getHours() + 5);
//         setLunchBreakTime(
//           formatTZ(toZonedTime(lunchBreak, timeZone), "h:mm a", { timeZone })
//         );

//         toast.success(`Welcome Back ${employee.name}!`);
//       }
//     } else {
//       const { data: insertData, error: insertError } = await supabase
//         .from("employee_clock_events")
//         .insert({
//           employee_id: employeeId,
//           employee_name: employee.name,
//           event_date: eventDate,
//           start_time: startTime,
//         })
//         .select()
//         .single();

//       if (insertError) {
//         console.error("Error clocking in:", insertError);
//       } else {
//         setClockInTime(now);
//         setIsClockedIn(true);
//         setCurrentShift(insertData);

//         // Calculate lunch break time (5 hours after start time)
//         const lunchBreak = new Date(now);
//         lunchBreak.setHours(lunchBreak.getHours() + 5);
//         setLunchBreakTime(
//           formatTZ(toZonedTime(lunchBreak, timeZone), "h:mm a", { timeZone })
//         );

//         toast.success(`Welcome Back ${employee.name}!`);
//         scheduleOvertimeAlert(now);
//       }
//     }
//   };

//   // sends alert to employee and admins simultaneously
//   const scheduleOvertimeAlert = (clockInTime: Date) => {
//     const alertTime = new Date(clockInTime.getTime() + 9 * 60 * 60 * 1000); // 9 hours after clock-in
//     const now = new Date();
//     const timeUntilAlert = alertTime.getTime() - now.getTime();

//     if (timeUntilAlert > 0) {
//       setTimeout(() => {
//         Promise.all([
//           sendOvertimeAlert(
//             employee.name,
//             employee.contact_info,
//             formatTZ(clockInTime, "h:mm a", { timeZone }),
//             formatTZ(new Date(), "h:mm a", { timeZone }),
//             "EmployeeOvertimeAlert"
//           ),
//           sendOvertimeAlertToAdmins(
//             employee.employee_id.toString(),
//             employee.name,
//             formatTZ(clockInTime, "h:mm a", { timeZone }),
//             formatTZ(new Date(), "h:mm a", { timeZone })
//           ),
//         ]).catch((error) => {
//           console.error("Failed to send overtime alerts:", error);
//         });
//       }, timeUntilAlert);
//     }
//   };

//   const getLatestClockEvent = async (employeeId: string) => {
//     const { data, error } = await supabase
//       .from("employee_clock_events")
//       .select("*")
//       .eq("employee_id", employeeId)
//       .order("start_time", { ascending: false })
//       .limit(1);

//     if (error) throw error;
//     return data[0];
//   };

//   const sendOvertimeAlertToAdmins = async (
//     employeeId: string,
//     employeeName: string,
//     clockInTime: string,
//     currentTime: string
//   ) => {
//     try {
//       const latestClockEvent = await getLatestClockEvent(employeeId);

//       if (latestClockEvent && latestClockEvent.end_time) {
//         console.log("Employee has already clocked out. No alert needed.");
//         return;
//       }

//       const { data: admins, error } = await supabase
//         .from("employees")
//         .select("contact_info, name")
//         .in("name", ["Sammy", "Russ", "Slim Jim"]);

//       if (error) throw error;

//       const adminEmails = admins.map((admin) => admin.contact_info);

//       if (adminEmails.length > 0) {
//         await sendOvertimeAlert(
//           employeeName,
//           adminEmails,
//           clockInTime,
//           currentTime,
//           "AdminOvertimeAlert"
//         );
//       }
//     } catch (error) {
//       console.error("Failed to send overtime alert to admins:", error);
//     }
//   };

//   const handleClockOut = () => {
//     if (onLunchBreak) {
//       setDialogOpen(true);
//     } else {
//       setPopoverOpen(true);
//     }
//   };

//   const handleEndShift = async () => {
//     const timeZone = "America/Los_Angeles";
//     const now = toZonedTime(new Date(), timeZone);
//     const endTime = formatTZ(now, "HH:mm:ss", { timeZone });
//     const eventDate = formatTZ(now, "yyyy-MM-dd", { timeZone });

//     if (!clockInTime) {
//       console.error("Invalid clock-in time");
//       return;
//     }

//     let duration;
//     if (currentShift?.lunch_start && currentShift?.lunch_end) {
//       duration = calculateDurationWithLunch(
//         currentShift.start_time,
//         endTime,
//         currentShift.lunch_start,
//         currentShift.lunch_end
//       );
//     } else {
//       duration = calculateDurationWithLunch(
//         currentShift.start_time,
//         endTime,
//         null,
//         null
//       );
//     }

//     if (duration !== "00:00:00") {
//       const { error } = await supabase
//         .from("employee_clock_events")
//         .update({
//           end_time: endTime,
//           total_hours: duration,
//         })
//         .eq("employee_id", employeeId)
//         .eq("event_date", eventDate);

//       if (error) {
//         //console.error("Error ending shift:", error);
//       } else {
//         setIsClockedIn(false);
//         setOnLunchBreak(false);
//         setClockInTime(null);
//         setCurrentShift((prevShift: any) => ({
//           ...prevShift,
//           end_time: endTime,
//           total_hours: duration,
//         }));
//         setPopoverOpen(false);
//         setDialogOpen(false);
//         toast.success(`Thank You For Your Hard Work Today ${employee.name}!`);
//       }
//     } else {
//       //console.error("Invalid duration calculated");
//     }
//   };

//   // Update the handleLunchBreak function
//   const handleLunchBreak = async () => {
//     const timeZone = "America/Los_Angeles";
//     const now = toZonedTime(new Date(), timeZone);
//     const lunchStart = formatTZ(now, "HH:mm:ss", { timeZone });

//     const { error } = await supabase
//       .from("employee_clock_events")
//       .update({
//         lunch_start: lunchStart, // Store just the time
//       })
//       .eq("id", currentShift?.id);

//     if (error) {
//       //console.error("Error starting lunch break:", error);
//     } else {
//       setOnLunchBreak(true);
//       setLunchBreakTime(formatTZ(now, "h:mm a", { timeZone })); // Update to actual lunch start time
//       setPopoverOpen(false);
//       toast.success(`Enjoy Your Lunch ${employee.name}!`);

//       // Update the current shift with the new lunch_start time
//       setCurrentShift((prevShift: Shift | null) => ({
//         ...(prevShift as Shift),
//         lunch_start: lunchStart,
//       }));
//     }
//   };

//   const handleClockBackInFromLunch = async () => {
//     const timeZone = "America/Los_Angeles";
//     const now = toZonedTime(new Date(), timeZone);
//     const lunchEnd = formatTZ(now, "HH:mm:ss", { timeZone });
//     const eventDate = formatTZ(now, "yyyy-MM-dd", { timeZone }); // Ensure date is the same

//     const { data, error } = await supabase
//       .from("employee_clock_events")
//       .update({
//         lunch_end: lunchEnd, // Store just the time
//       })
//       .eq("id", currentShift.id)
//       .select()
//       .single();

//     if (error) {
//       //console.error("Error ending lunch break:", error);
//     } else {
//       setOnLunchBreak(false);
//       setDialogOpen(false);
//       setPopoverOpen(false);
//       setCurrentShift(data);
//       toast.success("Let's Get Dis Bread!");
//     }
//   };

//   // Function to fetch the current shift
//   const fetchCurrentShift = async () => {
//     const eventDate = format(new Date(), "yyyy-MM-dd");

//     const { data, error } = await supabase
//       .from("employee_clock_events")
//       .select("*")
//       .eq("employee_id", employeeId)
//       .eq("event_date", eventDate)
//       .single();

//     if (error && error.code !== "PGRST116") {
//       //console.error("Error fetching current shift:", error);
//     } else if (data) {
//       setIsClockedIn(!!data.start_time && !data.end_time);
//       setOnLunchBreak(!!data.lunch_start && !data.lunch_end && !data.end_time);
//       setClockInTime(
//         data.start_time ? new Date(`1970-01-01T${data.start_time}Z`) : null
//       );
//       setCurrentShift(data);
//     } else {
//       // If no current shift exists, assume the user is not clocked in
//       setIsClockedIn(false);
//       setOnLunchBreak(false);
//       setClockInTime(null);
//       setCurrentShift(null);
//     }
//   };

//   // Call fetchCurrentShift in useEffect
//   useEffect(() => {
//     const fetchData = async () => {
//       setLoading(true);
//       setProgress(0);

//       await fetchEmployeeData();
//       await fetchAvailableTimeOff();
//       await fetchAvailableSickTime();
//       await fetchReviews();
//       await fetchWeeklySummary();
//       await fetchPayPeriodSummary();
//       await fetchCurrentShift(); // Ensure this is called to check if the user is clocked in

//       setProgress(100); // Final progress
//       setLoading(false);
//     };

//     fetchData();
//   }, [employeeId, userUuid]);

//   const calculateDuration = (start: Date, end: Date): string => {
//     const diff = end.getTime() - start.getTime();
//     if (diff < 0) return "00:00:00";
//     const hours = Math.floor(diff / (1000 * 60 * 60));
//     const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
//     const seconds = Math.floor((diff % (1000 * 60)) / 1000);
//     return `${hours.toString().padStart(2, "0")}:${minutes
//       .toString()
//       .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
//   };

//   const handleDateChange = (date: Date | undefined) => {
//     setSelectedDate(date || null);
//     fetchAndCalculateSummary(date || null);
//   };

//   const handleReasonChange = (value: string) => {
//     setReason(value);
//     const reasonsRequiringTextarea = [
//       "Other",
//       "Swapping Schedules",
//       "Starting Late",
//       "Leaving Early",
//       "Personal",
//       "Vacation",
//     ];
//     setShowOtherTextarea(reasonsRequiringTextarea.includes(value));
//   };

//   const fetchAndCalculateSummary = async (date: Date | null) => {
//     if (!date || !employee) return;

//     const startDate = new Date(date.getFullYear(), date.getMonth(), 1)
//       .toISOString()
//       .split("T")[0];
//     const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0)
//       .toISOString()
//       .split("T")[0];

//     try {
//       const { data: salesData, error: salesError } = await supabase
//         .from("sales_data")
//         .select("*")
//         .eq("Lanid", employee.lanid)
//         .gte("Date", startDate)
//         .lte("Date", endDate)
//         .not("subcategory_label", "is", null)
//         .not("subcategory_label", "eq", "");

//       const { data: auditData, error: auditError } = await supabase
//         .from("Auditsinput")
//         .select("*")
//         .eq("salesreps", employee.lanid)
//         .gte("audit_date", startDate)
//         .lte("audit_date", endDate);

//       if (salesError || auditError) {
//         console.error(salesError || auditError);
//         return;
//       }

//       const lanids = [employee.lanid];
//       let summary = lanids.map((lanid) => {
//         const employeeSalesData = salesData.filter(
//           (sale) => sale.Lanid === lanid
//         );
//         const employeeAuditData = auditData.filter(
//           (audit) => audit.salesreps === lanid
//         );

//         const totalDros = employeeSalesData.filter(
//           (sale) => sale.subcategory_label
//         ).length;
//         let pointsDeducted = 0;

//         employeeSalesData.forEach((sale) => {
//           if (sale.dros_cancel === "Yes") {
//             pointsDeducted += 5;
//           }
//         });

//         employeeAuditData.forEach((audit) => {
//           const auditDate = new Date(audit.audit_date);
//           if (auditDate <= date) {
//             pointsCalculation.forEach((point) => {
//               if (audit.error_location === point.error_location) {
//                 pointsDeducted += point.points_deducted;
//               } else if (
//                 point.error_location === "dros_cancel_field" &&
//                 audit.dros_cancel === "Yes"
//               ) {
//                 pointsDeducted += point.points_deducted;
//               }
//             });
//           }
//         });

//         const totalPoints = 300 - pointsDeducted;

//         return {
//           Lanid: lanid,
//           TotalDros: totalDros,
//           PointsDeducted: pointsDeducted,
//           TotalPoints: totalPoints,
//         };
//       });

//       summary.sort((a, b) => b.TotalPoints - a.TotalPoints);
//       setSummaryData(summary);
//     } catch (error) {
//       console.error("Error fetching or calculating summary data:", error);
//     }
//   };

//   useEffect(() => {
//     if (employee && selectedDate) {
//       fetchAndCalculateSummary(selectedDate);
//     }
//   }, [employee, selectedDate]);

//   const handleSubmit = async () => {
//     if (selectedDates.length < 1) {
//       toast.error("Please select at least one date.");
//       return;
//     }

//     const timeZone = "America/Los_Angeles"; // Define the timezone

//     const startDate = toZonedTime(
//       new Date(Math.min(...selectedDates.map((date) => date.getTime()))),
//       timeZone
//     );
//     const endDate = toZonedTime(
//       new Date(Math.max(...selectedDates.map((date) => date.getTime()))),
//       timeZone
//     );

//     const start_date = formatTZ(startDate, "yyyy-MM-dd", { timeZone });
//     const end_date = formatTZ(endDate, "yyyy-MM-dd", { timeZone });

//     const payload = {
//       start_date,
//       end_date,
//       reason,
//       other_reason: showOtherTextarea ? otherReason : "",
//       employee_id: employeeId,
//       name: employee.name,
//       email: employee.contact_info,
//       sick_time_year: new Date().getFullYear(),
//     };

//     try {
//       const { data, error } = await supabase
//         .from("time_off_requests")
//         .insert([payload]);

//       if (error) {
//         throw error;
//       }

//       // Reset the form fields
//       setSelectedDates([]);
//       setReason("");
//       setOtherReason("");
//       setShowOtherTextarea(false);

//       toast.success("Time off request submitted successfully!");
//       await sendNotificationToAdmins(payload, selectedDates);
//     } catch (error) {
//       console.error(
//         "Failed to submit time off request:",
//         (error as Error).message
//       );
//       toast.error("Failed to submit time off request.");
//     }
//   };

//   const handleViewReview = (review: Review) => {
//     setCurrentReview(review);
//     setViewReviewDialog(true);
//   };

//   const fetchAudits = async (lanid: string) => {
//     const { data, error } = await supabase
//       .from("Auditsinput")
//       .select("*")
//       .eq("salesreps", lanid)
//       .order("audit_date", { ascending: false });

//     if (error) {
//       console.error("Error fetching audits:", error);
//     } else {
//       setAudits(data as Audit[]);
//     }
//   };

//   useEffect(() => {
//     if (employee && employee.lanid) {
//       fetchAudits(employee.lanid);
//     }
//   }, [employee]);

//   useEffect(() => {
//     const fetchTimeOffReasons = async () => {
//       try {
//         const { data, error } = await supabase
//           .from("time_off_reasons")
//           .select("*");
//         if (error) throw error;
//         setTimeOffReasons(data);
//       } catch (error) {
//         console.error(
//           "Error fetching time off reasons:",
//           (error as Error).message
//         );
//       }
//     };

//     fetchTimeOffReasons();
//   }, []);

//   const fetchEmployeeData = async () => {
//     setProgress((prev) => prev + 10); // Initial progress

//     let employeeData = null;
//     let employeeRole = null;
//     let error = null;

//     // Fetch from employees table
//     const { data: employee, error: employeeError } = await supabase
//       .from("employees")
//       .select("*, contact_info")
//       .eq("employee_id", employeeId)
//       .single();

//     if (employeeError && employeeError.code !== "PGRST116") {
//       console.error("Error fetching employee data:", employeeError.message);
//       error = employeeError;
//     } else if (employee) {
//       employeeData = employee;
//       employeeRole = employee.role;
//     } else {
//       // Fetch from public.customers table if not found in employees table
//       const { data: customer, error: customerError } = await supabase
//         .from("public.customers")
//         .select("*")
//         .eq("user_uuid", userUuid)
//         .single();

//       if (customerError) {
//         console.error("Error fetching customer data:", customerError.message);
//         error = customerError;
//       } else {
//         employeeData = customer;
//         employeeRole = customer.role;
//       }
//     }

//     if (!error) {
//       setEmployee(employeeData);
//     }

//     setProgress((prev) => prev + 30); // Update progress
//   };

//   const fetchAvailableSickTime = async () => {
//     setProgress((prev) => prev + 10); // Initial progress
//     try {
//       const { data, error } = await supabase.rpc(
//         "calculate_available_sick_time",
//         {
//           p_emp_id: employeeId,
//         }
//       );

//       if (error) throw error;

//       setAvailableSickTime(data);
//     } catch (error) {
//       console.error(
//         "Error fetching available sick time:",
//         (error as Error).message
//       );
//     }
//     setProgress((prev) => prev + 20); // Update progress
//   };

//   const fetchAvailableTimeOff = async () => {
//     setProgress((prev) => prev + 10); // Initial progress
//     try {
//       const { data, error } = await supabase
//         .from("time_off_requests")
//         .select("sick_time_year, use_sick_time")
//         .eq("employee_id", employeeId);

//       if (error) throw error;

//       const usedSickTime = data.reduce((acc: number, request: any) => {
//         if (request.use_sick_time) {
//           acc +=
//             (new Date(request.end_date).getTime() -
//               new Date(request.start_date).getTime()) /
//               (1000 * 60 * 60 * 24) +
//             1;
//         }
//         return acc;
//       }, 0);

//       setAvailableTimeOff(40 - usedSickTime);
//     } catch (error) {
//       console.error(
//         "Error fetching available time off:",
//         (error as Error).message
//       );
//     }
//     setProgress((prev) => prev + 20); // Update progress
//   };

//   const fetchReviews = async () => {
//     setProgress((prev) => prev + 10); // Initial progress
//     if (!employeeId) return;

//     const { data, error } = await supabase
//       .from("employee_quarterly_reviews")
//       .select("*")
//       .eq("employee_id", employeeId)
//       .eq("published", true);

//     if (error) {
//       console.error("Error fetching reviews:", error);
//     } else {
//       setReviews(data as Review[]);
//     }
//     setProgress((prev) => prev + 20); // Update progress
//   };

//   // Function to fetch weekly summary
//   const fetchWeeklySummary = async () => {
//     const startOfWeekDate = startOfWeek(new Date(), { weekStartsOn: 0 });
//     const endOfWeekDate = endOfWeek(new Date(), { weekStartsOn: 0 });

//     const { data, error } = await supabase
//       .from("employee_clock_events")
//       .select("*")
//       .eq("employee_id", employeeId)
//       .gte("event_date", format(startOfWeekDate, "yyyy-MM-dd"))
//       .lte("event_date", format(endOfWeekDate, "yyyy-MM-dd"));

//     if (error) {
//       console.error("Error fetching weekly summary:", error);
//     } else {
//       const totalHours = data.reduce((acc, shift) => {
//         if (shift.total_hours) {
//           const [hours, minutes, seconds] = shift.total_hours
//             .split(":")
//             .map(Number);
//           const duration = hours + minutes / 60 + seconds / 3600; // Convert to hours
//           return acc + duration;
//         }
//         return acc;
//       }, 0);

//       // Add a final check
//       if (totalHours > 100) {
//         // Max possible hours in a week
//         toast.error("Unrealistic total hours:", totalHours);
//         return 0; // or some default value
//       }

//       setWeeklySummary(totalHours.toFixed(2)); // Round to 2 decimal places
//     }
//   };

//   // Function to fetch pay period summary
//   const fetchPayPeriodSummary = async () => {
//     const timeZone = "America/Los_Angeles";
//     const now = toZonedTime(new Date(), timeZone);

//     // Start date of the first pay period
//     const firstPayPeriodStart = new Date(2024, 7, 18); // August 18, 2024

//     // Calculate the current pay period
//     let currentPeriodStart = startOfDay(firstPayPeriodStart);
//     while (currentPeriodStart <= now) {
//       currentPeriodStart = addDays(currentPeriodStart, 14);
//     }
//     currentPeriodStart = addDays(currentPeriodStart, -14);

//     const currentPeriodEnd = endOfDay(addDays(currentPeriodStart, 13)); // 13 days later (inclusive)

//     // Format dates for query
//     const startDate = formatTZ(currentPeriodStart, "yyyy-MM-dd", { timeZone });
//     const endDate = formatTZ(currentPeriodEnd, "yyyy-MM-dd", { timeZone });

//     // console.log(`Fetching pay period data from ${startDate} to ${endDate}`);

//     // Fetch data for the current pay period
//     const { data: payPeriodData, error } = await supabase
//       .from("employee_clock_events")
//       .select("*")
//       .eq("employee_id", employeeId)
//       .gte("event_date", startDate)
//       .lte("event_date", endDate);

//     if (error) {
//       console.error("Error fetching pay period summary:", error);
//       setPayPeriodSummary(null);
//       return;
//     }

//     // console.log(`Fetched ${payPeriodData.length} clock events`);

//     let totalHours = 0;
//     payPeriodData.forEach((shift, index) => {
//       if (shift.total_hours) {
//         const [hours, minutes, seconds] = shift.total_hours
//           .split(":")
//           .map(Number);
//         const duration = hours + minutes / 60 + seconds / 3600; // Convert to hours
//         // console.log(
//         //   `Shift ${index + 1}: ${shift.total_hours} (${duration.toFixed(
//         //     2
//         //   )} hours)`
//         // );
//         totalHours += duration;
//       } else {
//         // console.log(`Shift ${index + 1}: No total_hours recorded`);
//       }
//     });

//     // console.log(`Total hours calculated: ${totalHours.toFixed(2)}`);

//     if (totalHours > 336) {
//       // Max possible hours in 14 days (24 * 14)
//       console.error(
//         `Unrealistic total hours: ${totalHours.toFixed(2)}. Setting to 0.`
//       );
//       totalHours = 0;
//     }

//     setPayPeriodSummary(totalHours.toFixed(2));

//     // Set the pay period dates for display
//     setPayPeriodDates({
//       start: formatTZ(currentPeriodStart, "MMM d, yyyy", { timeZone }),
//       end: formatTZ(currentPeriodEnd, "MMM d, yyyy", { timeZone }),
//     });
//   };

//   useEffect(() => {
//     const fetchData = async () => {
//       setLoading(true);
//       setProgress(0);

//       await fetchEmployeeData();
//       await fetchAvailableTimeOff();
//       await fetchAvailableSickTime();
//       await fetchReviews();
//       await fetchWeeklySummary();
//       await fetchPayPeriodSummary();
//       await fetchCurrentShift();

//       setProgress(100); // Final progress
//       setLoading(false);
//     };

//     fetchData();
//   }, [employeeId, userUuid]);

//   useEffect(() => {
//     const fetchProfile = async () => {
//       const { data: userData } = await supabase.auth.getUser();
//       if (userData) {
//         setUser(userData.user);

//         const { data: employeeData, error } = await supabase
//           .from("employees")
//           .select(
//             "name, last_name, phone_number, street_address, city, state, zip"
//           )
//           .eq("user_uuid", userData.user?.id)
//           .single();

//         if (error) {
//           console.error("Error fetching employee data:", error);
//           toast.error("Failed to load profile data. Please try again.");
//           return;
//         }

//         if (employeeData) {
//           // Type-safe way to set form values
//           (
//             Object.keys(employeeData) as Array<keyof EmployeeProfileData>
//           ).forEach((key) => {
//             setValue(key, employeeData[key]);
//           });
//         }
//       }
//     };

//     fetchProfile();
//   }, [setValue]);

//   async function sendNotificationToAdmins(
//     timeOffData: any,
//     selectedDates: Date[]
//   ) {
//     const startDate = format(selectedDates[0], "yyyy-MM-dd");
//     const endDate = format(
//       selectedDates[selectedDates.length - 1],
//       "yyyy-MM-dd"
//     );

//     try {
//       // Fetch super admin emails
//       const { data: employees, error: employeesError } = await supabase
//         .from("employees")
//         .select("contact_info, name")
//         .in("name", ["Sammy", "Russ", "Slim Jim"]);

//       if (employeesError) throw employeesError;

//       const recipientEmails = employees.map((emp) => emp.contact_info);

//       if (recipientEmails.length === 0) {
//         console.warn("No super admin emails found");
//         return;
//       }

//       const response = await fetch("/api/send_email", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           email: recipientEmails,
//           subject: "New Time Off Request Submitted",
//           templateName: "TimeOffRequest",
//           templateData: {
//             employeeName: timeOffData.employee_name,
//             startDate,
//             endDate,
//             reason: timeOffData.reason,
//             other_reason: timeOffData.other_reason,
//           },
//         }),
//       });

//       if (!response.ok) {
//         throw new Error("Failed to send email");
//       }

//       // console.log("Notification email sent to super admins");
//     } catch (error) {
//       console.error("Failed to send notification email:", error);
//     }
//   }

//   const onSubmit = async (data: EmployeeProfileData) => {
//     if (user) {
//       const { error } = await supabase
//         .from("employees")
//         .update(data)
//         .eq("user_uuid", user.id);

//       if (error) {
//         console.error("Error updating profile:", error);
//         toast.error("Failed to update profile. Please try again.");
//       } else {
//         toast.success("Profile updated successfully!");
//       }
//     }
//   };

//   if (loading) return <ProgressBar value={progress} showAnimation={true} />;

//   return (
//     <RoleBasedWrapper
//       allowedRoles={[
//         "gunsmith",
//         "user",
//         "auditor",
//         "admin",
//         "super admin",
//         "dev",
//       ]}
//     >
//       <div className="section w-full">
//         <Card className="flex flex-col h-full max-w-6xl mx-auto my-12">
//           <header className="bg-gray-100 dark:bg-muted px-6 py-4 border-b border-gray-200 dark:border-gray-700">
//             <div className="flex items-center gap-4">
//               <Avatar>
//                 <img
//                   src={employee?.avatar_url || "/Banner.png"}
//                   alt="Employee Avatar"
//                 />
//                 <AvatarFallback>{employee?.name?.[0] || "?"}</AvatarFallback>
//               </Avatar>

//               <div>
//                 <h1 className="text-xl font-bold">
//                   Welcome {DOMPurify.sanitize(employee?.name || "")}
//                 </h1>
//                 <p className="text-sm text-gray-500 dark:text-gray-400">
//                   {DOMPurify.sanitize(employee?.position || "")}
//                 </p>
//               </div>
//             </div>
//           </header>
//           <Tabs defaultValue="clock" className="w-full">
//             <TabsList className="border-b border-gray-200 dark:border-gray-700">
//               <TabsTrigger value="clock">Timesheet</TabsTrigger>
//               <TabsTrigger value="schedules">Scheduling</TabsTrigger>
//               <TabsTrigger value="performance">Sales & Audits</TabsTrigger>
//               <TabsTrigger value="forms">Forms</TabsTrigger>
//               <TabsTrigger value="reviews">Reviews</TabsTrigger>
//               {employee?.role === "super admin" ||
//                 (employee?.role === "dev" && (
//                   <TabsTrigger value="profile">Manage Profile</TabsTrigger>
//                 ))}
//             </TabsList>
//             <ScrollArea className="h-[calc(100vh-300px)]">
//               <main
//                 className={classNames(
//                   "grid flex-1 items-start mx-auto my-4 mb-4 max-w-8xl gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 body",
//                   styles.noScroll
//                 )}
//               >
//                 <Suspense fallback="">
//                   {/* Schedules tab content */}
//                   <TabsContent value="schedules">
//                     {/* <h1 className="text-xl font-bold mb-2 ml-2">
//                       <TextGenerateEffect words={schedulestitle} />
//                     </h1> */}
//                     <div className="grid p-2 gap-4 md:grid-cols-2 lg:grid-cols-2">
//                       <Card>
//                         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                           <CardTitle className="text-2xl font-bold">
//                             Request Time Off
//                           </CardTitle>
//                           {/* <CalendarIcon className="h-4 w-4 text-muted-foreground" /> */}
//                         </CardHeader>
//                         <CardContent>
//                           <Popover>
//                             <PopoverTrigger asChild>
//                               <Button
//                                 variant="linkHover1"
//                                 className="w-full pl-3 text-left font-normal"
//                               >
//                                 {selectedDates.length > 0 ? (
//                                   <>
//                                     {format(
//                                       new Date(
//                                         Math.min(
//                                           ...selectedDates.map((date) =>
//                                             date.getTime()
//                                           )
//                                         )
//                                       ),
//                                       "M/dd"
//                                     )}{" "}
//                                     -{" "}
//                                     {format(
//                                       new Date(
//                                         Math.max(
//                                           ...selectedDates.map((date) =>
//                                             date.getTime()
//                                           )
//                                         )
//                                       ),
//                                       "M/dd"
//                                     )}
//                                   </>
//                                 ) : (
//                                   <span>Pick dates</span>
//                                 )}
//                                 <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
//                               </Button>
//                             </PopoverTrigger>
//                             <PopoverContent
//                               className="w-auto p-0"
//                               align="start"
//                             >
//                               <CustomCalendarMulti
//                                 selectedDates={selectedDates}
//                                 onDatesChange={setSelectedDates}
//                                 disabledDays={() => false}
//                               />
//                             </PopoverContent>
//                           </Popover>
//                           <div className="mt-4">
//                             <Select
//                               value={reason}
//                               onValueChange={handleReasonChange}
//                             >
//                               <SelectTrigger>
//                                 <SelectValue placeholder="Select Reason" />
//                               </SelectTrigger>
//                               <SelectContent>
//                                 {timeOffReasons.map((reason: TimeOffReason) => (
//                                   <SelectItem
//                                     key={reason.id}
//                                     value={reason.reason}
//                                   >
//                                     {reason.reason}
//                                   </SelectItem>
//                                 ))}
//                               </SelectContent>
//                             </Select>
//                           </div>
//                           {showOtherTextarea && (
//                             <Textarea
//                               className="mt-4"
//                               value={otherReason}
//                               onChange={(e) => setOtherReason(e.target.value)}
//                               placeholder={
//                                 reason === "Swapping Schedules"
//                                   ? "Please specify who you are swapping with and the dates you are swapping (dates must be during the same week)"
//                                   : "Please specify who is covering for the dates you are requesting off (swapped dates must be during the same week)"
//                               }
//                             />
//                           )}
//                           <Button
//                             onClick={handleSubmit}
//                             variant="linkHover1"
//                             className="mt-4"
//                           >
//                             Submit Request
//                           </Button>
//                         </CardContent>
//                       </Card>
//                       <Card>
//                         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                           <CardTitle className="text-2xl font-bold">
//                             Available Sick Time
//                           </CardTitle>
//                           <ClockIcon className="h-4 w-4 text-muted-foreground" />
//                         </CardHeader>
//                         <CardContent>
//                           <div className="text-2xl font-medium mt-6">
//                             {availableSickTime !== null
//                               ? `${availableSickTime} hours`
//                               : ""}
//                           </div>
//                         </CardContent>
//                       </Card>
//                     </div>
//                     <Card>
//                       <CardHeader></CardHeader>
//                       <CardContent>
//                         <SchedulesComponent employeeId={employeeId} />
//                       </CardContent>
//                     </Card>
//                   </TabsContent>

//                   {/* Clock tab content */}
//                   <TabsContent value="clock">
//                     <h1 className="text-xl font-bold mb-2 ml-2">
//                       <TextGenerateEffect words="Time Clock" />
//                     </h1>
//                     <div className="grid p-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
//                       <Card className="mt-4">
//                         <CardHeader className="flex justify-between items-center">
//                           <CardTitle className="text-2xl font-bold">
//                             Time Card
//                           </CardTitle>
//                         </CardHeader>
//                         <CardContent className="mx-auto">
//                           {!isClockedIn && (
//                             <Button
//                               variant="linkHover1"
//                               className="w-full mx-auto"
//                               onClick={handleClockIn}
//                             >
//                               Clock In
//                             </Button>
//                           )}
//                           {isClockedIn && !onLunchBreak && (
//                             <Button
//                               variant="ringHover"
//                               className="w-full mx-auto"
//                               onClick={handleClockOut}
//                             >
//                               Clock Out
//                             </Button>
//                           )}
//                           {onLunchBreak && (
//                             <Dialog
//                               open={dialogOpen}
//                               onOpenChange={setDialogOpen}
//                             >
//                               <DialogTrigger asChild>
//                                 <Button variant="linkHover1">
//                                   Clock Back In From Lunch
//                                 </Button>
//                               </DialogTrigger>
//                               <DialogContent>
//                                 <DialogDescription>
//                                   <Button
//                                     variant="gooeyLeft"
//                                     className="w-full mx-auto"
//                                     onClick={handleClockBackInFromLunch}
//                                   >
//                                     Confirm Clocking Back In
//                                   </Button>
//                                 </DialogDescription>
//                               </DialogContent>
//                             </Dialog>
//                           )}
//                           <Popover
//                             open={popoverOpen}
//                             onOpenChange={setPopoverOpen}
//                           >
//                             <PopoverTrigger asChild>
//                               <div />
//                             </PopoverTrigger>
//                             <PopoverContent>
//                               <div className="flex w-full justify-center space-between">
//                                 <Button
//                                   variant="linkHover2"
//                                   onClick={handleEndShift}
//                                 >
//                                   End Shift
//                                 </Button>
//                                 <Button
//                                   variant="linkHover2"
//                                   onClick={handleLunchBreak}
//                                 >
//                                   Lunch Break
//                                 </Button>
//                               </div>
//                             </PopoverContent>
//                           </Popover>
//                         </CardContent>
//                       </Card>

//                       <Card className="mt-4">
//                         <CardHeader className="flex justify-between items-center">
//                           <CardTitle className="text-2xl font-bold">
//                             Start Of Shift
//                           </CardTitle>
//                         </CardHeader>
//                         <CardContent className="mx-auto">
//                           {clockInTime ? (
//                             <div>
//                               {`${formatTZ(
//                                 toZonedTime(
//                                   new Date(
//                                     `${currentShift.event_date}T${currentShift.start_time}`
//                                   ),
//                                   timeZone
//                                 ),
//                                 "PPP h:mm a",
//                                 { timeZone }
//                               )}`}
//                             </div>
//                           ) : (
//                             <div>Not clocked in</div>
//                           )}
//                         </CardContent>
//                       </Card>

//                       <Card className="mt-4">
//                         <CardHeader className="flex justify-between items-center">
//                           <CardTitle className="text-2xl font-bold">
//                             Lunch Break
//                           </CardTitle>
//                         </CardHeader>
//                         <CardContent className="mx-auto">
//                           {currentShift ? (
//                             currentShift.lunch_start &&
//                             currentShift.lunch_end ? (
//                               <div>{`Your Lunch Break Was From ${formatTZ(
//                                 toZonedTime(
//                                   new Date(
//                                     `1970-01-01T${currentShift.lunch_start}`
//                                   ),
//                                   timeZone
//                                 ),
//                                 "h:mm a",
//                                 { timeZone }
//                               )} to ${formatTZ(
//                                 toZonedTime(
//                                   new Date(
//                                     `1970-01-01T${currentShift.lunch_end}`
//                                   ),
//                                   timeZone
//                                 ),
//                                 "h:mm a",
//                                 { timeZone }
//                               )}`}</div>
//                             ) : currentShift.lunch_start ? (
//                               <div>{`You Clocked Out For Lunch At ${formatTZ(
//                                 toZonedTime(
//                                   new Date(
//                                     `1970-01-01T${currentShift.lunch_start}`
//                                   ),
//                                   timeZone
//                                 ),
//                                 "h:mm a",
//                                 { timeZone }
//                               )}`}</div>
//                             ) : (
//                               <div>{`Please Start Your Lunch Break By ${formatTZ(
//                                 toZonedTime(
//                                   new Date(
//                                     new Date(
//                                       `${currentShift.event_date}T${currentShift.start_time}`
//                                     ).getTime() +
//                                       5 * 60 * 60 * 1000
//                                   ),
//                                   timeZone
//                                 ),
//                                 "h:mm a",
//                                 { timeZone }
//                               )}`}</div>
//                             )
//                           ) : (
//                             <div></div> // Handle case when currentShift is null or undefined
//                           )}
//                         </CardContent>
//                       </Card>

//                       <Card className="mt-4">
//                         <CardHeader className="flex justify-between items-center">
//                           <CardTitle className="text-2xl font-bold">
//                             End Of Shift
//                           </CardTitle>
//                         </CardHeader>
//                         <CardContent className="mx-auto">
//                           {currentShift?.end_time ? (
//                             <div>
//                               {`${formatTZ(
//                                 toZonedTime(
//                                   new Date(
//                                     `${currentShift.event_date}T${currentShift.end_time}`
//                                   ),
//                                   timeZone
//                                 ),
//                                 "PPP h:mm a",
//                                 { timeZone }
//                               )}`}
//                             </div>
//                           ) : (
//                             <div>Still on shift</div>
//                           )}
//                         </CardContent>
//                       </Card>

//                       <Card className="mt-4">
//                         <CardHeader className="flex justify-between items-center">
//                           <CardTitle className="text-2xl font-bold">
//                             Daily Summary
//                           </CardTitle>
//                         </CardHeader>
//                         <CardContent className="mx-auto">
//                           {currentShift ? (
//                             <div>
//                               {`You've logged ${calculateDurationWithLunch(
//                                 currentShift.start_time,
//                                 currentShift.end_time ||
//                                   format(new Date(), "HH:mm:ss"),
//                                 currentShift.lunch_start,
//                                 currentShift.lunch_end
//                               )} hours today!`}
//                             </div>
//                           ) : (
//                             <div>No shift data available</div>
//                           )}
//                         </CardContent>
//                       </Card>

//                       <Card className="mt-4">
//                         <CardHeader className="flex justify-between items-center">
//                           <CardTitle className="text-2xl font-bold">
//                             Weekly Summary
//                           </CardTitle>
//                         </CardHeader>
//                         <CardContent className="mx-auto">
//                           {weeklySummary !== null ? (
//                             <div>{weeklySummary} hours</div>
//                           ) : (
//                             <div>No data</div>
//                           )}
//                         </CardContent>
//                       </Card>

//                       <Card className="mt-4">
//                         <CardHeader className="flex justify-between items-center">
//                           <CardTitle className="text-2xl font-bold">
//                             Pay Period
//                             {payPeriodSummary !== null && payPeriodDates ? (
//                               <div>
//                                 {/* <div>{payPeriodSummary} hours</div> */}
//                                 <div className="text-sm text-gray-500">
//                                   {payPeriodDates.start} - {payPeriodDates.end}
//                                 </div>
//                               </div>
//                             ) : (
//                               <div>No data</div>
//                             )}
//                           </CardTitle>
//                         </CardHeader>
//                         <CardContent className="mx-auto">
//                           {payPeriodSummary !== null && payPeriodDates ? (
//                             <div>
//                               <div>{payPeriodSummary} hours</div>
//                               {/* <div className="text-sm text-gray-500">
//                                 {payPeriodDates.start} - {payPeriodDates.end}
//                               </div> */}
//                             </div>
//                           ) : (
//                             <div>No data</div>
//                           )}
//                         </CardContent>
//                       </Card>
//                     </div>
//                   </TabsContent>

//                   {/* Performance tab content */}
//                   <TabsContent value="performance">
//                     <h1 className="text-xl font-bold mb-2 ml-2">
//                       <TextGenerateEffect words={performancetitle} />
//                     </h1>
//                     <div className="grid p-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
//                       <Card className="mt-4">
//                         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                           <CardTitle className="text-2xl font-bold mb-6">
//                             Select A Date
//                           </CardTitle>
//                           {/* Add any icons or elements you want here */}
//                         </CardHeader>
//                         <CardContent>
//                           <Popover>
//                             <PopoverTrigger asChild>
//                               <Button
//                                 variant="outline"
//                                 className="w-full pl-3 text-left font-normal"
//                               >
//                                 {selectedDate ? (
//                                   format(selectedDate, "PPP")
//                                 ) : (
//                                   <span>Pick a date</span>
//                                 )}
//                                 <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
//                               </Button>
//                             </PopoverTrigger>
//                             <PopoverContent
//                               className="w-auto p-0"
//                               align="start"
//                             >
//                               <CustomCalendar
//                                 selectedDate={selectedDate ?? new Date()}
//                                 onDateChange={handleDateChange}
//                                 disabledDays={() => false}
//                               />
//                             </PopoverContent>
//                           </Popover>
//                         </CardContent>
//                       </Card>

//                       <Card className="mt-4">
//                         <CardHeader>
//                           <CardTitle className="text-2xl font-bold">
//                             Total # Of DROS
//                           </CardTitle>
//                         </CardHeader>
//                         <CardContent className="p-4">
//                           <div className="text-left">
//                             <DataTable
//                               columns={[
//                                 { Header: "Total DROS", accessor: "TotalDros" },
//                               ]}
//                               data={summaryData}
//                             />
//                           </div>
//                         </CardContent>
//                       </Card>
//                       <Card className="mt-4">
//                         <CardHeader>
//                           <CardTitle className="text-2xl font-bold">
//                             Points Deducted
//                           </CardTitle>
//                         </CardHeader>
//                         <CardContent className="p-4">
//                           <div className="text-left">
//                             <DataTable
//                               columns={[
//                                 {
//                                   Header: "Points Deducted",
//                                   accessor: "PointsDeducted",
//                                 },
//                               ]}
//                               data={summaryData}
//                             />
//                           </div>
//                         </CardContent>
//                       </Card>
//                       <Card className="mt-4">
//                         <CardHeader>
//                           <CardTitle className="text-2xl font-bold">
//                             Current Points
//                           </CardTitle>
//                         </CardHeader>
//                         <CardContent className="p-4">
//                           <div className="text-left">
//                             <DataTable
//                               columns={[
//                                 {
//                                   Header: "Total Points",
//                                   accessor: "TotalPoints",
//                                 },
//                               ]}
//                               data={summaryData}
//                             />
//                           </div>
//                         </CardContent>
//                       </Card>
//                     </div>

//                     <Card>
//                       <CardContent>
//                         <table className="w-full">
//                           <thead>
//                             <tr>
//                               <th className="py-2 w-36 text-left">DROS #</th>
//                               {/* <th className="py-2 w-24 text-left">Sales Rep</th> */}
//                               {/* <th className="py-2 w-24 text-left">Audit Type</th> */}
//                               <th className="py-2 w-32 text-left">
//                                 Trans Date
//                               </th>
//                               {/* <th className="py-2 w-32 text-left">Audit Date</th> */}
//                               <th className="py-2 w-32 text-left">Location</th>
//                               <th className="py-2 w-48 text-left">Details</th>
//                               <th className="py-2 w-64 text-left">Notes</th>
//                               <th className="py-2 w-12 text-left">
//                                 Cancelled?
//                               </th>
//                             </tr>
//                           </thead>
//                           <tbody>
//                             {audits.map((audit, index) => (
//                               <tr key={index} className="border-t">
//                                 <td className="py-2 w-36">
//                                   {audit.dros_number}
//                                 </td>
//                                 {/* <td className="py-2 w-24">{audit.salesreps}</td> */}
//                                 {/* <td className="py-2 w-24">{audit.audit_type}</td> */}
//                                 <td className="py-2 w-30">
//                                   {audit.trans_date}
//                                 </td>
//                                 {/* <td className="py-2 w-30">{audit.audit_date}</td> */}
//                                 <td className="py-2 w-32">
//                                   {audit.error_location}
//                                 </td>
//                                 <td className="py-2 w-48">
//                                   {audit.error_details}
//                                 </td>
//                                 <td className="py-2 w-64">
//                                   {audit.error_notes}
//                                 </td>
//                                 <td className="py-2 w-12">
//                                   {audit.dros_cancel}
//                                 </td>
//                               </tr>
//                             ))}
//                           </tbody>
//                         </table>
//                       </CardContent>
//                     </Card>
//                   </TabsContent>

//                   {/* Forms tab content */}
//                   <TabsContent value="forms">
//                     <h1 className="text-xl font-bold mb-2 ml-2">
//                       <TextGenerateEffect words={formtitle} />
//                     </h1>
//                     <div className="grid p-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
//                       <Card className="mt-4">
//                         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                           <CardTitle className="text-2xl font-bold">
//                             Submit Points
//                           </CardTitle>
//                         </CardHeader>
//                         <CardContent className="p-4">
//                           <Popover>
//                             <PopoverTrigger asChild>
//                               <Button
//                                 variant="outline"
//                                 className="w-full text-left font-normal"
//                               >
//                                 Submit Points Form
//                               </Button>
//                             </PopoverTrigger>
//                             <PopoverContent
//                               className="w-auto p-2"
//                               align="start"
//                             >
//                               <PointsForm /> {/* Render the PointsComponent */}
//                             </PopoverContent>
//                           </Popover>
//                         </CardContent>
//                       </Card>

//                       <Card className="mt-4">
//                         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                           <CardTitle className="text-2xl font-bold">
//                             Submit A Suggestion
//                           </CardTitle>
//                         </CardHeader>
//                         <CardContent className="p-4">
//                           <Popover>
//                             <PopoverTrigger asChild>
//                               <Button
//                                 variant="outline"
//                                 className="w-full text-left font-normal"
//                               >
//                                 Submit Suggestion Form
//                               </Button>
//                             </PopoverTrigger>
//                             <PopoverContent
//                               className="w-auto p-2"
//                               align="start"
//                             >
//                               <SuggestionForm
//                                 employeeName={employee?.name || ""}
//                                 employeeContactInfo={
//                                   employee?.contact_info || ""
//                                 }
//                               />
//                             </PopoverContent>
//                           </Popover>
//                         </CardContent>
//                       </Card>
//                     </div>
//                   </TabsContent>

//                   {/* Review tab content */}
//                   <TabsContent value="reviews">
//                     <h1 className="text-xl font-bold mb-2 ml-2">
//                       <TextGenerateEffect words="Your Reviews" />
//                     </h1>
//                     <div className="grid p-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
//                       {reviews.map((review) => (
//                         <Card key={review.id} className="mt-4">
//                           <CardHeader className="flex flex-col items-start justify-between space-y-2 pb-2">
//                             <CardTitle className="text-2xl font-bold">
//                               {review.review_quarter} {review.review_year}
//                             </CardTitle>
//                             <CardDescription className="text-xs text-gray-500 dark:text-gray-400">
//                               - {review.created_by} on{" "}
//                               {new Date(review.created_at).toLocaleDateString()}
//                             </CardDescription>
//                           </CardHeader>
//                           <CardContent className="p-4">
//                             <Button
//                               variant="outline"
//                               className="w-full text-left font-normal"
//                               onClick={() => handleViewReview(review)}
//                             >
//                               View Review
//                             </Button>
//                           </CardContent>
//                         </Card>
//                       ))}
//                     </div>

//                     <Dialog
//                       open={viewReviewDialog}
//                       onOpenChange={setViewReviewDialog}
//                     >
//                       <DialogOverlay className="fixed inset-0 z-50" />
//                       <DialogContent className="fixed inset-0 flex items-center justify-center mb-4 bg-white dark:bg-black z-50 view-review-dialog">
//                         <div className="bg-white dark:bg-black p-6 rounded-lg shadow-lg max-w-3xl w-full space-y-4 overflow-y-auto max-h-screen">
//                           <DialogTitle className="font-size: 1.35rem font-bold">
//                             Employee Review
//                           </DialogTitle>
//                           <DialogDescription>
//                             <div className="grid gap-1.5 mb-2">
//                               <Label className="view-label"></Label>
//                               <p>{currentReview?.review_quarter}</p>
//                             </div>
//                             <div className="grid gap-1.5 mb-2">
//                               <Label className="text-md font-bold">Year</Label>
//                               <p>{currentReview?.review_year}</p>
//                             </div>
//                             <div className="grid gap-1.5 mb-2">
//                               <Label className="text-md font-bold">
//                                 Overview of Performance
//                               </Label>
//                               <p>{currentReview?.overview_performance}</p>
//                             </div>
//                             <div className="grid gap-1.5 mb-2">
//                               <Label className="text-md font-bold">
//                                 Achievements and Contributions
//                               </Label>
//                               <ul className="list-disc pl-5">
//                                 {currentReview?.achievements_contributions.map(
//                                   (achievement, index) => (
//                                     <li key={index}>{achievement}</li>
//                                   )
//                                 )}
//                               </ul>
//                             </div>
//                             <div className="grid gap-1.5 mb-2">
//                               <Label className="text-md font-bold">
//                                 Attendance and Reliability
//                               </Label>
//                               <ul className="list-disc pl-5">
//                                 {currentReview?.attendance_reliability.map(
//                                   (attendance, index) => (
//                                     <li key={index}>{attendance}</li>
//                                   )
//                                 )}
//                               </ul>
//                             </div>
//                             <div className="grid gap-1.5 mb-2">
//                               <Label className="text-md font-bold">
//                                 Quality of Work
//                               </Label>
//                               <ul className="list-disc pl-5">
//                                 {currentReview?.quality_work.map(
//                                   (quality, index) => (
//                                     <li key={index}>{quality}</li>
//                                   )
//                                 )}
//                               </ul>
//                             </div>
//                             <div className="grid gap-1.5 mb-2">
//                               <Label className="text-md font-bold">
//                                 Communication & Collaboration
//                               </Label>
//                               <ul className="list-disc pl-5">
//                                 {currentReview?.communication_collaboration.map(
//                                   (communication, index) => (
//                                     <li key={index}>{communication}</li>
//                                   )
//                                 )}
//                               </ul>
//                             </div>
//                             <div className="grid gap-1.5 mb-2">
//                               <Label className="text-md font-bold">
//                                 Strengths & Accomplishments
//                               </Label>
//                               <ul className="list-disc pl-5">
//                                 {currentReview?.strengths_accomplishments.map(
//                                   (strength, index) => (
//                                     <li key={index}>{strength}</li>
//                                   )
//                                 )}
//                               </ul>
//                             </div>
//                             <div className="grid gap-1.5 mb-2">
//                               <Label className="text-md font-bold">
//                                 Areas for Growth and Development
//                               </Label>
//                               <ul className="list-disc pl-5">
//                                 {currentReview?.areas_growth.map(
//                                   (area, index) => (
//                                     <li key={index}>{area}</li>
//                                   )
//                                 )}
//                               </ul>
//                             </div>
//                             <div className="grid gap-1.5 mb-2">
//                               <Label className="text-md font-bold">
//                                 Recognition
//                               </Label>
//                               <ul className="list-disc pl-5">
//                                 {currentReview?.recognition.map(
//                                   (rec, index) => (
//                                     <li key={index}>{rec}</li>
//                                   )
//                                 )}
//                               </ul>
//                             </div>
//                             <div className="flex justify-end mt-2 space-x-2">
//                               <Button
//                                 variant="linkHover1"
//                                 onClick={() => setViewReviewDialog(false)}
//                               >
//                                 Close
//                               </Button>
//                               {/* <Button
//                           variant="linkHover1"
//                           onClick={() => window.print()}
//                         >
//                           Print
//                         </Button> */}
//                             </div>
//                           </DialogDescription>
//                         </div>
//                       </DialogContent>
//                     </Dialog>
//                   </TabsContent>

//                   {/* Manage Profile */}
//                   <TabsContent value="profile">
//                     {/* <h1 className="text-xl font-bold mb-2 ml-2">
//                       <TextGenerateEffect words={"Manage Your Profile"} />
//                     </h1> */}
//                     <div className="grid p-2 gap-2 md:grid-cols-1 lg:grid-cols-1">
//                       <Card className="mt-4">
//                         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                           <CardTitle className="text-2xl font-bold">
//                             Manage Your Profile
//                           </CardTitle>
//                         </CardHeader>
//                         <CardContent className="p-4">
//                           <form onSubmit={handleSubmitProfile(onSubmit)}>
//                             <div className="p-4 rounded-b-lg space-y-6">
//                               {[
//                                 { label: "First Name", id: "name" },
//                                 { label: "Last Name", id: "last_name" },
//                                 { label: "Phone Number", id: "phone_number" },
//                                 {
//                                   label: "Street Address",
//                                   id: "street_address",
//                                 },
//                                 { label: "City", id: "city" },
//                                 { label: "State", id: "state" },
//                                 { label: "ZIP Code", id: "zip" },
//                               ].map((field) => (
//                                 <div key={field.id} className="grid gap-2">
//                                   <div className="flex items-center justify-between">
//                                     <div className="w-full">
//                                       <Label htmlFor={field.id}>
//                                         {field.label}
//                                       </Label>
//                                       <Input
//                                         id={field.id}
//                                         {...register(
//                                           field.id as keyof EmployeeProfileData
//                                         )}
//                                         className="block w-full mt-1 p-2 border rounded"
//                                       />
//                                     </div>
//                                   </div>
//                                   <Separator />
//                                 </div>
//                               ))}
//                               <div className="flex justify-end">
//                                 <Button variant="linkHover1" type="submit">
//                                   Save Changes
//                                 </Button>
//                               </div>
//                             </div>
//                           </form>
//                         </CardContent>
//                       </Card>
//                     </div>
//                   </TabsContent>
//                 </Suspense>
//               </main>
//               <ScrollBar orientation="vertical" />
//             </ScrollArea>
//           </Tabs>
//         </Card>
//       </div>
//     </RoleBasedWrapper>
//   );
// };

// export default EmployeeProfilePage;
