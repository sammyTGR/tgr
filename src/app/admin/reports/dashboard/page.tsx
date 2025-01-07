"use client";

import SalesRangeStackedBarChart from "@/app/admin/reports/charts/SalesRangeStackedBarChart";
import LoadingIndicator from "@/components/LoadingIndicator";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CustomCalendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useRole } from "@/context/RoleContext";
import { supabase } from "@/utils/supabase/client";
import {
  BarChartIcon,
  BellIcon,
  CalendarIcon,
  CheckCircledIcon,
  ClipboardIcon,
  CrossCircledIcon,
  DrawingPinIcon,
  FilePlusIcon,
  MagnifyingGlassIcon,
  PersonIcon,
  TableIcon,
} from "@radix-ui/react-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import classNames from "classnames";
import { format, parseISO } from "date-fns";
import { format as formatTZ, toZonedTime } from "date-fns-tz";
import { useFlags } from "flagsmith/react";
import DOMPurify from "isomorphic-dompurify";
import dynamic from "next/dynamic";
import { usePathname, useSearchParams } from "next/navigation";
import React, { Suspense } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import TodoWrapper from "../../todo/todo-wrapper";
import styles from "./table.module.css";
import AnnualRevenueBarChart from "@/app/admin/reports/charts/AnnualRevenueBarChart";
import {
  fetchDomains,
  fetchSuggestions,
  fetchCertificates,
  replySuggestion,
  addDomainMutation,
  updateDomainMutation,
  deleteDomainMutation,
  fetchLatestRangeWalkReport,
  fetchLatestChecklistSubmission,
  fetchLatestGunsmithMaintenance,
  fetchLatestDailyDeposit,
  fetchDailyChecklistStatus,
  fetchLatestSalesData,
} from "./api";
import { sendEmail } from "./actions";
import SalesDataTableAllEmployees from "@/app/admin/reports/sales/sales-data-table-all-employees";

interface Certificate {
  id: number;
  name: string;
  certificate: string; // Add this line
  action_status: string;
  expiration: Date;
}

interface Domain {
  id: number;
  domain: string;
}

interface Suggestion {
  id: number;
  suggestion: string;
  created_by: string;
  created_at: string | null;
  is_read: boolean | null;
  replied_by: string | null;
  replied_at: string | null;
  reply: string | null;
  email: string | null;
  replierName?: string | null;
}

interface ReplyStates {
  [key: number]: string;
}

interface MetricData {
  metric: string;
  value: string;
}

interface SalesMetrics {
  averageMonthlyGrossRevenue: number;
  averageMonthlyNetRevenue: number;
  topPerformingCategories: { category: string; revenue: number }[];
  peakHours: { hour: number; transactions: number; formattedHour: string }[];
  customerFrequency: { visits: string; percentage: number }[];
}

declare global {
  interface Function {
    timeoutId?: number;
  }
}

const LazySalesDataTable = dynamic(
  () =>
    import("@/app/admin/reports/sales/sales-data-table").then((module) => ({
      default: module.default,
    })),
  {
    loading: () => (
      <div className="relative w-full h-[400px]">
        <LoadingIndicator />
      </div>
    ),
  }
);
const columnHelper = createColumnHelper<MetricData>();

