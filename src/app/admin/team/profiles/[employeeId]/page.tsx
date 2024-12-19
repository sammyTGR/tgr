// admin\team\profiles\[employeeId]\page.tsx
"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  useParams,
  usePathname,
  useSearchParams,
  useRouter,
} from "next/navigation"; // Correct import
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
import { WeightedScoringCalculator } from "../../../audits/contest/WeightedScoringCalculator";
import { toast } from "sonner";
import HistoricalAuditChart from "@/app/admin/audits/HistoricalAuditChart";
import AuditChart from "@/app/admin/audits/AuditChart";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { exportToExcel } from "@/app/admin/audits/utils";
import * as XLSX from "xlsx";

interface PageParams {
  tab?: string;
  lanid?: string;
  date?: string;
  showAll?: string;
  search?: string; // Add this
}

interface AuditFilters {
  startDate?: string;
  endDate?: string;
  lanid?: string;
  auditType?: string;
}

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
  audits_id: string;
}

interface Employee {
  id: number;
  lanid: string;
  name: string;
  position: string;
  avatar_url?: string;
  department?: string;
  role?: string;
  status?: string;
  contact_info?: string;
}

interface SalesData {
  id: number;
  Lanid: string;
  subcategory_label: string;
  dros_cancel: string | null;
  cancelled_dros?: number;
  Date: string;
  dros_number: string;
  salesreps: string;
  audit_type: string;
  trans_date: string;
  audit_date: string;
  error_location: string;
  error_details: string;
  error_notes: string;
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

interface SummaryRowData {
  Lanid: string;
  TotalDros: number | null;
  MinorMistakes: number | null;
  MajorMistakes: number | null;
  CancelledDros: number | null;
  WeightedErrorRate: number | null;
  TotalWeightedMistakes: number | null;
  Qualified: boolean;
  DisqualificationReason: string;
  isDivider?: boolean;
  Department?: string;
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

const calculateSummaryData = (
  salesData: SalesData[],
  auditData: Audit[],
  pointsCalculation: PointsCalculation[],
  historicalAuditData: Audit[],
  employeesData: Employee[],
  showAllEmployees: boolean,
  selectedLanid: string | null
): SummaryRowData[] => {
  const employeeDepartments = new Map(
    employeesData?.map((emp: Employee) => [emp.lanid, emp.department]) || []
  );

  const lanids = showAllEmployees
    ? Array.from(new Set(salesData.map((sale) => sale.Lanid)))
    : selectedLanid
    ? [selectedLanid]
    : [];

  const calculatedData = lanids
    .map((lanid): SummaryRowData | null => {
      if (!lanid) return null;

      const employeeSalesData = salesData.filter(
        (sale) => sale.Lanid === lanid
      );
      const employeeAuditData = auditData.filter(
        (audit) => audit.salesreps === lanid
      );
      const employeeHistoricalAuditData = historicalAuditData.filter(
        (audit) => audit.salesreps === lanid
      );

      const department = employeeDepartments.get(lanid);
      const isOperations = department?.toString() === "Operations";

      try {
        const calculator = new WeightedScoringCalculator({
          salesData: employeeSalesData.map((sale) => ({
            ...sale,
            // Add default value of "0" if cancelled_dros is undefined or null
            dros_cancel:
              sale.cancelled_dros !== undefined && sale.cancelled_dros !== null
                ? sale.cancelled_dros.toString()
                : "0",
          })),
          auditData: employeeAuditData.map((audit) => ({
            ...audit,
            id: audit.audits_id,
          })),
          // historicalAuditData: employeeHistoricalAuditData.map((audit) => ({
          //   ...audit,
          //   id: audit.audits_id,
          // })),
          pointsCalculation,
          isOperations,
          minimumDros: 20,
        });

        return {
          ...calculator.metrics,
          Department: department || "Unknown",
          Lanid: lanid,
          TotalWeightedMistakes:
            calculator.metrics.TotalWeightedMistakes || null,
        };
      } catch (error) {
        // console.error(`Error calculating metrics for ${lanid}:`, error);
        return null;
      }
    })
    .filter((data): data is SummaryRowData => {
      if (!data) return false;
      return (
        "Lanid" in data &&
        "Department" in data &&
        "TotalDros" in data &&
        "MinorMistakes" in data &&
        "MajorMistakes" in data &&
        "CancelledDros" in data &&
        "WeightedErrorRate" in data &&
        "Qualified" in data &&
        "DisqualificationReason" in data &&
        "TotalWeightedMistakes" in data
      );
    });

  // Sort data by qualification status and error rate
  const qualifiedEmployees = calculatedData
    .filter((emp) => emp.Qualified)
    .sort((a, b) => (a.WeightedErrorRate || 0) - (b.WeightedErrorRate || 0));

  const unqualifiedEmployees = calculatedData
    .filter((emp) => !emp.Qualified)
    .sort((a, b) => (a.WeightedErrorRate || 0) - (b.WeightedErrorRate || 0));

  if (
    showAllEmployees &&
    qualifiedEmployees.length &&
    unqualifiedEmployees.length
  ) {
    const divider: SummaryRowData = {
      Lanid: "",
      TotalDros: null,
      MinorMistakes: null,
      MajorMistakes: null,
      CancelledDros: null,
      WeightedErrorRate: null,
      TotalWeightedMistakes: null,
      Qualified: false,
      DisqualificationReason: "",
      isDivider: true,
    };
    return [...qualifiedEmployees, divider, ...unqualifiedEmployees];
  }

  return [...qualifiedEmployees, ...unqualifiedEmployees];
};

const usePageParams = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const tab = searchParams.get("tab") || "submit";
  const selectedLanid = searchParams.get("lanid") || null;
  const showAllEmployees = searchParams.get("showAll") === "true";
  const dateParam = searchParams.get("date");
  const selectedDate = dateParam ? new Date(dateParam) : null;
  const searchText = searchParams.get("search") || "";

