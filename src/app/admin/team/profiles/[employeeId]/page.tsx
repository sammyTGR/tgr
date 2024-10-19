// admin\team\profiles\[employeeId]\page.tsx
"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation"; // Correct import
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import DOMPurify from "isomorphic-dompurify";
import {
  Pencil1Icon,
  TrashIcon,
  PlusIcon,
  CalendarIcon,
} from "@radix-ui/react-icons";
import { supabase } from "@/utils/supabase/client";
import { useRole } from "@/context/RoleContext";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import Link from "next/link";
import { CustomCalendar } from "@/components/ui/calendar";
import { DataTableProfile } from "../../../audits/contest/data-table-profile";
import { RenderDropdown } from "../../../audits/contest/dropdown";
import { PostgrestSingleResponse } from "@supabase/supabase-js";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogOverlay,
  DialogClose,
} from "@radix-ui/react-dialog";
import classNames from "classnames";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CustomDataTable } from "@/app/admin/schedules/CustomDataTable"; // Correct import for the DataTable
import { columns as scheduleColumns } from "@/app/admin/schedules/columns";
import {
  columns as originalColumns,
  ColumnDef,
  ScheduleData,
} from "@/app/admin/schedules/columns";
import { format, parseISO } from "date-fns";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import styles from "./profiles.module.css";
import SalesDataTableEmployee from "../../../reports/sales/sales-data-table-employee";
import PerformanceBarChart from "@/components/PerformanceBarChart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toZonedTime, format as formatTZ, formatInTimeZone } from "date-fns-tz";
import { SortingState } from "@tanstack/react-table";
interface Note {
  id: number;
  profile_employee_id: number;
  employee_id: number;
  note: string;
  type: string;
  created_at: string;
  created_by: string;
  reviewed?: boolean;
  reviewed_by?: string;
  reviewed_at?: string;
}