const columns = [
  columnHelper.accessor("metric", {
    header: "Metric",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("value", {
    header: "Value",
    cell: (info) => info.getValue(),
  }),
];

function AdminDashboardContent() {
  const flags = useFlags(["is_todo_enabled", "is_barchart_enabled"]);
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { role } = useRole();

  const { isLoading } = useQuery({
    queryKey: ["navigation", pathname, searchParams],
    queryFn: () => Promise.resolve(null),
    staleTime: 0,
    refetchInterval: 0,
  });

  const { data: metrics } = useQuery<SalesMetrics>({
    queryKey: ["metrics"],
    queryFn: async () => {
      const response = await fetch("/api/metrics");
      if (!response.ok) {
        throw new Error("Failed to fetch metrics");
      }
      return response.json();
    },
  });

  // Modify the suggestions section in AdminDashboardContent:
  const { data: replyStates = {} as ReplyStates, refetch: refetchReplyStates } =
    useQuery({
      queryKey: ["replyStates"],
      queryFn: () => ({} as ReplyStates),
      staleTime: Infinity,
    });

  const { data: domains } = useQuery({
    queryKey: ["domains"],
    queryFn: fetchDomains,
  });

  const { data: newDomain = "", refetch: refetchNewDomain } = useQuery({
    queryKey: ["newDomain"],
    queryFn: () => "",
    staleTime: Infinity,
  });

  const { data: editingDomain, refetch: refetchEditingDomain } = useQuery({
    queryKey: ["editingDomain"],
    queryFn: () => null as Domain | null,
    staleTime: Infinity,
  });

  const { data: suggestions } = useQuery({
    queryKey: ["suggestions"],
    queryFn: fetchSuggestions,
  });

  const { data: certificates } = useQuery({
    queryKey: ["certificates"],
    queryFn: fetchCertificates,
    refetchInterval: 15 * 60 * 1000,
  });

  const { data: rangeWalk } = useQuery({
    queryKey: ["rangeWalk"],
    queryFn: fetchLatestRangeWalkReport,
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: checklist } = useQuery({
    queryKey: ["checklist"],
    queryFn: fetchLatestChecklistSubmission,
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: gunsmiths } = useQuery({
    queryKey: ["gunsmiths"],
    queryFn: fetchLatestGunsmithMaintenance,
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: dailyDeposit } = useQuery({
    queryKey: ["dailyDeposit"],
    queryFn: fetchLatestDailyDeposit,
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: dailyChecklistStatus } = useQuery({
    queryKey: ["dailyChecklistStatus"],
    queryFn: fetchDailyChecklistStatus,
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: replyText, refetch: refetchReplyText } = useQuery({
    queryKey: ["replyText"],
    queryFn: () => "",
    staleTime: Infinity,
  });

  //Mutations

  const updateRangeMutation = useMutation({
    mutationFn: (date: Date) => {
      const newStart = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      const newEnd = new Date(newStart);
      newEnd.setHours(23, 59, 59, 999);
      return Promise.resolve({ start: newStart, end: newEnd });
    },
    onSuccess: (newRange) => {
      queryClient.setQueryData(["selectedRange"], newRange);
    },
  });

  const updateReplyTextMutation = useMutation({
    mutationFn: (newReplyText: string) => {
      return Promise.resolve(newReplyText);
    },
    onSuccess: (newReplyText) => {
      queryClient.setQueryData(["replyText"], newReplyText);
    },
  });

  const { data: selectedRange } = useQuery({
    queryKey: ["selectedRange"],
    queryFn: () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const endOfYesterday = new Date(yesterday);
      endOfYesterday.setHours(23, 59, 59, 999);
      return {
        start: yesterday,
        end: endOfYesterday,
      } as const; // Make the return type more explicit
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Convert salesData to a query
  // Update the sales data query with proper configuration
  const { data: salesData } = useQuery({
    queryKey: [
      "salesData",
      selectedRange?.start?.toISOString(),
      selectedRange?.end?.toISOString(),
    ],
    queryFn: () =>
      selectedRange
        ? fetchLatestSalesData(selectedRange.start, selectedRange.end)
        : null,
    enabled: !!selectedRange,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch on component mount
    refetchOnReconnect: false, // Don't refetch on reconnection
  });

  // Keep your existing fileData query
  const { data: fileData } = useQuery({
    queryKey: ["fileData"],
    queryFn: () => ({ file: null, fileName: null, fileInputKey: 0 }),
    staleTime: Infinity,
  });

  // Mutation to update fileData
  const updateFileDataMutation = useMutation({
    mutationFn: (newFileData: {
      file: File | null;
      fileName: string | null;
      fileInputKey: number;
    }) => {
      return Promise.resolve(newFileData);
    },
    onSuccess: (newFileData) => {
      queryClient.setQueryData(["fileData"], newFileData);
    },
  });

  // Update the handlers to use these new mutations
  const handleRangeChange = (date: Date | undefined) => {
    if (date) {
      updateRangeMutation.mutate(date);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      updateFileDataMutation.mutate({
        file: e.target.files[0],
        fileName: e.target.files[0].name,
        fileInputKey: Date.now(),
      });
    }
  };

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const upload = (progress: number) => {
        queryClient.setQueryData(["uploadProgress"], progress);
      };
      return handleFileUpload(file, upload);
    },
    onSuccess: () => {
      queryClient.setQueryData(["uploadProgress"], 100);
      toast.success("File uploaded and processed successfully");
      updateFileDataMutation.mutate({
        file: null,
        fileName: null,
        fileInputKey: Date.now(),
      });
    },
  });

  const replyMutation = useMutation({
    mutationFn: async ({
      suggestion,
      replyText,
    }: {
      suggestion: Suggestion;
      replyText: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const fullName = user.user_metadata?.name || "";
      const firstName = fullName.split(" ")[0];
      const replierName = firstName || "Admin";

      // Use the API function
      await replySuggestion({ suggestion, replyText, replierName });

      // Send email notification
      await sendEmail(
        suggestion.email || "",
        "Reply to Your Suggestion",
        "SuggestionReply",
        {
          employeeName: suggestion.created_by,
          originalSuggestion: suggestion.suggestion,
          replyText: replyText,
          repliedBy: replierName,
        }
      );

      return { suggestion, replyText };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
      toast.success("Reply sent successfully!");
    },
    onError: () => {
      toast.error("Failed to send reply. Please try again.");
    },
  });

  const { data: uploadProgress = 0 } = useQuery({
    queryKey: ["uploadProgress"],
    queryFn: () => queryClient.getQueryData(["uploadProgress"]) ?? 0,
    enabled: uploadFileMutation.isPending,
  });

  const metricsData = React.useMemo(() => {
    if (!metrics) return [];

    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    });

    return [
      {
        metric: "Average Monthly Gross Revenue",
        value: formatter.format(metrics.averageMonthlyGrossRevenue),
      },
      {
        metric: "Average Monthly Net Revenue",
        value: formatter.format(metrics.averageMonthlyNetRevenue),
      },
      {
        metric: "Top Performing Category",
        value: metrics.topPerformingCategories[0]?.category || "N/A",
      },
      {
        metric: "Peak Business Hour",
        value: metrics.peakHours[0]
          ? `${metrics.peakHours[0].formattedHour} (${metrics.peakHours[0].transactions} transactions)`
          : "N/A",
      },
    ];
  }, [metrics]);

  const table = useReactTable({
    data: metricsData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  function handleReply({
    suggestion,
    replyText,
  }: {
    suggestion: Suggestion;
    replyText: string;
  }): Promise<void> {
    if (!suggestion.id) {
      // console.error("Suggestion ID is undefined", suggestion);
      toast.error("Unable to reply: Suggestion ID is missing");
      return Promise.reject("Suggestion ID is missing");
    }
    return replyMutation.mutateAsync({ suggestion, replyText }).then(() => {});
  }

  function handleFileUpload(
    file: File,
    onProgress: (progress: number) => void
  ) {
    return Promise.resolve(
      new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          Promise.resolve().then(() => {
            try {
              const data = new Uint8Array(e.target?.result as ArrayBuffer);
              const workbook = XLSX.read(data, { type: "array" });
              const firstSheetName = workbook.SheetNames[0];
              const worksheet = workbook.Sheets[firstSheetName];
              const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                header: 1,
              });

              const keys = jsonData[0] as string[];
              const formattedData = jsonData.slice(1).map((row: any) => {
                const rowData: any = {};
                keys.forEach((key, index) => {
                  // Skip the Margin and Margin % columns
                  if (key !== "Margin" && key !== "Margin %") {
                    // Handle Primary Email column name change if needed
                    const mappedKey =
                      key === "Primary Email" ? "Primary Email" : key;
                    rowData[mappedKey] = row[index];
                  }
                });

                const categoryLabel =
                  categoryMap.get(parseInt(rowData.Cat)) || "";
                const subcategoryKey = `${rowData.Cat}-${rowData.Sub}`;
                const subcategoryLabel =
                  subcategoryMap.get(subcategoryKey) || "";

                return {
                  ...rowData,
                  Date: convertDateFormat(rowData.Date),
                  category_label: categoryLabel,
                  subcategory_label: subcategoryLabel,
                };
              });

              const batchSize = 100;
              let processedCount = 0;
              let chainPromise = Promise.resolve();

              for (let i = 0; i < formattedData.length; i += batchSize) {
                const batch = formattedData.slice(i, i + batchSize);
                chainPromise = chainPromise.then(() =>
                  Promise.resolve(
                    supabase
                      .from("sales_data")
                      .upsert(batch)
                      .then(({ error }) => {
                        if (error) {
                          // console.error("Error upserting data batch:", error);
                        } else {
                          processedCount += batch.length;
                          onProgress(
                            Math.round(
                              (processedCount / formattedData.length) * 100
                            )
                          );
                        }
                      })
                  )
                );
              }

              chainPromise.then(() => resolve()).catch(reject);
            } catch (error) {
              // console.error("Error processing data:", error);
              reject(error);
            }
          });
        };

        reader.onerror = (error) => {
          // console.error("Error reading file:", error);
          reject(error);
        };

        reader.readAsArrayBuffer(file);
      })
    );
  }

  function convertDateFormat(date: string) {
    if (!date) return "";
    const [month, day, year] = date.split("/");
    if (!month || !day || !year) return "";
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const categoryMap = new Map<number, string>([
    [3, "Firearm Accessories"],
    [175, "Station Rental"],
    [4, "Ammunition"],
    [170, "Buyer Fees"],
    [1, "Pistol"],
    [10, "Shotgun"],
    [150, "Gun Range Rental"],
    [8, "Accessories"],
    [6, "Knives & Tools"],
    [131, "Service Labor"],
    [101, "Class"],
    [11, "Revolver"],
    [2, "Rifle"],
    [191, "FFL Transfer Fee"],
    [12, "Consumables"],
    [9, "Receiver"],
    [135, "Shipping"],
    [5, "Clothing"],
    [100, "Shooting Fees"],
    [7, "Hunting Gear"],
    [14, "Storage"],
    [13, "Reloading Supplies"],
    [15, "Less Than Lethal"],
    [16, "Personal Protection Equipment"],
    [17, "Training Tools"],
    [132, "Outside Service Labor"],
    [168, "CA Tax Adjust"],
    [192, "CA Tax Gun Transfer"],
    [102, "Monthly Storage Fee (Per Firearm)"],
    [103, "CA Excise Tax"],
    [104, "CA Excise Tax Adjustment"],
  ]);

  const subcategoryMap = new Map<string, string>([
    ["170-7", "Standard Ammunition Eligibility Check"],
    ["170-1", "Dros Fee"],
    ["170-16", "DROS Reprocessing Fee (Dealer Sale)"],
    ["170-8", "Basic Ammunition Eligibility Check"],
  ]);

  function SuggestionReplyForm({
    suggestion,
    onSubmit,
    onClose,
  }: {
    suggestion: Suggestion;
    onSubmit: (text: string) => Promise<void>;
    onClose: () => void;
  }) {
    const queryClient = useQueryClient();

    const replyTextMutation = useMutation({
      mutationFn: ({ id, text }: { id: number; text: string }) => {
        return Promise.resolve({ id, text });
      },
      onSuccess: ({ id, text }) => {
        queryClient.setQueryData(["replyText", id], text);
      },
    });

    const { data: replyText = "" } = useQuery({
      queryKey: ["replyText", suggestion.id],
      queryFn: () => "",
      staleTime: Infinity,
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(replyText).then(() => {
        replyTextMutation.mutate({ id: suggestion.id, text: "" });
        onClose();
      });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-2">
        <h4 className="font-medium">Reply to Suggestion</h4>
        <Textarea
          placeholder="Type your reply here..."
          value={replyText}
          onChange={(e) =>
            replyTextMutation.mutate({
              id: suggestion.id,
              text: e.target.value,
            })
          }
        />
        <Button type="submit">Send Reply</Button>
      </form>
    );
  }

  return (
    <RoleBasedWrapper allowedRoles={["admin", "ceo", "super admin", "dev"]}>
      <div className="container max-w-[calc(100vw-90px)] py-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">
              Admin Dashboard
            </CardTitle>
          </CardHeader>
        </Card>

        <Tabs defaultValue="reporting">
          <div className="flex items-center space-x-2">
            <TabsList className="grid grid-cols-4 text-left">
              <TabsTrigger value="reporting">Reports Overview</TabsTrigger>
              <TabsTrigger value="sales">Daily Sales Review</TabsTrigger>
              <TabsTrigger value="sales-employee">
                Sales By Employee
              </TabsTrigger>
              <TabsTrigger value="metrics">Key Metrics</TabsTrigger>
            </TabsList>
          </div>

          <div className="relative section w-full overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50">
                <LoadingIndicator />
              </div>
            )}
            {/* <h1 className="text-3xl font-bold ml-8 mt-14 mb-10">Admin Dashboard</h1> */}
            {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mx-auto max-w-[calc(100vw-100px)] overflow-hidden"> */}

            <TabsContent value="reporting">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mx-auto max-w-[calc(100vw-100px)] overflow-hidden">
                {/*todo card*/}
                {flags.is_todo_enabled.enabled && (
                  <div className="w-full overflow-hidden">
                    <div className="col-span-full overflow-hidden mt-2">
                      <div className="h-full w-full overflow-hidden">
                        <TodoWrapper />
                      </div>
                    </div>
                  </div>
                )}

                {/*All Report cards*/}
                <div className="w-full ">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 ">
                    <ReportCard
                      title="Gunsmithing Weekly Maintenance"
                      date={gunsmiths?.last_maintenance_date || null}
                      icon={<PersonIcon className="h-6 w-6" />}
                      extraInfo={gunsmiths?.firearm_name}
                      type="maintenance"
                    />
                    <ReportCard
                      title="Firearms With Gunsmith"
                      date={dailyChecklistStatus?.lastSubmissionDate || null}
                      icon={<ClipboardIcon className="h-6 w-6" />}
                      extraInfo={`${dailyChecklistStatus?.firearmsCount} firearms with gunsmith`}
                      type="dailyChecklist"
                    />
                    <ReportCard
                      title="Daily Checklist Submissions"
                      date={checklist?.submission_date || null}
                      icon={<ClipboardIcon className="h-6 w-6" />}
                      extraInfo={checklist?.submitted_by_name}
                    />
                    <ReportCard
                      title="Daily Range Walk Reports"
                      date={rangeWalk?.date_of_walk || null}
                      icon={<MagnifyingGlassIcon className="h-6 w-6" />}
                      extraInfo={rangeWalk?.user_name || ""}
                    />
                    <ReportCard
                      title="Daily Deposits"
                      date={dailyDeposit?.created_at || null}
                      icon={<ClipboardIcon className="h-6 w-6" />}
                      extraInfo={dailyDeposit?.employee_name}
                      type="deposit"
                      details={[
                        {
                          name: dailyDeposit?.register || "",
                          value:
                            dailyDeposit?.total_to_deposit?.toFixed(2) ||
                            "0.00",
                        },
                      ]}
                    />
                    <ReportCard
                      title="Certificates Needing Renewal"
                      date={
                        certificates && certificates.length > 0
                          ? certificates[certificates.length - 1].expiration
                          : null
                      }
                      icon={<DrawingPinIcon className="h-6 w-6" />}
                      extraInfo={`${certificates?.length} certificate${
                        certificates && certificates.length !== 1 ? "s" : ""
                      } need${
                        certificates && certificates.length === 1 ? "s" : ""
                      } renewal`}
                      type="certificate"
                      details={certificates?.map((cert) => ({
                        name: cert.name || "",
                        value: cert.expiration || "",
                      }))}
                    />
                  </div>
                </div>
              </div>

              {/* Suggestions Card*/}
              <div className="w-full overflow-hidden">
                <div className="col-span-full overflow-hidden mt-2">
                  <Card className="flex flex-col col-span-full h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BellIcon className="h-6 w-6" />
                        Employee Suggestions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {suggestions && suggestions.length === 0 ? (
                        <p>No suggestions submitted yet.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Submitted By</TableHead>
                                <TableHead>Suggestion</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {suggestions &&
                                suggestions.map((suggestion) => (
                                  <TableRow key={suggestion.id}>
                                    <TableCell>
                                      {suggestion.created_by}
                                    </TableCell>
                                    <TableCell>
                                      {suggestion.suggestion}
                                    </TableCell>
                                    <TableCell>
                                      {new Date(
                                        suggestion.created_at || ""
                                      ).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                      {suggestion.is_read ? (
                                        <Badge
                                          variant="outline"
                                          className="bg-green-100 text-green-800"
                                        >
                                          Replied
                                        </Badge>
                                      ) : (
                                        <Badge
                                          variant="outline"
                                          className="bg-yellow-100 text-yellow-800"
                                        >
                                          Pending
                                        </Badge>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex space-x-2">
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <Button
                                              variant="outline"
                                              disabled={
                                                suggestion.is_read ?? false
                                              }
                                            >
                                              {suggestion.is_read
                                                ? "Replied"
                                                : "Reply"}
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-80">
                                            <SuggestionReplyForm
                                              suggestion={suggestion}
                                              onSubmit={(replyText) =>
                                                Promise.resolve(
                                                  handleReply({
                                                    suggestion,
                                                    replyText,
                                                  })
                                                )
                                              }
                                              onClose={() => {}}
                                            />
                                          </PopoverContent>
                                        </Popover>
                                        {suggestion.is_read && (
                                          <Popover>
                                            <PopoverTrigger asChild>
                                              <Button variant="outline">
                                                View
                                              </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-80">
                                              <div className="space-y-2">
                                                <h4 className="font-medium">
                                                  Reply Sent
                                                </h4>
                                                <p className="text-sm">
                                                  {suggestion.reply}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                  Replied by:{" "}
                                                  {suggestion.replied_by}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                  Replied at:{" "}
                                                  {new Date(
                                                    suggestion.replied_at || ""
                                                  ).toLocaleString()}
                                                </p>
                                              </div>
                                            </PopoverContent>
                                          </Popover>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
              {/* </div> */}
            </TabsContent>

            <TabsContent value="sales">
              {/* Super Admin Only*/}
              <div className="w-full overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 my-2 gap-6 overflow-hidden">
                  {/* File Upload Section */}
                  {flags.is_barchart_enabled.enabled &&
                    (role === "super admin" || role === "dev") && (
                      <Card className="flex flex-col h-full">
                        <CardHeader className="flex-shrink-0">
                          <CardTitle className="flex items-center gap-2">
                            <FilePlusIcon className="h-6 w-6" />
                            Select File To Upload
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col flex-shrink-0 overflow-hidden">
                          <div className="mt-4 rounded-md border">
                            <div className="flex flex-col items-start gap-2 p-2">
                              <label className="flex items-center gap-2 p-2 rounded-md cursor-pointer border border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full">
                                <Input
                                  type="file"
                                  accept=".csv,.xlsx"
                                  onChange={handleFileChange}
                                  className="hidden"
                                />
                                <span>
                                  {fileData?.fileName || "Select File"}
                                </span>
                              </label>
                              <Button
                                variant="outline"
                                onClick={() =>
                                  fileData?.file &&
                                  uploadFileMutation.mutate(fileData.file)
                                }
                                className="w-full"
                                disabled={
                                  uploadFileMutation.isPending ||
                                  !fileData?.file
                                }
                              >
                                {uploadFileMutation.isPending
                                  ? "Uploading..."
                                  : "Upload & Process"}
                              </Button>
                            </div>
                          </div>

                          {uploadFileMutation.isPending && (
                            <Progress
                              value={
                                typeof uploadProgress === "number"
                                  ? uploadProgress
                                  : 0
                              }
                              className="mt-4"
                            />
                          )}
                        </CardContent>
                      </Card>
                    )}

                  {flags.is_barchart_enabled.enabled && (
                    <Card className="flex flex-col h-full">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="flex items-center gap-2">
                          <CalendarIcon className="h-6 w-6" />
                          Select Date For Chart & Table Below
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col flex-shrink-0 overflow-hidden">
                        <div className="mt-8">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full pl-3 text-left font-normal mb-2"
                              >
                                {selectedRange?.start
                                  ? format(selectedRange.start, "PPP")
                                  : "Select Date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <CustomCalendar
                                selectedDate={selectedRange?.start || undefined}
                                onDateChange={handleRangeChange}
                                disabledDays={() => false}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
              {/* </div> */}

              {/* Sales Chart*/}
              {flags.is_barchart_enabled.enabled && (
                <div className="col-span-full overflow-hidden">
                  <Card className="flex flex-col col-span-full mt-2 mb-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChartIcon className="h-6 w-6" />
                        Sales Report Chart
                      </CardTitle>
                    </CardHeader>
                    <div className="overflow-hidden">
                      <ScrollArea
                        className={classNames(
                          styles.noScroll,
                          "w-[calc(100vw-100px)] overflow-auto relative"
                        )}
                      >
                        <CardContent className="flex-grow overflow-auto">
                          <div className="h-full">
                            {selectedRange ? (
                              <SalesRangeStackedBarChart
                                selectedRange={{
                                  start: selectedRange.start,
                                  end: selectedRange.end,
                                }}
                              />
                            ) : (
                              <div>Please select a date range</div>
                            )}
                          </div>
                        </CardContent>
                        <ScrollBar orientation="horizontal" />
                        <ScrollBar orientation="vertical" />
                      </ScrollArea>
                    </div>
                  </Card>
                </div>
              )}

              {/* Sales Report Table*/}
              {flags.is_barchart_enabled.enabled && (
                <div className="col-span-full overflow-hidden mt-2">
                  <Card className="flex flex-col col-span-full h-full">
                    <CardHeader className="flex-shrink-0">
                      <CardTitle className="flex items-center gap-2">
                        <TableIcon className="h-6 w-6" />
                        Sales Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col max-h-[calc(100vh-600px)] overflow-hidden">
                      <Suspense fallback={<div></div>}>
                        <div className=" overflow-hidden ">
                          <LazySalesDataTable
                            startDate={
                              selectedRange?.start
                                ? format(selectedRange.start, "yyyy-MM-dd")
                                : "N/A"
                            }
                            endDate={
                              selectedRange?.end
                                ? format(selectedRange.end, "yyyy-MM-dd")
                                : "N/A"
                            }
                          />
                        </div>
                      </Suspense>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="sales-employee">
              <div className="w-full overflow-hidden">
                <Card className="flex flex-col col-span-full h-full">
                  <CardHeader className="flex-shrink-0">
                    <CardTitle className="flex items-center gap-2">
                      <TableIcon className="h-6 w-6" />
                      Sales by Employee
                    </CardTitle>
                  </CardHeader>
                  <ScrollArea
                    className={classNames(
                      styles.noScroll,
                      "h-[calc(100vh-300px)] overflow-auto relative"
                    )}
                  >
                    <CardContent className="flex-grow overflow-auto">
                      <Suspense fallback={<div>Loading...</div>}>
                        <SalesDataTableAllEmployees />
                      </Suspense>
                    </CardContent>
                    <ScrollBar orientation="vertical" />
                  </ScrollArea>
                </Card>
              </div>
            </TabsContent>
          </div>

          <TabsContent value="metrics">
            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-6 mx-auto max-w-[calc(100vw-100px)] overflow-hidden">
              <Card>
                <CardHeader>
                  <CardTitle>2024 Sales Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center p-4">
                      Loading metrics...
                    </div>
                  ) : (
                    <>
                      <div className="rounded-md border mb-6">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            {table.getHeaderGroups().map((headerGroup) => (
                              <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                  <th
                                    key={header.id}
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                  >
                                    {flexRender(
                                      header.column.columnDef.header,
                                      header.getContext()
                                    )}
                                  </th>
                                ))}
                              </tr>
                            ))}
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {table.getRowModel().rows.map((row) => (
                              <tr key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                  <td
                                    key={cell.id}
                                    className="px-6 py-4 whitespace-nowrap"
                                  >
                                    {flexRender(
                                      cell.column.columnDef.cell,
                                      cell.getContext()
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <Card>
                        <CardHeader>
                          <CardTitle>Customer Visit Frequency</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-4">
                            {metrics?.customerFrequency.map((freq) => (
                              <Card key={freq.visits} className="bg-muted/50">
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-sm font-medium">
                                    {freq.visits}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="text-2xl font-bold">
                                    {freq.percentage}%
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    of total customers
                                  </p>
                                  <div className="mt-2 h-2 w-full bg-secondary rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-primary"
                                      style={{ width: `${freq.percentage}%` }}
                                    />
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Revenue Analysis Chart*/}
              <AnnualRevenueBarChart />
            </div>
          </TabsContent>

          {/* </div> */}
        </Tabs>
      </div>
    </RoleBasedWrapper>
  );

  function ReportCard({
    title,
    date,
    icon,
    extraInfo,
    type,
    details,
  }: {
    title: string;
    date: string | Date | null;
    icon: React.ReactNode;
    extraInfo?: string;
    type?: string;
    details?: Certificate[] | { name: string; value: string }[];
  }) {
    const timeZone = "America/Los_Angeles";

    const formatLocalDate = (dateValue: string | Date) => {
      if (!dateValue) return "N/A";

      const parsedDate =
        typeof dateValue === "string" ? parseISO(dateValue) : dateValue;
      const zonedDate = toZonedTime(parsedDate, timeZone);

      return formatTZ(zonedDate, "PPP", { timeZone });
    };

    const isSubmitted = () => {
      if (!date) return false;

      const submissionDate = typeof date === "string" ? parseISO(date) : date;
      const currentDate = new Date();
      const oneDayAgo = new Date(currentDate);
      oneDayAgo.setDate(currentDate.getDate() - 1);
      oneDayAgo.setHours(0, 0, 0, 0);
      const sevenDaysAgo = new Date(currentDate);
      sevenDaysAgo.setDate(currentDate.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      if (type === "maintenance") {
        return submissionDate >= sevenDaysAgo;
      } else if (type === "certificate") {
        return false;
      } else if (type === "dailyChecklist") {
        return submissionDate >= oneDayAgo;
      } else {
        return submissionDate >= oneDayAgo;
      }
    };

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {DOMPurify.sanitize(title)}
          </CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          {date ? (
            <>
              <p className="text-sm text-gray-500">
                {DOMPurify.sanitize(
                  type === "certificate"
                    ? "Oldest expiration:"
                    : type === "dailyChecklist"
                    ? "Last updated:"
                    : "Last submitted:"
                )}
              </p>
              <p className="font-semibold">
                {DOMPurify.sanitize(formatLocalDate(date))}
              </p>
              {extraInfo && (
                <p className="text-sm text-gray-500">
                  {DOMPurify.sanitize(
                    `${
                      type === "maintenance"
                        ? "Firearm:"
                        : type === "deposit"
                        ? "Employee:"
                        : type === "certificate"
                        ? "Total:"
                        : type === "dailyChecklist"
                        ? "Firearms down for service:"
                        : "By:"
                    } ${extraInfo}`
                  )}
                </p>
              )}
              <div className="flex items-center mt-2">
                {type === "certificate" ? (
                  <>
                    <CrossCircledIcon className="text-red-500 mr-2" />
                    <Badge
                      variant="outline"
                      className="bg-red-100 text-red-800"
                    >
                      Renewals Needed
                    </Badge>
                  </>
                ) : isSubmitted() ? (
                  <>
                    <CheckCircledIcon className="text-green-500 mr-2" />
                    <Badge
                      variant="outline"
                      className="bg-green-100 text-green-800"
                    >
                      Submitted
                    </Badge>
                  </>
                ) : (
                  <>
                    <CrossCircledIcon className="text-red-500 mr-2" />
                    <Badge
                      variant="outline"
                      className="bg-red-100 text-red-800"
                    >
                      Not Submitted
                    </Badge>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-500">No submission found</p>
              <div className="flex items-center mt-2">
                <CrossCircledIcon className="text-red-500 mr-2" />
                <Badge variant="outline" className="bg-red-100 text-red-800">
                  Not Submitted
                </Badge>
              </div>
            </>
          )}
          {details && details.length > 0 && (
            <ScrollArea
              className={classNames(
                styles.noScroll,
                "h-[calc(100vh-1200px)] relative"
              )}
            >
              <ul className="space-y-2 pr-4">
                {details.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between space-x-2"
                  >
                    {"certificate" in item ? (
                      <>
                        <span className="flex-shrink-0 w-1/4 truncate">
                          {DOMPurify.sanitize(item.name)}
                        </span>
                        <span className="flex-shrink-0 w-1/4 truncate">
                          {DOMPurify.sanitize(item.certificate)}
                        </span>
                        <span className="flex-shrink-0 w-1/4 truncate">
                          {DOMPurify.sanitize(item.action_status)}
                        </span>
                        <Badge variant="destructive">
                          {DOMPurify.sanitize(
                            new Date(item.expiration).toLocaleDateString()
                          )}
                        </Badge>
                      </>
                    ) : (
                      <>
                        <span className="flex-shrink-0 w-1/2 truncate">
                          {DOMPurify.sanitize(item.name)}
                        </span>
                        <Badge variant="secondary">
                          ${DOMPurify.sanitize(item.value)}
                        </Badge>
                      </>
                    )}
                  </li>
                ))}
              </ul>
              <ScrollBar orientation="vertical" />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    );
  }
}
export default function AdminDashboard() {
  return <AdminDashboardContent />;
}