  const setParams = useCallback(
    (params: Partial<PageParams>) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));

      Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") {
          current.delete(key);
        } else {
          current.set(key, value.toString());
        }
      });

      const search = current.toString();
      const query = search ? `?${search}` : "";
      router.push(`${pathname}${query}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  return {
    tab,
    selectedLanid,
    showAllEmployees,
    selectedDate,
    searchText,
    setParams,
  };
};

// API Functions
const api = {
  fetchEmployees: async (): Promise<Employee[]> => {
    const searchParams = new URLSearchParams({
      select: "lanid,department,role,status,contact_info",
      status: "active",
      order: "lanid.asc",
    });

    const response = await fetch(`/api/fetchEmployees?${searchParams}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Error fetching employees: ${error.message}`);
    }

    return response.json();
  },

  fetchAudits: async (filters?: AuditFilters): Promise<Audit[]> => {
    let query = supabase
      .from("Auditsinput")
      .select("*")
      .order("audit_date", { ascending: false });

    // Only apply filters if they are provided AND we're in contest tab
    if (filters && Object.keys(filters).length > 0) {
      if (filters.startDate) query = query.gte("audit_date", filters.startDate);
      if (filters.endDate) query = query.lte("audit_date", filters.endDate);
      if (filters.lanid) query = query.eq("salesreps", filters.lanid);
      if (filters.auditType) query = query.eq("audit_type", filters.auditType);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Error fetching audits: ${error.message}`);
    }

    // Only filter by date range if filters are provided
    if (filters?.endDate) {
      return (data || []).filter((audit) => {
        const auditDate = new Date(audit.audit_date);
        const endDate = new Date(filters.endDate!);
        return auditDate <= endDate;
      });
    }

    return data || [];
  },

  fetchHistoricalAuditData: async (lanid: string) => {
    const { data, error } = await supabase
      .from("Auditsinput")
      .select("*")
      .eq("salesreps", lanid)
      .order("audit_date", { ascending: true });

    if (error) throw error;
    return data;
  },

  fetchPointsCalculation: async (): Promise<PointsCalculation[]> => {
    const { data, error } = await supabase
      .from("points_calculation")
      .select("*")
      .order("category", { ascending: true });

    if (error) {
      throw new Error(`Error fetching points calculation: ${error.message}`);
    }
    return data || [];
  },

  fetchSalesData: async (
    startDate: string,
    endDate: string,
    lanid?: string,
    showAllEmployees?: boolean
  ): Promise<SalesData[]> => {
    let query = supabase
      .from("sales_data")
      .select("*")
      .gte("Date", startDate)
      .lte("Date", endDate)
      .not("subcategory_label", "is", null)
      .not("subcategory_label", "eq", "");

    if (!showAllEmployees && lanid) {
      query = query.eq("Lanid", lanid);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Error fetching sales data: ${error.message}`);

    // Filter out any data that doesn't match our date range
    const filteredData = (data || []).filter((sale) => {
      const saleDate = new Date(sale.Date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return saleDate >= start && saleDate <= end;
    });

    return filteredData;
  },

  updateAudit: async (
    auditId: string,
    updateData: Partial<Audit>
  ): Promise<Audit> => {
    const normalizedData = {
      ...updateData,
      dros_cancel: updateData.dros_cancel ? "True" : "",
    };

    const { data, error } = await supabase
      .from("Auditsinput")
      .update(normalizedData)
      .eq("audits_id", auditId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating audit: ${error.message}`);
    }
    return data;
  },

  deleteAudit: async (auditId: string): Promise<void> => {
    const { error } = await supabase
      .from("Auditsinput")
      .delete()
      .eq("audits_id", auditId);

    if (error) {
      throw new Error(`Error deleting audit: ${error.message}`);
    }
  },
};