interface Absence {
  id: number;
  schedule_date: string;
  status: string;
  created_by: string;
  created_at: string;
  employee_id: number;
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

interface Employee {
  lanid: string;
}

interface SalesData {
  id: number;
  Lanid: string;
  subcategory_label: string;
  dros_cancel: string | null;
  // other fields
}

interface AuditInput {
  id: string;
  salesreps: string;
  error_location: string;
  audit_date: string; // Ensure this is included
  dros_cancel: string | null;
  // other fields
}

interface PointsCalculation {
  category: string;
  error_location: string;
  points_deducted: number;
}

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

interface SickTimeReport {
  employee_id: number;
  name: string; // Change this from employee_name to name
  available_sick_time: number;
  used_sick_time: number;
  used_dates: string[];
}

interface CalendarEvent {
  day_of_week: string;
  start_time: string | null;
  end_time: string | null;
  schedule_date: string;
  status?: string;
  employee_id: number; // Ensure this is part of the event
}

interface EmployeeCalendar {
  employee_id: number; // Ensure this is part of the employee
  name: string;
  events: CalendarEvent[];
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

const timezone = "America/Los_Angeles";

const EmployeeProfile = () => {
  const params = useParams()!;
  const employeeIdParam = params.employeeId;

  const employeeId = Array.isArray(employeeIdParam)
    ? parseInt(employeeIdParam[0], 10)
    : parseInt(employeeIdParam, 10);

  const [activeTab, setActiveTab] = useState("daily_briefing");
  const [notes, setNotes] = useState<Note[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [newNote, setNewNote] = useState("");
  const [newReview, setNewReview] = useState("");
  const [newAbsence, setNewAbsence] = useState("");
  const [newGrowth, setNewGrowth] = useState("");
  const [newDailyBriefing, setNewDailyBriefing] = useState("");
  const [employee, setEmployee] = useState<any>(null);
  const { user } = useRole();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedLanid, setSelectedLanid] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<Date | undefined>(
    undefined
  );
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [auditData, setAuditData] = useState<AuditInput[]>([]);
  const [pointsCalculation, setPointsCalculation] = useState<
    PointsCalculation[]
  >([]);
  const [totalPoints, setTotalPoints] = useState<number>(300);
  const [summaryData, setSummaryData] = useState<any[]>([]);
  const [showAllEmployees, setShowAllEmployees] = useState<boolean>(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewQuarter, setReviewQuarter] = useState("");
  const [reviewYear, setReviewYear] = useState(new Date().getFullYear());
  const [overviewPerformance, setOverviewPerformance] = useState("");
  const [achievementsContributions, setAchievementsContributions] = useState([
    "",
  ]);
  const [attendanceReliability, setAttendanceReliability] = useState([""]);
  const [qualityWork, setQualityWork] = useState([""]);
  const [communicationCollaboration, setCommunicationCollaboration] = useState([
    "",
  ]);
  const [strengthsAccomplishments, setStrengthsAccomplishments] = useState([
    "",
  ]);
  const [areasGrowth, setAreasGrowth] = useState([""]);
  const [recognition, setRecognition] = useState([""]);
  const [viewReviewDialog, setViewReviewDialog] = useState(false);
  const [currentReview, setCurrentReview] = useState<Review | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [availableSickTime, setAvailableSickTime] = useState<number | null>(
    null
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sickTimeData, setSickTimeData] = useState<SickTimeReport[]>([]);
  const [selectedAbsenceReason, setSelectedAbsenceReason] = useState<
    string | null
  >(null);
  const [customAbsenceReason, setCustomAbsenceReason] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [customStatus, setCustomStatus] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<CalendarEvent | null>(null);
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [weekDates, setWeekDates] = useState<{ [key: string]: string }>({});
  const [referenceSchedules, setReferenceSchedules] = useState<any[]>([]);
  const [actualSchedules, setActualSchedules] = useState<any[]>([]);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "day_of_week", desc: false },
  ]);
  const [data, setData] = useState<{
    calendarData: EmployeeCalendar[];
    employeeNames: string[];
  }>({
    calendarData: [],
    employeeNames: [],
  });

  const combinedSchedules = useMemo(() => {
    const timeZone = "America/Los_Angeles"; // Adjust this to your desired time zone
    const combined = [...referenceSchedules, ...actualSchedules]
      .filter((schedule) => schedule.employee_id === employeeId)
      .map((schedule) => {
        if (!schedule.schedule_date) {
          console.warn("Schedule missing schedule_date:", schedule);
          return schedule;
        }

        try {
          const scheduleDate = parseISO(schedule.schedule_date);
          const dayOfWeek = format(scheduleDate, "EEEE");

          // Format start_time and end_time as h:mm a
          const formattedStartTime = schedule.start_time
            ? formatInTimeZone(
                toZonedTime(
                  parseISO(`${schedule.schedule_date}T${schedule.start_time}`),
                  timeZone
                ),
                timeZone,
                "h:mm a"
              )
            : schedule.start_time;
          const formattedEndTime = schedule.end_time
            ? formatInTimeZone(
                toZonedTime(
                  parseISO(`${schedule.schedule_date}T${schedule.end_time}`),
                  timeZone
                ),
                timeZone,
                "h:mm a"
              )
            : schedule.end_time;

          console.log(
            `Schedule date: ${schedule.schedule_date}, Day of week: ${dayOfWeek}, Start time: ${formattedStartTime}, End time: ${formattedEndTime}`
          );

          return {
            ...schedule,
            day_of_week: dayOfWeek,
            start_time: formattedStartTime,
            end_time: formattedEndTime,
          };
        } catch (error) {
          console.error("Error processing schedule:", schedule, error);
          return schedule;
        }
      });

    console.log("Combined schedules for employee:", combined);
    return combined;
  }, [referenceSchedules, actualSchedules, employeeId]);

  const filteredColumns: ColumnDef<ScheduleData>[] = originalColumns.filter(
    (column) =>
      !["employee_name", "event_date", "employee_id"].includes(
        (column as any).accessorKey
      )
  );

  const fetchReferenceSchedules = useCallback(async () => {
    const { data, error } = await supabase
      .from("reference_schedules")
      .select("*")
      .eq("employee_id", employeeId);

    if (error) {
      console.error("Error fetching reference schedules:", error);
    } else {
      setReferenceSchedules(data || []);
    }
  }, [employeeId]);

  const fetchActualSchedules = useCallback(async () => {
    const { data, error } = await supabase
      .from("schedules")
      .select("*")
      .eq("employee_id", employeeId)
      .or("status.eq.scheduled,status.eq.added_day");

    if (error) {
      console.error("Error fetching actual schedules:", error);
    } else {
      setActualSchedules(data || []);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchReferenceSchedules();
    fetchActualSchedules();
  }, [fetchReferenceSchedules, fetchActualSchedules]);

  const fetchCalendarData = useCallback(async (): Promise<
    EmployeeCalendar[]
  > => {
    const timeZone = "America/Los_Angeles";
    const startOfWeek = toZonedTime(getStartOfWeek(currentDate), timeZone);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    try {
      const { data, error } = await supabase
        .from("schedules")
        .select(
          `
          schedule_date,
          start_time,
          end_time,
          day_of_week,
          status,
          employee_id,
          employees:employee_id (name)
        `
        )
        .gte("schedule_date", formatTZ(startOfWeek, "yyyy-MM-dd", { timeZone }))
        .lte("schedule_date", formatTZ(endOfWeek, "yyyy-MM-dd", { timeZone }));

      if (error) {
        throw error;
      }

      const groupedData: { [key: number]: EmployeeCalendar } = {};

      data.forEach((item: any) => {
        if (!groupedData[item.employee_id]) {
          groupedData[item.employee_id] = {
            employee_id: item.employee_id,
            name: item.employees.name,
            events: [],
          };
        }

        const timeZone = "America/Los_Angeles";
        groupedData[item.employee_id].events.push({
          day_of_week: item.day_of_week,
          start_time: item.start_time ? item.start_time : null,
          end_time: item.end_time ? item.end_time : null,
          schedule_date: item.schedule_date,
          status: item.status,
          employee_id: item.employee_id,
        });
      });

      return Object.values(groupedData);
    } catch (error) {
      //console.("Failed to fetch calendar data:", (error as Error).message);
      return [];
    }
  }, [currentDate]);

  useEffect(() => {
    const startOfWeek = getStartOfWeek(currentDate);
    const weekDatesTemp: { [key: string]: string } = {};
    daysOfWeek.forEach((day, index) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + index);
      weekDatesTemp[day] = `${date.getMonth() + 1}/${date.getDate()}`;
    });
    setWeekDates(weekDatesTemp);
  }, [currentDate]);

  const getStartOfWeek = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day;
    return new Date(start.setDate(diff));
  };

  const updateScheduleStatus = async (
    employee_id: number,
    schedule_date: string,
    status: string
  ) => {
    try {
      const formattedDate = new Date(schedule_date).toISOString().split("T")[0];
      const response = await fetch("/api/update_schedule_status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employee_id,
          schedule_date: formattedDate,
          status,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchCalendarData();
    } catch (error) {
      console.error(
        "Failed to update schedule status:",
        (error as Error).message
      );
    }
  };

  const handleCustomStatusSubmit = () => {
    if (currentEvent) {
      updateScheduleStatus(
        currentEvent.employee_id,
        currentEvent.schedule_date,
        `Custom:${customStatus}`
      );
      setDialogOpen(false);
      setCustomStatus("");
    }
  };

  const handleAddAbsence = async () => {
    if (!selectedDate || (!selectedAbsenceReason && !customAbsenceReason))
      return;

    const status =
      selectedAbsenceReason === "custom"
        ? `Custom:${customAbsenceReason}`
        : selectedAbsenceReason;

    try {
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      await updateScheduleStatus(employeeId, formattedDate, status as string);

      // Refresh the absences list
      await fetchAbsences();

      // Reset the form
      setSelectedDate(null);
      setSelectedAbsenceReason(null);
      setCustomAbsenceReason("");
    } catch (error) {
      //console.("Failed to add absence:", error);
    }
  };

  useEffect(() => {
    const fetchSickTimeData = async () => {
      const { data, error } = await supabase.rpc(
        "get_all_employee_sick_time_usage"
      );
      if (error) {
        //console.("Error fetching sick time data:", error.message);
      } else {
        // console.log("Fetched Sick Time Data:", data);
        setSickTimeData(data as SickTimeReport[]);
      }
    };

    fetchSickTimeData();
  }, []);

  const fetchAvailableSickTime = async (employeeId: number) => {
    try {
      const { data, error } = await supabase.rpc(
        "calculate_available_sick_time",
        { p_emp_id: employeeId }
      );

      if (error) throw error;

      return data;
    } catch (error) {
      console.error(
        "Error fetching available sick time:",
        (error as Error).message
      );
      return null;
    }
  };

  useEffect(() => {
    if (employeeId) {
      fetchAvailableSickTime(employeeId).then((time) => {
        if (time !== null) {
          setAvailableSickTime(time);
        }
      });
    }
  }, [employeeId]);

  const handleViewReview = (review: Review) => {
    setCurrentReview(review);
    setViewReviewDialog(true);
  };

  const handleEditReview = async (id: number) => {
    const { data, error } = await supabase
      .from("employee_quarterly_reviews")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      //console.("Error fetching review:", error);
      return;
    }

    if (data) {
      setReviewQuarter(data.review_quarter);
      setReviewYear(data.review_year);
      setOverviewPerformance(data.overview_performance);
      setAchievementsContributions(data.achievements_contributions || [""]);
      setAttendanceReliability(data.attendance_reliability || [""]);
      setQualityWork(data.quality_work || [""]);
      setCommunicationCollaboration(data.communication_collaboration || [""]);
      setStrengthsAccomplishments(data.strengths_accomplishments || [""]);
      setAreasGrowth(data.areas_growth || [""]);
      setRecognition(data.recognition || [""]);
      setCurrentReview(data); // <-- Add this line
      setEditMode(true);
      setShowReviewDialog(true);
    }
  };

  const handleDeleteReview = async (id: number) => {
    const { error } = await supabase
      .from("employee_quarterly_reviews")
      .delete()
      .eq("id", id);

    if (error) {
      //console.("Error deleting review:", error);
    } else {
      setReviews((prevReviews) =>
        prevReviews.filter((review) => review.id !== id)
      );
    }
  };

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date || null);
    fetchAndCalculateSummary(date || null);
  };

  const fetchAndCalculateSummary = async (date: Date | null) => {
    if (!date || !employee) return;

    const startDate = new Date(date.getFullYear(), date.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    try {
      const { data: salesData, error: salesError } = await supabase
        .from("sales_data")
        .select("*")
        .eq("Lanid", employee.lanid)
        .gte("Date", startDate)
        .lte("Date", endDate)
        .not("subcategory_label", "is", null)
        .not("subcategory_label", "eq", "");

      const { data: auditData, error: auditError } = await supabase
        .from("Auditsinput")
        .select("*")
        .eq("salesreps", employee.lanid)
        .gte("audit_date", startDate)
        .lte("audit_date", endDate);

      if (salesError || auditError) {
        //console.(salesError || auditError);
        return;
      }

      const lanids = [employee.lanid];
      let summary = lanids.map((lanid) => {
        const employeeSalesData = salesData.filter(
          (sale) => sale.Lanid === lanid
        );
        const employeeAuditData = auditData.filter(
          (audit) => audit.salesreps === lanid
        );

        const totalDros = employeeSalesData.filter(
          (sale) => sale.subcategory_label
        ).length;
        let pointsDeducted = 0;

        employeeSalesData.forEach((sale) => {
          if (sale.dros_cancel === "Yes") {
            pointsDeducted += 5;
          }
        });

        employeeAuditData.forEach((audit) => {
          const auditDate = new Date(audit.audit_date);
          if (auditDate <= date) {
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
          Lanid: lanid,
          TotalDros: totalDros,
          PointsDeducted: pointsDeducted,
          TotalPoints: totalPoints,
        };
      });

      summary.sort((a, b) => b.TotalPoints - a.TotalPoints);
      setSummaryData(summary);
    } catch (error) {
      //console.("Error fetching or calculating summary data:", error);
    }
  };

  const fetchEmployeeNameByUserUUID = async (
    userUUID: string
  ): Promise<string | null> => {
    const { data, error } = await supabase
      .from("employees")
      .select("name")
      .eq("user_uuid", userUUID)
      .single();

    if (error) {
      //console.("Error fetching employee name:", error);
      return null;
    }
    return data?.name || null;
  };

  useEffect(() => {
    if (user && employeeId) {
      const fetchData = async () => {
        try {
          await fetchEmployeeData();
          await fetchNotes();
          await fetchReviews();
          await fetchAbsences();
          subscribeToNoteChanges();

          const scheduleSubscription = supabase
            .channel("schedules-changes")
            .on(
              "postgres_changes",
              { event: "*", schema: "public", table: "schedules" },
              async (payload: { new: any; old: any; eventType: string }) => {
                try {
                  const newRecord = payload.new;

                  if (
                    newRecord.employee_id === employeeId &&
                    (["called_out", "left_early"].includes(newRecord.status) ||
                      newRecord.status.toLowerCase().includes("late"))
                  ) {
                    const status =
                      newRecord.status === "called_out"
                        ? "Called Out"
                        : newRecord.status === "left_early"
                        ? "Left Early"
                        : newRecord.status.replace(/^Custom:\s*/i, "").trim();

                    const createdByName = await fetchEmployeeNameByUserUUID(
                      user.id
                    );
                    if (!createdByName) return;

                    const { error } = await supabase
                      .from("employee_absences")
                      .insert([
                        {
                          employee_id: newRecord.employee_id,
                          schedule_date: newRecord.schedule_date,
                          status: status,
                          created_by: createdByName,
                        },
                      ]);

                    if (error) {
                      throw new Error(
                        `Error inserting absence: ${error.message}`
                      );
                    } else {
                      await fetchAbsences();
                    }
                  }
                } catch (error) {
                  console.error(
                    "Error in schedule subscription handler:",
                    error
                  );
                }
              }
            )
            .subscribe();

          return () => {
            supabase.removeChannel(scheduleSubscription);
          };
        } catch (error) {
          console.error("Error in useEffect:", error);
        }
      };

      fetchData();
    }
  }, [user, employeeId]);

  useEffect(() => {
    if (employee && employee.lanid) {
      fetchAudits(employee.lanid);
    }
  }, [employee]);

  useEffect(() => {
    const fetchEmployeeName = async (
      user_uuid: string
    ): Promise<string | null> => {
      const { data, error } = await supabase
        .from("employees")
        .select("name")
        .eq("user_uuid", user_uuid)
        .single();

      if (error) {
        //console.("Error fetching employee name:", error);
        return null;
      }
      return data?.name || null;
    };

    const fetchPointsCalculation = async () => {
      const { data, error } = await supabase
        .from("points_calculation")
        .select("*");
      if (error) {
        //console.(error);
      } else {
        setPointsCalculation(data);
      }
    };

    fetchPointsCalculation();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (selectedMonth && employee) {
        const startDate = new Date(
          selectedMonth.getFullYear(),
          selectedMonth.getMonth(),
          1
        )
          .toISOString()
          .split("T")[0];
        const endDate = new Date(
          selectedMonth.getFullYear(),
          selectedMonth.getMonth() + 1,
          0
        )
          .toISOString()
          .split("T")[0];

        const { data: salesData, error: salesError } = await supabase
          .from("sales_data")
          .select("*")
          .eq("Lanid", employee.lanid)
          .gte("Date", startDate)
          .lte("Date", endDate)
          .not("subcategory_label", "is", null)
          .not("subcategory_label", "eq", "");

        const { data: auditData, error: auditError } = await supabase
          .from("Auditsinput")
          .select("*")
          .eq("salesreps", employee.lanid)
          .gte("audit_date", startDate)
          .lte("audit_date", endDate);

        if (salesError || auditError) {
          //console.(salesError || auditError);
        } else {
          setSalesData(salesData);
          setAuditData(auditData);
          calculateSummary(salesData, auditData, selectedMonth, [
            employee.lanid,
          ]);
        }
      }
    };

    fetchData();

    const salesSubscription = supabase
      .channel("custom-all-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sales_data" },
        (payload) => {
          fetchData();
        }
      )
      .subscribe();

    const auditsSubscription = supabase
      .channel("custom-all-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Auditsinput" },
        (payload) => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(salesSubscription);
      supabase.removeChannel(auditsSubscription);
    };
  }, [employee, selectedMonth, pointsCalculation]);

  const fetchEmployeeData = async () => {
    if (!employeeId) return;

    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("employee_id", employeeId)
      .single();

    if (error) {
      //console.("Error fetching employee data:", error.message);
    } else {
      setEmployee(data);
    }
  };

  const fetchEmployeeName = async (
    user_uuid: string
  ): Promise<string | null> => {
    const { data, error } = await supabase
      .from("employees")
      .select("name")
      .eq("user_uuid", user_uuid)
      .single();

    if (error) {
      //console.("Error fetching employee name:", error);
      return null;
    }
    return data?.name || null;
  };

  const fetchNotes = async () => {
    if (!employeeId) return;

    const { data, error } = await supabase
      .from("employee_profile_notes")
      .select("*")
      .eq("profile_employee_id", employeeId);

    if (error) {
      //console.("Error fetching notes:", error);
    } else {
      setNotes(data as Note[]);
    }
  };

  const fetchReviews = async () => {
    if (!employeeId) return;

    const { data, error } = await supabase
      .from("employee_quarterly_reviews")
      .select("*")
      .eq("employee_id", employeeId);

    if (error) {
      //console.("Error fetching reviews:", error);
    } else {
      setReviews(data as Review[]);
    }
  };

  const fetchAbsences = async () => {
    if (!employeeId) return;

    const { data: absencesData, error: absencesError } = await supabase
      .from("employee_absences")
      .select("id, employee_id, schedule_date, status, created_by, created_at")
      .eq("employee_id", employeeId);

    if (absencesError) {
      //console.("Error fetching absences:", absencesError);
    } else {
      setAbsences(absencesData);
    }

    const { data: schedulesData, error: schedulesError } = await supabase
      .from("schedules")
      .select("schedule_date, status")
      .eq("employee_id", employeeId)
      .or("status.eq.called_out,status.eq.left_early,status.ilike.%late%");

    if (schedulesError) {
      //console.("Error fetching schedules:", schedulesError);
    } else {
      const formattedAbsences = schedulesData.map(
        (absence: { schedule_date: string; status: string }) => {
          let status = absence.status;
          if (status === "called_out") {
            status = "Called Out";
          } else if (status === "left_early") {
            status = "Left Early";
          } else if (status.toLowerCase().includes("late")) {
            status = status.replace(/^Custom:\s*/i, "").trim();
          }
          return {
            id: -1,
            employee_id: employeeId,
            schedule_date: absence.schedule_date,
            status: status,
            created_by: "System",
            created_at: new Date().toISOString(),
          };
        }
      );
      setAbsences((prevAbsences) => {
        const combinedAbsences = [...prevAbsences];
        const existingDates = new Set(
          prevAbsences.map((absence) => absence.schedule_date)
        );
        formattedAbsences.forEach((absence) => {
          if (!existingDates.has(absence.schedule_date)) {
            combinedAbsences.push(absence);
          }
        });
        return combinedAbsences;
      });
    }
  };

  const fetchAudits = async (lanid: string) => {
    const { data, error } = await supabase
      .from("Auditsinput")
      .select("*")
      .eq("salesreps", lanid)
      .order("audit_date", { ascending: false });

    if (error) {
      //console.("Error fetching audits:", error);
    } else {
      setAudits(data as Audit[]);
    }
  };

  const subscribeToNoteChanges = () => {
    if (!employeeId) return;

    const channel = supabase
      .channel("custom-all-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employee_profile_notes" },
        (payload) => {
          if (payload.new) {
            setNotes((prevNotes) => [...prevNotes, payload.new as Note]);
          } else if (payload.old) {
            setNotes((prevNotes) =>
              prevNotes.filter((note) => note.id !== (payload.old as Note).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleAddNote = async (type: string) => {
    let noteContent = "";
    switch (type) {
      case "notes":
        noteContent = newNote;
        break;
      case "reviews":
        noteContent = newReview;
        break;
      case "growth":
        noteContent = newGrowth;
        break;
      case "absence":
        noteContent = newAbsence;
        break;
      case "daily_briefing":
        noteContent = newDailyBriefing;
        break;
      default:
        return;
    }

    if (!employeeId || noteContent.trim() === "") return;

    const employeeName = await fetchEmployeeNameByUserUUID(user.id);
    if (!employeeName) return;

    const { data, error } = await supabase
      .from("employee_profile_notes")
      .insert([
        {
          profile_employee_id: employeeId,
          employee_id: parseInt(user.id, 10),
          note: noteContent,
          type,
          created_by: employeeName,
        },
      ])
      .select();

    if (error) {
      //console.("Error adding note:", error);
    } else if (data) {
      setNotes((prevNotes) => [data[0], ...prevNotes]);
      switch (type) {
        case "notes":
          setNewNote("");
          break;
        case "reviews":
          setNewReview("");
          break;
        case "growth":
          setNewGrowth("");
          break;
        case "absence":
          setNewAbsence("");
          setAbsences((prevAbsences) => [
            ...prevAbsences,
            {
              id: data[0].id,
              schedule_date: noteContent.split(" ")[0],
              status: noteContent.split(" ").slice(1).join(" "),
              created_by: data[0].created_by,
              created_at: data[0].created_at,
              employee_id: employeeId, // Add employee_id here
            },
          ]);
          break;
        case "daily_briefing":
          setNewDailyBriefing("");
          break;
      }
    }
  };

  const handleDeleteNote = async (id: number) => {
    const { error } = await supabase
      .from("employee_profile_notes")
      .delete()
      .eq("id", id);

    if (error) {
      //console.("Error deleting note:", error);
    } else {
      setNotes(notes.filter((note) => note.id !== id));
    }

    const { error: absenceError } = await supabase
      .from("employee_absences")
      .delete()
      .eq("id", id);

    if (absenceError) {
      //console.("Error deleting absence:", absenceError);
    } else {
      setAbsences(absences.filter((absence) => absence.id !== id));
    }
  };

  const handleEditNote = async (id: number, updatedNote: string | null) => {
    if (updatedNote === null || updatedNote.trim() === "") return;

    const sanitizedNote = DOMPurify.sanitize(updatedNote);

    const { error } = await supabase
      .from("employee_profile_notes")
      .update({ note: updatedNote })
      .eq("id", id);

    if (error) {
      //console.("Error updating note:", error);
    } else {
      setNotes(
        notes.map((note) =>
          note.id === id ? { ...note, note: updatedNote } : note
        )
      );
    }
  };

  const handleReviewNote = async (
    id: number,
    currentReviewedStatus: boolean
  ) => {
    const newReviewedStatus = !currentReviewedStatus;

    const { error } = await supabase
      .from("employee_profile_notes")
      .update({
        reviewed: newReviewedStatus,
        reviewed_by: newReviewedStatus ? user.name : null,
        reviewed_at: newReviewedStatus ? new Date().toISOString() : null,
      })
      .eq("id", id);

    if (error) {
      //console.("Error reviewing note:", error);
    } else {
      setNotes(
        notes.map((note) =>
          note.id === id
            ? {
                ...note,
                reviewed: newReviewedStatus,
                reviewed_by: newReviewedStatus ? user.name : null,
                reviewed_at: newReviewedStatus
                  ? new Date().toISOString()
                  : undefined,
              }
            : note
        )
      );
    }
  };

  const handleAddReviewClick = () => {
    resetReviewForm();
    setEditMode(false);
    setShowReviewDialog(true);
  };

  // Inside the handleAddReview function
  const handleAddReview = async () => {
    if (!employeeId) return;

    const employeeName = await fetchEmployeeNameByUserUUID(user.id);
    if (!employeeName) return;

    const reviewData = {
      employee_id: employeeId,
      review_quarter: reviewQuarter, // This will now accept longer text
      review_year: reviewYear,
      overview_performance: overviewPerformance,
      achievements_contributions: achievementsContributions,
      attendance_reliability: attendanceReliability,
      quality_work: qualityWork,
      communication_collaboration: communicationCollaboration,
      strengths_accomplishments: strengthsAccomplishments,
      areas_growth: areasGrowth,
      recognition: recognition,
      created_by: employeeName,
      published: false, // New field to indicate review is not published yet
    };

    if (editMode && currentReview) {
      // Update existing review
      const { data, error } = await supabase
        .from("employee_quarterly_reviews")
        .update(reviewData)
        .eq("id", currentReview.id)
        .select();

      if (error) {
        //console.("Error updating review:", error);
      } else if (data) {
        setReviews((prevReviews) =>
          prevReviews.map((review) =>
            review.id === currentReview.id ? data[0] : review
          )
        );
        setShowReviewDialog(false); // Close the dialog after update
        resetReviewForm();
      }
    } else {
      // Add new review
      const { data, error } = await supabase
        .from("employee_quarterly_reviews")
        .insert([reviewData])
        .select();

      if (error) {
        //console.("Error adding review:", error);
      } else if (data) {
        setReviews((prevReviews) => [data[0], ...prevReviews]);
        setShowReviewDialog(false); // Close the dialog after insert
        resetReviewForm();
      }
    }
  };

  // Add a function to handle publishing the review
  const handlePublishReview = async (id: number) => {
    const { data, error } = await supabase
      .from("employee_quarterly_reviews")
      .update({ published: true })
      .eq("id", id)
      .select();

    if (error) {
      //console.("Error publishing review:", error);
    } else if (data) {
      setReviews((prevReviews) =>
        prevReviews.map((review) =>
          review.id === id ? { ...review, published: true } : review
        )
      );
    }
  };

  const resetReviewForm = () => {
    setReviewQuarter("");
    setReviewYear(new Date().getFullYear());
    setOverviewPerformance("");
    setAchievementsContributions([""]);
    setAttendanceReliability([""]);
    setQualityWork([""]);
    setCommunicationCollaboration([""]);
    setStrengthsAccomplishments([""]);
    setAreasGrowth([""]);
    setRecognition([""]);
  };

  const calculateSummary = (
    salesData: SalesData[],
    auditData: AuditInput[],
    selectedMonth: Date,
    lanids: string[]
  ) => {
    let summary = lanids.map((lanid) => {
      const employeeSalesData = salesData.filter(
        (sale) => sale.Lanid === lanid
      );
      const employeeAuditData = auditData.filter(
        (audit) => audit.salesreps === lanid
      );

      const totalDros = employeeSalesData.filter(
        (sale) => sale.subcategory_label
      ).length;
      let pointsDeducted = 0;

      employeeSalesData.forEach((sale: SalesData) => {
        if (sale.dros_cancel === "Yes") {
          pointsDeducted += 5;
        }
      });

      employeeAuditData.forEach((audit: AuditInput) => {
        const auditDate = new Date(audit.audit_date);
        if (auditDate <= selectedMonth) {
          pointsCalculation.forEach((point: PointsCalculation) => {
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
        Lanid: lanid,
        TotalDros: totalDros,
        PointsDeducted: pointsDeducted,
        TotalPoints: totalPoints,
      };
    });

    summary.sort((a, b) => b.TotalPoints - a.TotalPoints);
    setSummaryData(summary);
  };

  if (!employee) return <div></div>;

  return (
    <RoleBasedWrapper allowedRoles={["admin", "super admin", "dev"]}>
      <div className="section w-full">
        <Card className="h-full max-w-6xl mx-auto my-12">
          <header className="bg-gray-100 dark:bg-muted px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <Avatar>
                <img
                  src={employee.avatar_url || "/Banner.png"}
                  alt="Employee Avatar"
                />
                <AvatarFallback>{employee.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-bold">{employee.name}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {employee.position}
                </p>
              </div>
              <div className="flex ml-auto">
                <Link href="/admin/dashboard">
                  <Button variant="linkHover1">Back To Profiles</Button>
                </Link>
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-auto">
            <Tabs
              defaultValue="daily_briefing"
              className="w-full"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList className="border-b border-gray-200 dark:border-gray-700">
                <TabsTrigger value="daily_briefing">Daily Briefing</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="absences">
                  Attendance & Schedules
                </TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="growth">Growth Tracking</TabsTrigger>
                <TabsTrigger value="sales">Sales</TabsTrigger>
                <TabsTrigger value="performance">Audits</TabsTrigger>
              </TabsList>
              <ScrollArea className="h-[calc(100vh-300px)]">
                <main
                  className={classNames(
                    "grid flex-1 items-start mx-auto my-4 mb-4 max-w-8xl gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 body",
                    styles.noScroll
                  )}
                >
                  <Suspense fallback="">
                    <TabsContent value="daily_briefing">
                      <div className="p-6 space-y-4">
                        <div className="grid gap-1.5">
                          <Label htmlFor="new-daily-briefing">
                            Add a new daily briefing
                          </Label>
                          <Textarea
                            id="new-daily-briefing"
                            value={newDailyBriefing}
                            onChange={(e) =>
                              setNewDailyBriefing(e.target.value)
                            }
                            placeholder="Type your daily briefing here..."
                            className="min-h-[100px]"
                          />
                          <Button
                            onClick={() => handleAddNote("daily_briefing")}
                          >
                            Add Daily Briefing
                          </Button>
                        </div>
                        <div className="grid gap-4">
                          {notes
                            .filter(
                              (note) =>
                                note.type === "daily_briefing" && !note.reviewed
                            )
                            .map((note) => (
                              <div
                                key={note.id}
                                className="flex justify-between items-start"
                              >
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={note.reviewed || false}
                                    onChange={() =>
                                      handleReviewNote(
                                        note.id,
                                        note.reviewed || false
                                      )
                                    }
                                  />
                                  <div>
                                    <div
                                      className="text-sm font-medium"
                                      style={{
                                        textDecoration: note.reviewed
                                          ? "line-through"
                                          : "none",
                                      }}
                                    >
                                      {note.note}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      - {note.created_by} on{" "}
                                      {new Date(
                                        note.created_at
                                      ).toLocaleDateString()}
                                    </div>
                                    {note.reviewed && note.reviewed_by && (
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        Reviewed by {note.reviewed_by} on{" "}
                                        {note.reviewed_at
                                          ? new Date(
                                              note.reviewed_at
                                            ).toLocaleDateString()
                                          : ""}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() =>
                                      handleEditNote(
                                        note.id,
                                        prompt(
                                          "Edit daily briefing:",
                                          note.note
                                        ) ?? note.note
                                      )
                                    }
                                  >
                                    <Pencil1Icon />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleDeleteNote(note.id)}
                                  >
                                    <TrashIcon />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          {notes
                            .filter(
                              (note) =>
                                note.type === "daily_briefing" && note.reviewed
                            )
                            .map((note) => (
                              <div
                                key={note.id}
                                className="flex justify-between items-start"
                              >
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={note.reviewed || false}
                                    onChange={() =>
                                      handleReviewNote(
                                        note.id,
                                        note.reviewed || false
                                      )
                                    }
                                  />
                                  <div>
                                    <div
                                      className="text-sm font-medium"
                                      style={{
                                        textDecoration: note.reviewed
                                          ? "line-through"
                                          : "none",
                                      }}
                                    >
                                      {note.note}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      - {note.created_by} on{" "}
                                      {new Date(
                                        note.created_at
                                      ).toLocaleDateString()}
                                    </div>
                                    {note.reviewed && note.reviewed_by && (
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        Reviewed by {note.reviewed_by} on{" "}
                                        {note.reviewed_at
                                          ? new Date(
                                              note.reviewed_at
                                            ).toLocaleDateString()
                                          : ""}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="linkHover1"
                                    size="icon"
                                    onClick={() =>
                                      handleEditNote(
                                        note.id,
                                        prompt(
                                          "Edit daily briefing:",
                                          note.note
                                        ) ?? note.note
                                      )
                                    }
                                  >
                                    <Pencil1Icon />
                                  </Button>
                                  <Button
                                    variant="linkHover1"
                                    size="icon"
                                    onClick={() => handleDeleteNote(note.id)}
                                  >
                                    <TrashIcon />
                                  </Button>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="notes">
                      <div className="p-6 space-y-4">
                        <div className="grid gap-1.5">
                          <Label htmlFor="new-note">Add a new note</Label>
                          <Textarea
                            id="new-note"
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Type your note here..."
                            className="min-h-[100px]"
                          />
                          <Button onClick={() => handleAddNote("notes")}>
                            Add Note
                          </Button>
                        </div>
                        <div className="grid gap-4">
                          {notes
                            .filter((note) => note.type === "notes")
                            .map((note) => (
                              <div
                                key={note.id}
                                className="flex justify-between items-start"
                              >
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={note.reviewed || false}
                                    onChange={() =>
                                      handleReviewNote(
                                        note.id,
                                        note.reviewed || false
                                      )
                                    }
                                  />
                                  <div>
                                    <div
                                      className="text-sm font-medium"
                                      style={{
                                        textDecoration: note.reviewed
                                          ? "line-through"
                                          : "none",
                                      }}
                                    >
                                      {note.note}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      - {note.created_by} on{" "}
                                      {new Date(
                                        note.created_at
                                      ).toLocaleDateString()}
                                    </div>
                                    {note.reviewed && note.reviewed_by && (
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        Reviewed by {note.reviewed_by} on{" "}
                                        {note.reviewed_at
                                          ? new Date(
                                              note.reviewed_at
                                            ).toLocaleDateString()
                                          : ""}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="linkHover1"
                                    size="icon"
                                    onClick={() =>
                                      handleEditNote(
                                        note.id,
                                        prompt("Edit note:", note.note) ??
                                          note.note
                                      )
                                    }
                                  >
                                    <Pencil1Icon />
                                  </Button>
                                  <Button
                                    variant="linkHover1"
                                    size="icon"
                                    onClick={() => handleDeleteNote(note.id)}
                                  >
                                    <TrashIcon />
                                  </Button>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="absences">
                      <div className="grid p-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                        <Card className="mt-2">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-2xl font-bold mb-6">
                              Select A Date
                            </CardTitle>
                            {/* Add any icons or elements you want here */}
                          </CardHeader>
                          <CardContent>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full pl-3 text-left font-normal"
                                >
                                  {selectedDate ? (
                                    format(selectedDate, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <CustomCalendar
                                  selectedDate={selectedDate ?? new Date()}
                                  onDateChange={handleDateChange}
                                  disabledDays={() => false}
                                />
                              </PopoverContent>
                            </Popover>
                          </CardContent>
                        </Card>

                        {/* Absence Card */}
                        <Card className="mt-2">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-2xl font-bold mb-6">
                              Select A Reason
                            </CardTitle>
                            {/* Add any icons or elements you want here */}
                          </CardHeader>
                          <CardContent>
                            <Select
                              onValueChange={(value) =>
                                setSelectedAbsenceReason(value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a reason" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="called_out">
                                  Called Out
                                </SelectItem>
                                <SelectItem value="left_early">
                                  Left Early
                                </SelectItem>
                                <SelectItem value="off">Off</SelectItem>
                                <SelectItem value="custom">
                                  Custom Status
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            {selectedAbsenceReason === "custom" && (
                              <Textarea
                                id="custom-absence-reason"
                                value={customAbsenceReason}
                                onChange={(e) =>
                                  setCustomAbsenceReason(e.target.value)
                                }
                                placeholder="Enter custom absence reason"
                                className="min-h-[100px] mt-2"
                              />
                            )}
                            <Button
                              className="mt-2"
                              variant="linkHover1"
                              onClick={handleAddAbsence}
                              disabled={
                                !selectedDate ||
                                (!selectedAbsenceReason && !customAbsenceReason)
                              }
                            >
                              Add Absence
                            </Button>
                          </CardContent>
                        </Card>

                        <Card className="mt-2">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-2xl  font-bold mb-6">
                              Available Sick Time
                            </CardTitle>
                            {/* Add any icons or elements you want here */}
                          </CardHeader>
                          <CardContent className="mx-auto">
                            {/* Display available sick time */}

                            <p className="text-2xl font-medium">
                              {availableSickTime !== null
                                ? `${availableSickTime} hours`
                                : ""}
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                      {/* End of Cards Grid */}

                      {/* Add the DataTable here */}
                      <div className="grid p-2 gap-4 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-1">
                        <Card className="mt-4">
                          <CardHeader>
                            <CardTitle>Employee Schedule</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <CustomDataTable
                              columns={filteredColumns}
                              data={combinedSchedules}
                              fetchReferenceSchedules={fetchReferenceSchedules}
                              fetchActualSchedules={fetchActualSchedules}
                              sorting={sorting}
                              onSortingChange={setSorting}
                              showPagination={true}
                            />
                          </CardContent>
                        </Card>
                      </div>

                      {/* Occurrences Card */}
                      <div className="grid p-2 gap-4 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-1">
                        <Card className="mt-2">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-2xl font-bold mb-6">
                              All Occurrences
                            </CardTitle>
                            {/* Add any icons or elements you want here */}
                          </CardHeader>
                          <CardContent>
                            <ScrollArea className="h-[calc(75vh-500px)]">
                              <div
                                className={classNames(
                                  "grid gap-4 max-h-[300px] max-w-full overflow-hidden overflow-y-auto mt-2 p-6",
                                  styles.noScroll
                                )}
                              >
                                {absences
                                  .sort(
                                    (a, b) =>
                                      new Date(b.schedule_date).getTime() -
                                      new Date(a.schedule_date).getTime()
                                  )
                                  .map((absence) => (
                                    <div
                                      key={absence.id}
                                      className="grid grid-cols-3 gap-4 items-center"
                                    >
                                      {/* Left column: Absence status */}
                                      <div className="text-sm font-medium">
                                        {absence.status}
                                      </div>

                                      {/* Middle column: Schedule date */}
                                      <div className="text-sm text-center">
                                        {absence.schedule_date}
                                      </div>

                                      {/* Right column: Created by and date */}
                                      <div className="text-xs text-right text-gray-500 dark:text-gray-400">
                                        {absence.created_by} on{" "}
                                        {new Date(
                                          absence.created_at
                                        ).toLocaleDateString()}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                              <ScrollBar orientation="vertical" />
                            </ScrollArea>
                          </CardContent>
                        </Card>
                      </div>

                      {/* <Card className="mt-2">
                        <SickTimeTable data={sickTimeData} />
                      </Card> */}
                    </TabsContent>

                    <TabsContent value="reviews">
                      <div className="p-6 space-y-4">
                        <div className="grid gap-1.5">
                          <Button
                            variant="linkHover1"
                            onClick={handleAddReviewClick}
                          >
                            Add Review
                            <PlusIcon className="ml-2 size-icon" />
                          </Button>
                        </div>
                        <div className="grid gap-4">
                          {reviews.map((review) => (
                            <div
                              key={review.id}
                              className="flex justify-between items-start"
                            >
                              <div>
                                <div className="text-sm font-medium">
                                  {review.review_quarter} {review.review_year}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  - {review.created_by} on{" "}
                                  {new Date(
                                    review.created_at
                                  ).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="linkHover1"
                                  size="icon"
                                  onClick={() => handleEditReview(review.id)}
                                >
                                  <Pencil1Icon />
                                </Button>
                                <Button
                                  variant="linkHover1"
                                  size="icon"
                                  onClick={() => handleDeleteReview(review.id)}
                                >
                                  <TrashIcon />
                                </Button>
                                <Button
                                  variant="linkHover1"
                                  size="icon"
                                  onClick={() => handleViewReview(review)}
                                >
                                  View
                                </Button>
                                {!review.published && (
                                  <Button
                                    variant="linkHover1"
                                    size="icon"
                                    onClick={() =>
                                      handlePublishReview(review.id)
                                    }
                                  >
                                    Publish
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    <Dialog
                      open={showReviewDialog}
                      onOpenChange={setShowReviewDialog}
                    >
                      <DialogOverlay className="fixed inset-0 z-50" />
                      <DialogContent className="fixed inset-0 flex items-center justify-center bg-white dark:bg-black z-50 view-review-dialog">
                        <div className="bg-white dark:bg-black p-6 rounded-lg shadow-lg max-w-3xl w-full space-y-4 overflow-y-auto max-h-screen">
                          <DialogTitle>
                            {editMode ? "Edit Review" : "Add Review"}
                          </DialogTitle>
                          <DialogDescription>
                            <div className="grid gap-1.5 my-4">
                              <Label htmlFor="review-quarter">
                                Review Title
                              </Label>
                              <input
                                type="text"
                                id="review-quarter"
                                value={reviewQuarter}
                                onChange={(e) =>
                                  setReviewQuarter(e.target.value)
                                }
                                className="input"
                              />
                            </div>
                            <div className="grid gap-1.5 my-4">
                              <Label htmlFor="review-year">Year</Label>
                              <input
                                type="number"
                                id="review-year"
                                value={reviewYear}
                                onChange={(e) =>
                                  setReviewYear(Number(e.target.value))
                                }
                                className="input"
                              />
                            </div>
                            <div className="grid gap-1.5 my-4">
                              <Label htmlFor="overview-performance">
                                Overview of Performance
                              </Label>
                              <Textarea
                                id="overview-performance"
                                value={overviewPerformance}
                                onChange={(e) =>
                                  setOverviewPerformance(e.target.value)
                                }
                                className="min-h-[100px]"
                              />
                            </div>
                            <div className="grid gap-1.5 my-4">
                              <Label htmlFor="achievements-contributions">
                                Achievements and Contributions
                              </Label>
                              {achievementsContributions.map(
                                (achievement, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center "
                                  >
                                    <Textarea
                                      id={`achievement-${index}`}
                                      value={achievement}
                                      onChange={(e) =>
                                        setAchievementsContributions(
                                          achievementsContributions.map(
                                            (ach, i) =>
                                              i === index ? e.target.value : ach
                                          )
                                        )
                                      }
                                      className="min-h-[50px] flex-1"
                                    />
                                    <Button
                                      variant="linkHover2"
                                      size="icon"
                                      onClick={() =>
                                        setAchievementsContributions([
                                          ...achievementsContributions,
                                          "",
                                        ])
                                      }
                                    >
                                      <PlusIcon />
                                    </Button>
                                    <Button
                                      variant="linkHover2"
                                      size="icon"
                                      onClick={() =>
                                        setAchievementsContributions(
                                          achievementsContributions.filter(
                                            (_, i) => i !== index
                                          )
                                        )
                                      }
                                    >
                                      <TrashIcon />
                                    </Button>
                                  </div>
                                )
                              )}
                            </div>
                            <div className="grid gap-1.5 my-4">
                              <Label htmlFor="attendance-reliability">
                                Attendance and Reliability
                              </Label>
                              {attendanceReliability.map(
                                (attendance, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center "
                                  >
                                    <Textarea
                                      id={`attendance-${index}`}
                                      value={attendance}
                                      onChange={(e) =>
                                        setAttendanceReliability(
                                          attendanceReliability.map((att, i) =>
                                            i === index ? e.target.value : att
                                          )
                                        )
                                      }
                                      className="min-h-[50px] flex-1"
                                    />
                                    <Button
                                      variant="linkHover2"
                                      size="icon"
                                      onClick={() =>
                                        setAttendanceReliability([
                                          ...attendanceReliability,
                                          "",
                                        ])
                                      }
                                    >
                                      <PlusIcon />
                                    </Button>
                                    <Button
                                      variant="linkHover2"
                                      size="icon"
                                      onClick={() =>
                                        setAttendanceReliability(
                                          attendanceReliability.filter(
                                            (_, i) => i !== index
                                          )
                                        )
                                      }
                                    >
                                      <TrashIcon />
                                    </Button>
                                  </div>
                                )
                              )}
                            </div>
                            <div className="grid gap-1.5 my-4">
                              <Label htmlFor="quality-work">
                                Quality of Work
                              </Label>
                              {qualityWork.map((quality, index) => (
                                <div key={index} className="flex items-center ">
                                  <Textarea
                                    id={`quality-${index}`}
                                    value={quality}
                                    onChange={(e) =>
                                      setQualityWork(
                                        qualityWork.map((qual, i) =>
                                          i === index ? e.target.value : qual
                                        )
                                      )
                                    }
                                    className="min-h-[50px] flex-1"
                                  />
                                  <Button
                                    variant="linkHover2"
                                    size="icon"
                                    onClick={() =>
                                      setQualityWork([...qualityWork, ""])
                                    }
                                  >
                                    <PlusIcon />
                                  </Button>
                                  <Button
                                    variant="linkHover2"
                                    size="icon"
                                    onClick={() =>
                                      setQualityWork(
                                        qualityWork.filter(
                                          (_, i) => i !== index
                                        )
                                      )
                                    }
                                  >
                                    <TrashIcon />
                                  </Button>
                                </div>
                              ))}
                            </div>
                            <div className="grid gap-1.5 my-4">
                              <Label htmlFor="communication-collaboration">
                                Communication & Collaboration
                              </Label>
                              {communicationCollaboration.map(
                                (communication, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center "
                                  >
                                    <Textarea
                                      id={`communication-${index}`}
                                      value={communication}
                                      onChange={(e) =>
                                        setCommunicationCollaboration(
                                          communicationCollaboration.map(
                                            (comm, i) =>
                                              i === index
                                                ? e.target.value
                                                : comm
                                          )
                                        )
                                      }
                                      className="min-h-[50px] flex-1"
                                    />
                                    <Button
                                      variant="linkHover2"
                                      size="icon"
                                      onClick={() =>
                                        setCommunicationCollaboration([
                                          ...communicationCollaboration,
                                          "",
                                        ])
                                      }
                                    >
                                      <PlusIcon />
                                    </Button>
                                    <Button
                                      variant="linkHover2"
                                      size="icon"
                                      onClick={() =>
                                        setCommunicationCollaboration(
                                          communicationCollaboration.filter(
                                            (_, i) => i !== index
                                          )
                                        )
                                      }
                                    >
                                      <TrashIcon />
                                    </Button>
                                  </div>
                                )
                              )}
                            </div>
                            <div className="grid gap-1.5 my-4">
                              <Label htmlFor="strengths-accomplishments">
                                Strengths & Accomplishments
                              </Label>
                              {strengthsAccomplishments.map(
                                (strength, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center "
                                  >
                                    <Textarea
                                      id={`strength-${index}`}
                                      value={strength}
                                      onChange={(e) =>
                                        setStrengthsAccomplishments(
                                          strengthsAccomplishments.map(
                                            (str, i) =>
                                              i === index ? e.target.value : str
                                          )
                                        )
                                      }
                                      className="min-h-[50px] flex-1"
                                    />
                                    <Button
                                      variant="linkHover2"
                                      size="icon"
                                      onClick={() =>
                                        setStrengthsAccomplishments([
                                          ...strengthsAccomplishments,
                                          "",
                                        ])
                                      }
                                    >
                                      <PlusIcon />
                                    </Button>
                                    <Button
                                      variant="linkHover2"
                                      size="icon"
                                      onClick={() =>
                                        setStrengthsAccomplishments(
                                          strengthsAccomplishments.filter(
                                            (_, i) => i !== index
                                          )
                                        )
                                      }
                                    >
                                      <TrashIcon />
                                    </Button>
                                  </div>
                                )
                              )}
                            </div>
                            <div className="grid gap-1.5 my-4">
                              <Label htmlFor="areas-growth">
                                Areas for Growth and Development
                              </Label>
                              {areasGrowth.map((area, index) => (
                                <div key={index} className="flex items-center ">
                                  <Textarea
                                    id={`area-${index}`}
                                    value={area}
                                    onChange={(e) =>
                                      setAreasGrowth(
                                        areasGrowth.map((ar, i) =>
                                          i === index ? e.target.value : ar
                                        )
                                      )
                                    }
                                    className="min-h-[50px] flex-1"
                                  />
                                  <Button
                                    variant="linkHover2"
                                    size="icon"
                                    onClick={() =>
                                      setAreasGrowth([...areasGrowth, ""])
                                    }
                                  >
                                    <PlusIcon />
                                  </Button>
                                  <Button
                                    variant="linkHover2"
                                    size="icon"
                                    onClick={() =>
                                      setAreasGrowth(
                                        areasGrowth.filter(
                                          (_, i) => i !== index
                                        )
                                      )
                                    }
                                  >
                                    <TrashIcon />
                                  </Button>
                                </div>
                              ))}
                            </div>
                            <div className="grid gap-1.5 my-4">
                              <Label htmlFor="recognition">Recognition</Label>
                              {recognition.map((rec, index) => (
                                <div key={index} className="flex items-center ">
                                  <Textarea
                                    id={`recognition-${index}`}
                                    value={rec}
                                    onChange={(e) =>
                                      setRecognition(
                                        recognition.map((re, i) =>
                                          i === index ? e.target.value : re
                                        )
                                      )
                                    }
                                    className="min-h-[50px] flex-1"
                                  />
                                  <Button
                                    variant="linkHover2"
                                    size="icon"
                                    onClick={() =>
                                      setRecognition([...recognition, ""])
                                    }
                                  >
                                    <PlusIcon />
                                  </Button>
                                  <Button
                                    variant="linkHover2"
                                    size="icon"
                                    onClick={() =>
                                      setRecognition(
                                        recognition.filter(
                                          (_, i) => i !== index
                                        )
                                      )
                                    }
                                  >
                                    <TrashIcon />
                                  </Button>
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-end space-x-2 my-4">
                              <Button
                                variant="outline"
                                onClick={() => setShowReviewDialog(false)}
                              >
                                Close
                              </Button>
                              <Button onClick={handleAddReview}>
                                {editMode ? "Update Review" : "Submit Review"}
                              </Button>
                            </div>
                          </DialogDescription>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog
                      open={viewReviewDialog}
                      onOpenChange={setViewReviewDialog}
                    >
                      <DialogOverlay className="fixed inset-0 z-50" />
                      <DialogContent className="fixed inset-0 flex items-center justify-center mb-4 bg-white dark:bg-black z-50 view-review-dialog">
                        <div className="bg-white dark:bg-black p-6 rounded-lg shadow-lg max-w-3xl w-full space-y-4 overflow-y-auto max-h-screen">
                          <DialogTitle className="font-size: 1.35rem font-bold">
                            Employee Review
                          </DialogTitle>
                          <DialogDescription>
                            <div className="grid gap-1.5 mb-2">
                              <Label className="view-label"></Label>
                              <p>{currentReview?.review_quarter}</p>
                            </div>
                            <div className="grid gap-1.5 mb-2">
                              <Label className="text-md font-bold">Year</Label>
                              <p>{currentReview?.review_year}</p>
                            </div>
                            <div className="grid gap-1.5 mb-2">
                              <Label className="text-md font-bold">
                                Overview of Performance
                              </Label>
                              <p>{currentReview?.overview_performance}</p>
                            </div>
                            <div className="grid gap-1.5 mb-2">
                              <Label className="text-md font-bold">
                                Achievements and Contributions
                              </Label>
                              <ul className="list-disc pl-5">
                                {currentReview?.achievements_contributions.map(
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
                                {currentReview?.attendance_reliability.map(
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
                                {currentReview?.quality_work.map(
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
                                {currentReview?.communication_collaboration.map(
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
                                {currentReview?.strengths_accomplishments.map(
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
                                {currentReview?.areas_growth.map(
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
                                {currentReview?.recognition.map(
                                  (rec, index) => (
                                    <li key={index}>{rec}</li>
                                  )
                                )}
                              </ul>
                            </div>
                            <div className="flex justify-end mt-2 space-x-2">
                              <Button
                                variant="linkHover1"
                                onClick={() => setViewReviewDialog(false)}
                              >
                                Close
                              </Button>
                            </div>
                          </DialogDescription>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <TabsContent value="growth">
                      <div className="p-6 space-y-4">
                        <div className="grid gap-1.5">
                          <Label htmlFor="new-growth">
                            Add a new growth tracking entry
                          </Label>
                          <Textarea
                            id="new-growth"
                            value={newGrowth}
                            onChange={(e) => setNewGrowth(e.target.value)}
                            placeholder="Type your growth tracking entry here..."
                            className="min-h-[100px]"
                          />
                          <Button onClick={() => handleAddNote("growth")}>
                            Add Entry
                          </Button>
                        </div>
                        <div className="grid gap-4">
                          {notes
                            .filter((note) => note.type === "growth")
                            .map((note) => (
                              <div
                                key={note.id}
                                className="flex justify-between items-start"
                              >
                                <div>
                                  <div className="text-sm font-medium">
                                    {note.note}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() =>
                                      handleEditNote(
                                        note.id,
                                        prompt("Edit note:", note.note) ??
                                          note.note
                                      )
                                    }
                                  >
                                    <Pencil1Icon />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleDeleteNote(note.id)}
                                  >
                                    <TrashIcon />
                                  </Button>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="sales">
                      <h1 className="text-xl font-bold mb-2 ml-2">
                        <TextGenerateEffect words="Sales Data" />
                      </h1>
                      <SalesDataTableEmployee employeeId={employeeId} />{" "}
                      {/* Include SalesDataTable */}
                    </TabsContent>

                    <TabsContent value="performance">
                      <h1 className="text-xl font-bold mb-2 ml-2">
                        <TextGenerateEffect words="Sales Insight" />
                      </h1>
                      <div className="grid p-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                        <Card className="mt-4">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-2xl font-bold mb-6">
                              Select A Date
                            </CardTitle>
                            {/* Add any icons or elements you want here */}
                          </CardHeader>
                          <CardContent>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full pl-3 text-left font-normal"
                                >
                                  {selectedDate ? (
                                    format(selectedDate, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <CustomCalendar
                                  selectedDate={selectedDate ?? new Date()}
                                  onDateChange={handleDateChange}
                                  disabledDays={() => false}
                                />
                              </PopoverContent>
                            </Popover>
                          </CardContent>
                        </Card>

                        <Card className="mt-4">
                          <CardHeader>
                            <CardTitle className="text-2xl font-bold">
                              Total # Of DROS
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4">
                            <div className="text-left">
                              <DataTableProfile
                                columns={[
                                  {
                                    Header: "Total DROS",
                                    accessor: "TotalDros",
                                  },
                                ]}
                                data={summaryData}
                              />
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="mt-4">
                          <CardHeader>
                            <CardTitle className="text-2xl font-bold">
                              Points Deducted
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4">
                            <div className="text-left">
                              <DataTableProfile
                                columns={[
                                  {
                                    Header: "Points Deducted",
                                    accessor: "PointsDeducted",
                                  },
                                ]}
                                data={summaryData}
                              />
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="mt-4">
                          <CardHeader>
                            <CardTitle className="text-2xl font-bold">
                              Current Points
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4">
                            <div className="text-left">
                              <DataTableProfile
                                columns={[
                                  {
                                    Header: "Total Points",
                                    accessor: "TotalPoints",
                                  },
                                ]}
                                data={summaryData}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <Card>
                        <CardContent>
                          <table className="w-full">
                            <thead>
                              <tr>
                                <th className="py-2 w-36 text-left">DROS #</th>
                                {/* <th className="py-2 w-24 text-left">Sales Rep</th> */}
                                {/* <th className="py-2 w-24 text-left">Audit Type</th> */}
                                <th className="py-2 w-32 text-left">
                                  Trans Date
                                </th>
                                {/* <th className="py-2 w-32 text-left">Audit Date</th> */}
                                <th className="py-2 w-32 text-left">
                                  Location
                                </th>
                                <th className="py-2 w-48 text-left">Details</th>
                                <th className="py-2 w-64 text-left">Notes</th>
                                <th className="py-2 w-12 text-left">
                                  Cancelled?
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {audits.map((audit, index) => (
                                <tr key={index} className="border-t">
                                  <td className="py-2 w-36">
                                    {audit.dros_number}
                                  </td>
                                  {/* <td className="py-2 w-24">{audit.salesreps}</td> */}
                                  {/* <td className="py-2 w-24">{audit.audit_type}</td> */}
                                  <td className="py-2 w-30">
                                    {audit.trans_date}
                                  </td>
                                  {/* <td className="py-2 w-30">{audit.audit_date}</td> */}
                                  <td className="py-2 w-32">
                                    {audit.error_location}
                                  </td>
                                  <td className="py-2 w-48">
                                    {audit.error_details}
                                  </td>
                                  <td className="py-2 w-64">
                                    {audit.error_notes}
                                  </td>
                                  <td className="py-2 w-12">
                                    {audit.dros_cancel}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Suspense>
                </main>
                <ScrollBar orientation="vertical" />
              </ScrollArea>
            </Tabs>
          </div>
        </Card>
      </div>
    </RoleBasedWrapper>
  );
};

export default EmployeeProfile;