// Custom hook for audit queries
const useAuditsPageQueries = (pageParams: {
  selectedDate: Date | null;
  selectedLanid: string;
  showAllEmployees: boolean;
  tab: string;
  setParams: (params: PageParams) => void;
}) => {
  const { selectedDate, selectedLanid } = pageParams;

  const dateRange = useMemo(() => {
    if (!selectedDate) return null;
    const startDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      1
    );
    const endDate = new Date(selectedDate);
    return {
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
    };
  }, [selectedDate]);

  const contestAuditsQuery = useQuery({
    queryKey: [
      "audits",
      "contest",
      dateRange?.startDate,
      dateRange?.endDate,
      selectedLanid,
    ],
    queryFn: async () => {
      if (!dateRange) return [];
      const response = await supabase
        .from("audits")
        .select("*")
        .eq("salesreps", selectedLanid)
        .gte("audit_date", dateRange.startDate)
        .lte("audit_date", dateRange.endDate);
      return response.data || [];
    },
    enabled: !!dateRange,
  });

  const salesDataQuery = useQuery({
    queryKey: [
      "salesData",
      dateRange?.startDate,
      dateRange?.endDate,
      selectedLanid,
    ],
    queryFn: async () => {
      if (!dateRange) return [];
      const response = await supabase
        .from("sales")
        .select("*")
        .eq("Lanid", selectedLanid)
        .gte("Date", dateRange.startDate)
        .lte("Date", dateRange.endDate);
      return response.data || [];
    },
    enabled: !!dateRange,
  });

  const historicalAuditsQuery = useQuery({
    queryKey: ["historicalAudits", selectedLanid],
    queryFn: async () => {
      const response = await supabase
        .from("audits")
        .select("*")
        .eq("salesreps", selectedLanid)
        .order("audit_date", { ascending: false });
      return response.data || [];
    },
    enabled: !!selectedLanid,
  });

  const handleExportToExcel = useCallback(() => {
    if (!selectedDate || !contestAuditsQuery.data) return;
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(contestAuditsQuery.data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Performance Data");
    XLSX.writeFile(
      workbook,
      `performance_data_${format(selectedDate, "yyyy-MM")}.xlsx`
    );
  }, [selectedDate, contestAuditsQuery.data]);

  return {
    contestAuditsQuery,
    salesDataQuery,
    historicalAuditsQuery,
    summaryTableData: useMemo(() => {
      if (!contestAuditsQuery.data || !salesDataQuery.data) return [];
      // Process your data here to create summary table data
      return [];
    }, [contestAuditsQuery.data, salesDataQuery.data]),
    handlers: {
      handleDateChange: (date: Date | null) => {
        pageParams.setParams({
          date: date ? format(date, "yyyy-MM-dd") : undefined,
        });
      },
      handleReset: () => {
        pageParams.setParams({ date: undefined });
      },
      handleExport: handleExportToExcel,
    },
  };
};

const useAuditsData = (employee: Employee | null) => {
  const { selectedDate, setParams } = usePageParams();

  const dateRange = useMemo(() => {
    if (!selectedDate) return null;
    const startDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      1
    );
    const endDate = new Date(selectedDate);
    return {
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
    };
  }, [selectedDate]);

  const contestAuditsQuery = useQuery({
    queryKey: [
      "audits",
      "contest",
      dateRange?.startDate,
      dateRange?.endDate,
      employee?.lanid,
    ],
    queryFn: async () => {
      if (!dateRange || !employee?.lanid) return [];
      const response = await supabase
        .from("audits")
        .select("*")
        .eq("salesreps", employee.lanid)
        .gte("audit_date", dateRange.startDate)
        .lte("audit_date", dateRange.endDate);
      return response.data || [];
    },
    enabled: !!dateRange && !!employee?.lanid,
  });

  const salesDataQuery = useQuery({
    queryKey: [
      "salesData",
      dateRange?.startDate,
      dateRange?.endDate,
      employee?.lanid,
    ],
    queryFn: async () => {
      if (!dateRange || !employee?.lanid) return [];
      const response = await supabase
        .from("sales")
        .select("*")
        .eq("Lanid", employee.lanid)
        .gte("Date", dateRange.startDate)
        .lte("Date", dateRange.endDate);
      return response.data || [];
    },
    enabled: !!dateRange && !!employee?.lanid,
  });

  const historicalAuditsQuery = useQuery({
    queryKey: ["historicalAudits", employee?.lanid],
    queryFn: async () => {
      const response = await supabase
        .from("audits")
        .select("*")
        .eq("salesreps", employee?.lanid)
        .order("audit_date", { ascending: false });
      return response.data || [];
    },
    enabled: !!employee?.lanid,
  });

  const handleExportToExcel = useCallback(() => {
    if (!selectedDate || !contestAuditsQuery.data) return;
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(contestAuditsQuery.data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Performance Data");
    XLSX.writeFile(
      workbook,
      `performance_data_${format(selectedDate, "yyyy-MM")}.xlsx`
    );
  }, [selectedDate, contestAuditsQuery.data]);

  return {
    queries: {
      contestAudits: contestAuditsQuery,
      salesData: salesDataQuery,
      historicalAudits: historicalAuditsQuery,
    },
    summaryData: useMemo(() => {
      if (!contestAuditsQuery.data || !salesDataQuery.data) return [];
      // Process your data here to create summary data
      return [];
    }, [contestAuditsQuery.data, salesDataQuery.data]),
    handlers: {
      handleDateChange: (date: Date | null) => {
        setParams({
          date: date ? format(date, "yyyy-MM-dd") : undefined,
        });
      },
      handleReset: () => {
        setParams({ date: undefined });
      },
      handleExport: handleExportToExcel,
    },
  };
};

const EmployeeProfile = () => {
  const pageParams = usePageParams();
  const { selectedDate, selectedLanid, showAllEmployees } = pageParams;
  const queryClient = useQueryClient();
  const params = useParams()!;
  const employeeIdParam = params.employeeId;

  const employeeId =
    typeof employeeIdParam === "string"
      ? parseInt(employeeIdParam, 10)
      : Array.isArray(employeeIdParam)
      ? parseInt(employeeIdParam[0], 10)
      : 0;
  const [performanceDate, setPerformanceDate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState("daily_briefing");
  const [notes, setNotes] = useState<Note[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [newNote, setNewNote] = useState("");
  const [newReview, setNewReview] = useState("");
  const [newAbsence, setNewAbsence] = useState("");
  const [newGrowth, setNewGrowth] = useState("");
  const [newDailyBriefing, setNewDailyBriefing] = useState("");
  const [employee, setEmployee] = useState<Employee | null>(null);
  const { user } = useRole();
  const [employees, setEmployees] = useState<Employee[]>([]);
  // const [selectedLanid, setSelectedLanid] = useState<string | null>(null);
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
  // const [showAllEmployees, setShowAllEmployees] = useState<boolean>(false);
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
  // const [selectedDate, setSelectedDate] = useState<Date | null>(null);
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

  const handlePerformanceDateChange = useCallback(
    (date: Date | undefined) => {
      pageParams.setParams({
        date: date ? format(date, "yyyy-MM-dd") : undefined,
      });
    },
    [pageParams]
  );

  const employeeQuery = useQuery({
    queryKey: ["employee", employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("id", employeeId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Performance data queries
  const performanceQueries = useQuery({
    queryKey: ["performance", employeeId, pageParams.selectedDate],
    queryFn: async () => {
      if (!pageParams.selectedDate || !employeeQuery.data?.lanid) return null;
      const startDate = new Date(
        pageParams.selectedDate.getFullYear(),
        pageParams.selectedDate.getMonth(),
        1
      );
      const endDate = new Date(pageParams.selectedDate);
      const [auditsResponse, salesResponse, pointsResponse] = await Promise.all(
        [
          supabase
            .from("audits")
            .select("*")
            .eq("salesreps", employeeQuery.data.lanid)
            .gte("audit_date", format(startDate, "yyyy-MM-dd"))
            .lte("audit_date", format(endDate, "yyyy-MM-dd")),
          supabase
            .from("sales")
            .select("*")
            .eq("Lanid", employeeQuery.data.lanid)
            .gte("Date", format(startDate, "yyyy-MM-dd"))
            .lte("Date", format(endDate, "yyyy-MM-dd")),
          supabase.from("points_calculation").select("*"),
        ]
      );
      return {
        audits: auditsResponse.data || [],
        sales: salesResponse.data || [],
        points: pointsResponse.data || [],
      };
    },
    enabled: !!employeeQuery.data?.lanid && !!pageParams.selectedDate,
  });
  // Historical data query
  const historicalQuery = useQuery({
    queryKey: ["historical", employeeId],
    queryFn: async () => {
      if (!employeeQuery.data?.lanid) return [];
      const { data } = await supabase
        .from("audits")
        .select("*")
        .eq("salesreps", employeeQuery.data.lanid)
        .order("audit_date", { ascending: false });
      return data || [];
    },
    enabled: !!employeeQuery.data?.lanid,
  });
  const summaryTableData = useMemo(() => {
    if (!performanceQueries.data || !employeeQuery.data) return [];
    return calculateSummaryData(
      performanceQueries.data.sales,
      performanceQueries.data.audits,
      performanceQueries.data.points,
      historicalQuery.data || [],
      [employeeQuery.data], // Pass only the current employee
      false, // showAllEmployees is always false for profile page
      employeeQuery.data.lanid
    );
  }, [performanceQueries.data, historicalQuery.data, employeeQuery.data]);

  const combinedSchedules = useMemo(() => {
    const timeZone = "America/Los_Angeles"; // Adjust this to your desired time zone
    const combined = [...referenceSchedules, ...actualSchedules]
      .filter((schedule) => schedule.employee_id === employeeId)
      .map((schedule) => {
        if (!schedule.schedule_date) {
          // console.warn("Schedule missing schedule_date:", schedule);
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

          // console.log(
          //   `Schedule date: ${schedule.schedule_date}, Day of week: ${dayOfWeek}, Start time: ${formattedStartTime}, End time: ${formattedEndTime}`
          // );

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

    // console.log("Combined schedules for employee:", combined);
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
      setPerformanceDate(null);
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

  const exportToExcel = (
    data: SummaryRowData[],
    selectedDate: Date,
    showAllEmployees: boolean,
    selectedLanid: string | null
  ): void => {
    const exportData = data
      .filter((row) => !row.isDivider)
      .map((row) => ({
        "Sales Rep": sanitizeHtml(row.Lanid),
        Department: sanitizeHtml(row.Department || ""),
        "Total DROS": row.TotalDros ?? "",
        "Minor Mistakes": row.MinorMistakes ?? "",
        "Major Mistakes": row.MajorMistakes ?? "",
        "Cancelled DROS": row.CancelledDros ?? "",
        "Weighted Error Rate": row.WeightedErrorRate
          ? `${row.WeightedErrorRate.toFixed(2)}%`
          : "",
        "Total Weighted Mistakes": row.TotalWeightedMistakes ?? "",
        Status: sanitizeHtml(row.DisqualificationReason),
      }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales Contest Results");

    // Format headers
    const headerStyle = {
      font: { bold: true },
      alignment: { horizontal: "center" },
      fill: { fgColor: { rgb: "CCCCCC" } },
    };

    const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + "1";
      if (!ws[address]) continue;
      ws[address].s = headerStyle;
    }

    // Auto-size columns
    const colWidths = exportData.reduce((widths: number[], row) => {
      Object.values(row).forEach((value, i) => {
        const width = String(value).length;
        widths[i] = Math.max(widths[i] || 0, width);
      });
      return widths;
    }, []);

    ws["!cols"] = colWidths.map((width) => ({ width }));

    const dateStr = format(selectedDate, "MMM_yyyy");
    const suffix = showAllEmployees
      ? "_all_employees"
      : selectedLanid
      ? `_${selectedLanid}`
      : "";

    XLSX.writeFile(wb, `Sales_Contest_Results_${dateStr}${suffix}.xlsx`);
  };

  const sanitizeHtml = (html: string | null | undefined): string => {
    if (!html) return "";
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ["p", "b", "i", "em", "strong", "span", "div", "br"],
      ALLOWED_ATTR: ["class", "style"],
      ADD_TAGS: [], // Required to avoid type error
      ADD_ATTR: [], // Required to avoid type error
      USE_PROFILES: { html: true }, // Required to enable HTML sanitization
    });
  };

  const summaryColumns = [
    {
      Header: "Sales Rep",
      accessor: "Lanid",
      Cell: ({ row: { original } }: { row: { original: any } }) => (
        <div
          className={`text-left align-left ${
            !original.Qualified ? "text-gray-400 italic" : ""
          }`}
        >
          {sanitizeHtml(original.Lanid)}
        </div>
      ),
    },
    {
      Header: "Total DROS",
      accessor: "TotalDros",
      Cell: ({ row: { original } }: { row: { original: any } }) => (
        <div
          className={`text-left align-left ${
            !original.Qualified ? "text-gray-400 italic" : ""
          }`}
        >
          {original.TotalDros === null ? "" : original.TotalDros}
        </div>
      ),
    },
    {
      Header: "Minor Mistakes",
      accessor: "MinorMistakes",
      Cell: ({ row: { original } }: { row: { original: any } }) => (
        <div
          className={`text-left align-left ${
            !original.Qualified ? "text-gray-400 italic" : ""
          }`}
        >
          {original.MinorMistakes === null ? "" : original.MinorMistakes}
        </div>
      ),
    },
    {
      Header: "Major Mistakes",
      accessor: "MajorMistakes",
      Cell: ({ row: { original } }: { row: { original: any } }) => (
        <div
          className={`text-left align-left ${
            !original.Qualified ? "text-gray-400 italic" : ""
          }`}
        >
          {original.MajorMistakes === null ? "" : original.MajorMistakes}
        </div>
      ),
    },
    {
      Header: "Cancelled DROS",
      accessor: "CancelledDros",
      Cell: ({ row: { original } }: { row: { original: any } }) => (
        <div
          className={`text-left align-left ${
            !original.Qualified ? "text-gray-400 italic" : ""
          }`}
        >
          {original.CancelledDros === null ? "" : original.CancelledDros}
        </div>
      ),
    },
    {
      Header: "Weighted Error Rate",
      accessor: "WeightedErrorRate",
      Cell: ({ row: { original } }: { row: { original: any } }) => (
        <div
          className={`text-left align-left ${
            !original.Qualified ? "text-gray-400 italic" : ""
          }`}
        >
          {original.isDivider
            ? ""
            : original.WeightedErrorRate === null
            ? ""
            : `${original.WeightedErrorRate.toFixed(2)}%`}
        </div>
      ),
    },
    {
      Header: "Status",
      accessor: "DisqualificationReason",
      Cell: ({ row: { original } }: { row: { original: any } }) => (
        <div
          className={`text-left align-left ${
            !original.Qualified ? "text-red-500" : "text-green-500"
          }`}
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(original.DisqualificationReason, {
              ALLOWED_TAGS: [],
              ALLOWED_ATTR: [],
              ALLOW_ARIA_ATTR: false,
              ALLOW_DATA_ATTR: false,
              USE_PROFILES: { html: false },
            }),
          }}
        />
      ),
    },
  ];

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
    setPerformanceDate(date || null);
    fetchAndCalculateSummary(date || null);
  };

  const fetchAndCalculateSummary = async (date: Date | null) => {
    if (!date || !employee) return;

    const startDate = new Date(date.getFullYear(), date.getMonth(), 1)
      .toISOString()
      .split("T")[0];

    const endDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    )
      .toISOString()
      .split("T")[0];

    try {
      // Get employee department
      const { data: employeeData, error: employeeError } = await supabase
        .from("employees")
        .select("lanid, department")
        .eq("employee_id", employeeId)
        .single();

      if (employeeError) throw employeeError;

      // Fetch sales data with subcategory label filter
      const { data: salesData, error: salesError } = await supabase
        .from("sales_data")
        .select("*")
        .eq("Lanid", employeeData.lanid)
        .gte("Date", startDate)
        .lte("Date", endDate)
        .not("subcategory_label", "is", null)
        .not("subcategory_label", "eq", "");

      // Fetch audit data
      const { data: auditData, error: auditError } = await supabase
        .from("Auditsinput")
        .select("*")
        .eq("salesreps", employeeData.lanid)
        .gte("audit_date", startDate)
        .lte("audit_date", endDate);

      // Fetch points calculation
      const { data: pointsCalculation, error: pointsError } = await supabase
        .from("points_calculation")
        .select("*");

      if (salesError || auditError || pointsError)
        throw new Error("Data fetch error");

      const isOperations = employeeData.department?.toString() === "Operations";

      // Filter sales data to only include records up to selected date
      const validSalesData = (salesData || []).filter((sale) => {
        const saleDate = new Date(sale.Date);
        return saleDate <= date && sale.subcategory_label;
      });

      // Filter audit data to only include records up to selected date
      const validAuditData = (auditData || []).filter((audit) => {
        const auditDate = new Date(audit.audit_date);
        return auditDate <= date;
      });

      // Use WeightedScoringCalculator with filtered data
      const calculator = new WeightedScoringCalculator({
        salesData: validSalesData.map((sale) => ({
          ...sale,
          dros_cancel:
            sale.cancelled_dros !== undefined && sale.cancelled_dros !== null
              ? sale.cancelled_dros.toString()
              : "0",
        })),
        auditData: validAuditData.map((audit) => ({
          ...audit,
          id: audit.audits_id,
        })),
        pointsCalculation: pointsCalculation || [],
        isOperations,
        minimumDros: 20,
      });

      const metrics = calculator.metrics;

      setSummaryData([
        {
          Lanid: employeeData.lanid,
          Department: employeeData.department || "Unknown",
          TotalDros: validSalesData.length, // Using the filtered sales data length for total DROs
          MinorMistakes: metrics.MinorMistakes,
          MajorMistakes: metrics.MajorMistakes,
          CancelledDros: metrics.CancelledDros,
          WeightedErrorRate: metrics.WeightedErrorRate,
          TotalWeightedMistakes: metrics.TotalWeightedMistakes,
          Qualified: metrics.Qualified,
          DisqualificationReason: metrics.DisqualificationReason,
        },
      ]);
    } catch (error) {
      console.error("Error calculating summary:", error);
      toast.error("Failed to calculate performance metrics");
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

    // Fetch absences from employee_absences table
    const { data: absencesData, error: absencesError } = await supabase
      .from("employee_absences")
      .select("id, employee_id, schedule_date, status, created_by, created_at")
      .eq("employee_id", employeeId);

    if (absencesError) {
      console.error("Error fetching absences:", absencesError);
    }

    // Fetch custom statuses from schedules table
    const { data: schedulesData, error: schedulesError } = await supabase
      .from("schedules")
      .select("schedule_id, schedule_date, status") // Changed id to schedule_id
      .eq("employee_id", employeeId)
      .or(
        "status.ilike.%Late Start%,status.ilike.%Left Early%,status.eq.called_out"
      );

    if (schedulesError) {
      console.error("Error fetching schedules:", schedulesError);
    } else {
      const formattedAbsences = schedulesData.map(
        (
          absence: {
            schedule_id: number;
            schedule_date: string;
            status: string;
          },
          index: number
        ) => {
          let status = absence.status;

          if (
            status.toLowerCase().includes("late start") ||
            status.toLowerCase().includes("left early")
          ) {
            status = status.replace(/^Custom:\s*/i, "");
          } else if (status === "called_out") {
            status = "Called Out";
          }

          return {
            id: -(absence.schedule_id || index + 1000), // Using schedule_id instead of id
            employee_id: employeeId,
            schedule_date: absence.schedule_date,
            status: status,
            created_by: "System",
            created_at: new Date().toISOString(),
          };
        }
      );

      // Combine both regular absences and schedule-based absences
      setAbsences((prevAbsences) => {
        const combinedAbsences = [...(absencesData || [])];
        const existingDates = new Set(
          combinedAbsences.map((absence) => absence.schedule_date)
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

  // Date range calculation
  const performanceDateRange = useMemo(() => {
    if (!performanceDate) return null;

    // Get first day of the selected month
    const startDate = new Date(
      performanceDate.getFullYear(),
      performanceDate.getMonth(),
      1
    );

    // Use the actual selected date for end date
    const endDate = new Date(performanceDate);

    // Ensure we're capturing the full day
    endDate.setHours(23, 59, 59, 999);

    return {
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
    };
  }, [performanceDate]);

  // Use existing queries for performance data
  const performanceAuditsQuery = useQuery({
    queryKey: [
      "audits",
      "performance",
      performanceDateRange?.startDate,
      performanceDateRange?.endDate,
      employee?.lanid,
    ],
    queryFn: async () => {
      if (!performanceDateRange || !employee?.lanid) return [];
      return api.fetchAudits({
        startDate: performanceDateRange.startDate,
        endDate: performanceDateRange.endDate,
        lanid: employee.lanid,
      });
    },
    enabled: !!performanceDateRange && !!employee?.lanid,
  });

  const performanceSalesQuery = useQuery({
    queryKey: [
      "salesData",
      performanceDateRange?.startDate,
      performanceDateRange?.endDate,
      employee?.lanid,
    ],
    queryFn: async () => {
      if (!performanceDateRange || !employee?.lanid) return [];
      return api.fetchSalesData(
        performanceDateRange.startDate,
        performanceDateRange.endDate,
        employee.lanid,
        false
      );
    },
    enabled: !!performanceDateRange && !!employee?.lanid,
  });

  const performanceHistoricalQuery = useQuery({
    queryKey: ["historicalAudits", employee?.lanid],
    queryFn: () => api.fetchHistoricalAuditData(employee?.lanid || ""),
    enabled: !!employee?.lanid,
  });

  // Base queries
  const employeesQuery = useQuery({
    queryKey: ["employees"],
    queryFn: api.fetchEmployees,
    staleTime: Infinity,
  });

  const pointsCalculationQuery = useQuery({
    queryKey: ["pointsCalculation"],
    queryFn: api.fetchPointsCalculation,
    staleTime: Infinity,
  });

  const contestAuditsQuery = useQuery({
    queryKey: [
      "audits",
      "contest",
      performanceDateRange?.startDate,
      performanceDateRange?.endDate,
      selectedLanid,
    ],
    queryFn: async () => {
      if (!performanceDateRange) return [];
      return api.fetchAudits({
        startDate: performanceDateRange.startDate,
        endDate: performanceDateRange.endDate,
        lanid: selectedLanid || undefined,
      });
    },
    enabled: pageParams.tab === "contest" && !!performanceDateRange, // Only run this query when on contest tab and dateRange exists
  });

  const salesDataQuery = useQuery({
    queryKey: [
      "salesData",
      performanceDateRange?.startDate,
      performanceDateRange?.endDate,
      selectedLanid,
      showAllEmployees,
    ],
    queryFn: async () => {
      if (!performanceDateRange) return [];
      return api.fetchSalesData(
        performanceDateRange.startDate,
        performanceDateRange.endDate,
        selectedLanid || undefined,
        showAllEmployees
      );
    },
    enabled: !!performanceDateRange,
  });

  // Table Configuration Options
  const tableOptions = {
    enableSorting: true,
    enableFiltering: true,
    enablePagination: true,
    enableRowSelection: false,
    enableColumnResizing: true,
    enableAutoResetPage: true,
    manualPagination: false,
    globalFilterFn: "contains",
    getRowId: (row: any) => row.audits_id || row.Lanid,
  };

  const profileTableOptions = {
    ...tableOptions,
    enablePagination: false,
    enableFiltering: false,
    enableColumnResizing: false,
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
        {
          event: "*",
          schema: "public",
          table: "employee_profile_notes",
          filter: `profile_employee_id=eq.${employeeId}`, // Add filter for specific employee
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            // Add new note to the beginning of the list
            setNotes((prevNotes) => [payload.new as Note, ...prevNotes]);
          } else if (payload.eventType === "DELETE") {
            // Remove deleted note
            setNotes((prevNotes) =>
              prevNotes.filter((note) => note.id !== payload.old.id)
            );
          } else if (payload.eventType === "UPDATE") {
            // Update modified note
            setNotes((prevNotes) =>
              prevNotes.map((note) =>
                note.id === payload.new.id ? (payload.new as Note) : note
              )
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

    const { error } = await supabase.from("employee_profile_notes").insert([
      {
        profile_employee_id: employeeId,
        employee_id: parseInt(user.id, 10),
        note: noteContent,
        type,
        created_by: employeeName,
      },
    ]);

    if (error) {
      console.error("Error adding note:", error);
      return;
    }

    // Clear the input field but don't manually update the notes state
    // The subscription will handle the state update
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
        break;
      case "daily_briefing":
        setNewDailyBriefing("");
        break;
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

  const fetchHistoricalAuditData = async (lanid: string | null = null) => {
    let query = supabase
      .from("Auditsinput")
      .select("*")
      .order("audit_date", { ascending: true });

    if (lanid) {
      query = query.eq("salesreps", lanid);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  };

  const historicalAuditsQuery = useQuery({
    queryKey: ["historicalAudits", selectedLanid],
    queryFn: () => fetchHistoricalAuditData(selectedLanid),
    enabled: !!selectedLanid,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleReset = useCallback(() => {
    pageParams.setParams({
      date: undefined,
      lanid: undefined,
      showAll: undefined,
      search: undefined,
    });
  }, [pageParams.setParams]);

  const handleExport = useCallback(() => {
    if (selectedDate) {
      exportToExcel(summaryData, selectedDate, showAllEmployees, selectedLanid);
    } else {
      toast.error("Please select a date before exporting");
    }
  }, [summaryData, selectedDate, showAllEmployees, selectedLanid]);

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
                  src={
                    employee.avatar_url ||
                    "https://utfs.io/f/9jzftpblGSv7nvddLr3ZYIXtyiAHqxfuS6V9231FedsGbMWh"
                  }
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
                <TabsTrigger value="audits">Audits</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
              </TabsList>
              <ScrollArea className="h-[calc(100vh-300px)] relative">
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
                                    variant="ghost"
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
                                    variant="ghost"
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
                                    variant="ghost"
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
                                    variant="ghost"
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
                                    variant="ghost"
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
                                    variant="ghost"
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
                            <ScrollArea className="h-[calc(75vh-500px)] relative">
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
                            variant="outline"
                            onClick={handleAddReviewClick}
                          >
                            Add Review
                            <PlusIcon className="ml-2 size-icon" />
                          </Button>
                        </div>
                        <div className="flex flex-col gap-4">
                          {reviews.map((review) => (
                            <div
                              key={review.id}
                              className="flex justify-between items-start"
                            >
                              <div>
                                <div className="text-sm font-large">
                                  {review.review_quarter} {review.review_year}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  - {review.created_by} on{" "}
                                  {new Date(
                                    review.created_at
                                  ).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  onClick={() => handleEditReview(review.id)}
                                >
                                  <Pencil1Icon />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteReview(review.id)}
                                >
                                  <TrashIcon />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleViewReview(review)}
                                >
                                  View
                                </Button>
                                {!review.published && (
                                  <Button
                                    variant="outline"
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
                                variant="gooeyRight"
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

                    <TabsContent value="audits">
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
                              Major Mistakes
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4">
                            <div className="text-left">
                              <DataTableProfile
                                columns={[
                                  {
                                    Header: "Major Mistakes",
                                    accessor: "MajorMistakes",
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
                              Error Rate
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4">
                            <div className="text-left">
                              <DataTableProfile
                                columns={[
                                  {
                                    Header: "Error Rate",
                                    accessor: "WeightedErrorRate",
                                    Cell: ({
                                      value,
                                    }: {
                                      value: number | null;
                                    }) => (
                                      <div className="text-center font-semibold text-lg">
                                        {value !== null && value !== undefined
                                          ? `${value.toFixed(2)}%`
                                          : "0.00%"}
                                      </div>
                                    ),
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

                    <TabsContent value="performance">
                      <div className="grid p-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                        {/* Date Selection Card */}
                        <Card className="mt-4">
                          <CardHeader>
                            <CardTitle>Select A Date</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full pl-3 text-left font-normal"
                                >
                                  {pageParams.selectedDate ? (
                                    format(pageParams.selectedDate, "MMMM yyyy")
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
                                  selectedDate={
                                    pageParams.selectedDate || new Date()
                                  }
                                  onDateChange={handlePerformanceDateChange}
                                  disabledDays={() => false}
                                />
                              </PopoverContent>
                            </Popover>
                          </CardContent>
                        </Card>

                        {/* Actions Card */}
                        <Card className="mt-4">
                          <CardHeader>
                            <CardTitle>Actions</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-col gap-2">
                              <Button
                                variant="destructive"
                                className="w-full"
                                onClick={handleReset}
                              >
                                Clear All Selections
                              </Button>
                              <Button
                                onClick={handleExport}
                                className="w-full"
                                disabled={!selectedDate}
                              >
                                Export to Excel
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Summary Table */}
                      <Card>
                        <CardContent>
                          {pageParams.selectedDate && (
                            <div className="text-left">
                              <DataTableProfile
                                columns={summaryColumns}
                                data={summaryTableData}
                              />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                      {pageParams.selectedDate && (
                        <AuditChart
                          data={performanceQueries.data?.audits || []}
                          isLoading={performanceQueries.isLoading}
                          showTimeRangeSelector={false}
                        />
                      )}
                      <HistoricalAuditChart
                        data={historicalQuery.data || []}
                        selectedLanid={employeeQuery.data?.lanid}
                      />
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
