"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  HydrationBoundary,
} from "@tanstack/react-query";
import { dehydrate, hydrate, QueryClient } from "@tanstack/react-query";
import { GetServerSideProps } from "next";
import DOMPurify from "isomorphic-dompurify";
import { Suspense, useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CustomCalendar } from "@/components/ui/calendar";
import { parseISO } from "date-fns";
import { format as formatTZ, toZonedTime } from "date-fns-tz";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import styles from "./table.module.css";
import {
  CheckCircledIcon,
  CrossCircledIcon,
  ClipboardIcon,
  PersonIcon,
  BarChartIcon,
  MagnifyingGlassIcon,
  DrawingPinIcon,
  BellIcon,
  CalendarIcon,
  TableIcon,
  FilePlusIcon,
} from "@radix-ui/react-icons";
import { format, formatDate, formatDistanceToNow } from "date-fns";
import SalesRangeStackedBarChart from "@/app/admin/reports/charts/SalesRangeStackedBarChart";
import SalesDataTable from "../sales/sales-data-table";
import { ScrollBar, ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import classNames from "classnames";
import { Input } from "@/components/ui/input";
import Papa, { ParseResult } from "papaparse";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { useRole } from "@/context/RoleContext";
import { Textarea } from "@/components/ui/textarea";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import DailyChecklist from "@/app/TGR/gunsmithing/DailyChecklist";
import Todos from "../../todo/todos";
import ClearActions from "../../todo/clear-actions";
import Todo from "../../todo/todo";
import TodoWrapper from "../../todo/todo-wrapper";
import { useFlags } from "flagsmith/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import LoadingIndicator from "@/components/LoadingIndicator";
import dynamic from "next/dynamic";

interface Certificate {
  id: number;
  name: string;
  certificate: string; // Add this line
  action_status: string;
  expiration: Date;
}

interface SalesDataResponse {
  totalGross: number;
  totalNet: number;
  totalNetMinusExclusions: number;
  salesData: Array<{
    category_label: string;
    total_gross: number;
    total_net: number;
    // Add other fields as needed
  }>;
}

interface Gunsmith {
  last_maintenance_date: string;
  firearm_name: string;
}

interface Checklist {
  submission_date: string;
  submitted_by_name: string;
}

interface RangeWalk {
  date_of_walk: string;
  user_name: string;
}

interface Domain {
  id: number;
  domain: string;
}

interface DailyDeposit {
  id: number;
  register: string;
  employee_name: string;
  total_to_deposit: number;
  created_at: string;
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

const timeZone = "America/Los_Angeles";

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

  const setNewDomainMutation = useMutation({
    mutationFn: (value: string) => Promise.resolve(value),
    onSuccess: (newValue) => {
      queryClient.setQueryData(["newDomain"], newValue);
    },
  });

  const setEditingDomainMutation = useMutation({
    mutationFn: (value: Domain | null) => Promise.resolve(value),
    onSuccess: (newValue) => {
      queryClient.setQueryData(["editingDomain"], newValue);
    },
  });

  const { data: suggestions } = useQuery({
    queryKey: ["suggestions"],
    queryFn: fetchSuggestions,
  });
  const { data: certificates } = useQuery({
    queryKey: ["certificates"],
    queryFn: fetchCertificates,
  });
  const { data: rangeWalk } = useQuery({
    queryKey: ["rangeWalk"],
    queryFn: fetchLatestRangeWalkReport,
  });
  const { data: checklist } = useQuery({
    queryKey: ["checklist"],
    queryFn: fetchLatestChecklistSubmission,
  });
  const { data: gunsmiths } = useQuery({
    queryKey: ["gunsmiths"],
    queryFn: fetchLatestGunsmithMaintenance,
  });
  const { data: dailyDeposit } = useQuery({
    queryKey: ["dailyDeposit"],
    queryFn: fetchLatestDailyDeposit,
  });
  const { data: dailyChecklistStatus } = useQuery({
    queryKey: ["dailyChecklistStatus"],
    queryFn: fetchDailyChecklistStatus,
  });

  const { data: replyText, refetch: refetchReplyText } = useQuery({
    queryKey: ["replyText"],
    queryFn: () => "",
    staleTime: Infinity,
  });

  //Mutations
  const handleSuggestionReplyMutation = useMutation({
    mutationFn: ({
      suggestion,
      replyText,
    }: {
      suggestion: Suggestion;
      replyText: string;
    }) => {
      if (!suggestion.id) {
        return Promise.reject(new Error("Suggestion ID is missing"));
      }

      return Promise.resolve(
        supabase.auth.getUser().then(({ data: { user }, error: userError }) => {
          if (userError) throw userError;

          const fullName = user?.user_metadata?.name || "";
          const firstName = fullName.split(" ")[0];
          const replierName = firstName || "Admin";

          return Promise.resolve(
            supabase
              .from("employee_suggestions")
              .update({
                is_read: true,
                replied_by: replierName,
                replied_at: new Date().toISOString(),
                reply: replyText,
              })
              .eq("id", suggestion.id)
              .then(({ error }) => {
                if (error) throw error;

                return Promise.resolve(
                  sendEmail(
                    suggestion.email || "",
                    "Reply to Your Suggestion",
                    "SuggestionReply",
                    {
                      employeeName: suggestion.created_by,
                      originalSuggestion: suggestion.suggestion,
                      replyText: replyText,
                      repliedBy: replierName,
                    }
                  ).then(() => ({ suggestion, replyText }))
                );
              })
          );
        })
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
      toast.success("Reply sent successfully!");
    },
    onError: (error) => {
      // console.error("Error sending reply:", error);
      toast.error("Failed to send reply. Please try again.");
    },
  });

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

  const handleReplyTextChangeMutation = useMutation({
    mutationFn: ({
      suggestionId,
      text,
    }: {
      suggestionId: number;
      text: string;
    }) => {
      return Promise.resolve({ suggestionId, text });
    },
    onSuccess: ({ suggestionId, text }) => {
      queryClient.setQueryData(["replyStates"], (old: ReplyStates = {}) => ({
        ...old,
        [suggestionId]: text,
      }));
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

  const handleReplyTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateReplyTextMutation.mutate(e.target.value);
  };

  const { data: selectedRange, refetch: refetchSelectedRange } = useQuery({
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
  const { data: salesData, refetch: refetchSalesData } = useQuery({
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

  const totalGross = salesData?.totalGross ?? 0;
  const totalNet = salesData?.totalNet ?? 0;
  const totalNetMinusExclusions = salesData?.totalNetMinusExclusions ?? 0;

  // Keep your existing fileData query
  const { data: fileData, refetch: refetchFileData } = useQuery({
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

  const addDomainMutation = useMutation({
    mutationFn: addDomain,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["domains"] }),
  });

  const updateDomainMutation = useMutation({
    mutationFn: updateDomain,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["domains"] }),
  });

  const deleteDomainMutation = useMutation({
    mutationFn: deleteDomain,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["domains"] }),
  });

  const handleReplyMutation = useMutation({
    mutationFn: ({
      suggestion,
      replyText,
    }: {
      suggestion: Suggestion;
      replyText: string;
    }) => handleReply({ suggestion, replyText }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["suggestions"] }),
  });

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
    mutationFn: ({
      suggestion,
      replyText,
    }: {
      suggestion: Suggestion;
      replyText: string;
    }) => {
      return Promise.resolve(
        supabase.auth.getUser().then(({ data: { user }, error: userError }) => {
          if (userError) throw userError;

          const fullName = user?.user_metadata?.name || "";
          const firstName = fullName.split(" ")[0];
          const replierName = firstName || "Admin";

          return Promise.resolve(
            supabase
              .from("employee_suggestions")
              .update({
                is_read: true,
                replied_by: replierName,
                replied_at: new Date().toISOString(),
                reply: replyText,
              })
              .eq("id", suggestion.id)
              .then(({ error }) => {
                if (error) throw error;

                return Promise.resolve(
                  sendEmail(
                    suggestion.email || "",
                    "Reply to Your Suggestion",
                    "SuggestionReply",
                    {
                      employeeName: suggestion.created_by,
                      originalSuggestion: suggestion.suggestion,
                      replyText: replyText,
                      repliedBy: replierName,
                    }
                  ).then(() => ({ suggestion, replyText }))
                );
              })
          );
        })
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
      toast.success("Reply sent successfully!");
    },
    onError: (error) => {
      // console.error("Error sending reply:", error);
      toast.error("Failed to send reply. Please try again.");
    },
  });

  const { data: uploadProgress = 0 } = useQuery({
    queryKey: ["uploadProgress"],
    queryFn: () => queryClient.getQueryData(["uploadProgress"]) ?? 0,
    enabled: uploadFileMutation.isPending,
  });

  const handleSubmit = () => {
    if (fileData?.file) {
      uploadFileMutation.mutate(fileData.file);
    } else {
      toast.error("No file selected.");
    }
  };

  function fetchDomains() {
    return Promise.resolve(
      supabase
        .from("employee_domains")
        .select("*")
        .order("domain")
        .then(({ data, error }) => {
          if (error) throw error;
          return data;
        })
    );
  }

  function fetchSuggestions() {
    return Promise.resolve(
      supabase
        .from("employee_suggestions")
        .select("*")
        .order("created_at", { ascending: false })
        .then(({ data, error }) => {
          if (error) throw error;
          return data;
        })
    );
  }

  function fetchCertificates() {
    return Promise.resolve(
      supabase
        .from("certifications")
        .select("*")
        .lt(
          "expiration",
          new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
        )
        .order("expiration", { ascending: true })
        .then(({ data, error }) => {
          if (error) throw error;
          return data;
        })
    );
  }

  function fetchLatestRangeWalkReport() {
    return Promise.resolve(
      supabase
        .from("range_walk_reports")
        .select("*")
        .order("date_of_walk", { ascending: false })
        .limit(1)
        .single()
        .then(({ data, error }) => {
          if (error) throw error;
          return data;
        })
    );
  }

  function fetchLatestChecklistSubmission() {
    return Promise.resolve(
      supabase
        .from("checklist_submissions")
        .select("*")
        .order("submission_date", { ascending: false })
        .limit(1)
        .single()
        .then(({ data, error }) => {
          if (error) throw error;
          return data;
        })
    );
  }

  function fetchLatestGunsmithMaintenance() {
    return Promise.resolve(
      supabase
        .from("firearms_maintenance")
        .select("id, firearm_name, last_maintenance_date")
        .order("last_maintenance_date", { ascending: false })
        .limit(5)
        .not("last_maintenance_date", "is", null)
        .then(({ data, error }) => {
          if (error) throw error;
          return data && data.length > 0 ? data[0] : null;
        })
    );
  }

  function fetchLatestDailyDeposit() {
    return Promise.resolve(
      supabase
        .from("daily_deposits")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()
        .then(({ data, error }) => {
          if (error) throw error;
          return data;
        })
    );
  }

  function fetchDailyChecklistStatus() {
    return Promise.resolve(
      supabase
        .from("firearms_maintenance")
        .select("id, last_maintenance_date")
        .eq("rental_notes", "With Gunsmith")
        .then(({ data, error }) => {
          if (error) throw error;

          const firearmsCount = data.length;
          const lastSubmission = data.reduce(
            (latest: string | null, current) => {
              return latest && latest > (current.last_maintenance_date ?? "")
                ? latest
                : current.last_maintenance_date ?? null;
            },
            null
          );

          const submitted = lastSubmission
            ? new Date(lastSubmission) >
              new Date(Date.now() - 24 * 60 * 60 * 1000)
            : false;

          return {
            submitted,
            lastSubmissionDate: lastSubmission,
            firearmsCount,
          };
        })
    );
  }

  function fetchLatestSalesData(startDate: Date, endDate: Date) {
    const utcStartDate = new Date(startDate.toUTCString().slice(0, -4));
    const utcEndDate = new Date(endDate.toUTCString().slice(0, -4));

    return Promise.resolve(
      fetch("/api/fetch-sales-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate: utcStartDate.toISOString(),
          endDate: utcEndDate.toISOString(),
        }),
      }).then((response) => {
        if (!response.ok) {
          throw new Error("Error fetching sales data");
        }

        return response.json().then((responseData) => {
          let salesData;

          if (Array.isArray(responseData)) {
            salesData = responseData;
          } else if (responseData && Array.isArray(responseData.data)) {
            salesData = responseData.data;
          } else {
            throw new Error("Unexpected data format");
          }

          const excludeCategoriesFromChart = [
            "CA Tax Gun Transfer",
            "CA Tax Adjust",
            "CA Excise Tax",
            "CA Excise Tax Adjustment",
          ];

          const excludeCategoriesFromTotalNet = [
            "Pistol",
            "Rifle",
            "Revolver",
            "Shotgun",
            "Receiver",
            ...excludeCategoriesFromChart,
          ];

          let totalGross = 0;
          let totalNetMinusExclusions = 0;
          let totalNet = 0;

          interface SalesItem {
            category_label: string;
            total_gross: number;
            total_net: number;
          }

          salesData.forEach((item: SalesItem) => {
            const category = item.category_label;
            const grossValue = item.total_gross ?? 0;
            const netValue = item.total_net ?? 0;

            totalGross += grossValue;
            totalNet += netValue;

            if (!excludeCategoriesFromTotalNet.includes(category)) {
              totalNetMinusExclusions += netValue;
            }
          });

          return { totalGross, totalNet, totalNetMinusExclusions, salesData };
        });
      })
    );
  }

  function addDomain(newDomain: string) {
    return Promise.resolve(
      supabase
        .from("employee_domains")
        .insert({ domain: newDomain.toLowerCase() })
        .then(({ error }) => {
          if (error) throw error;
        })
    );
  }

  function updateDomain(domain: Domain) {
    return Promise.resolve(
      supabase
        .from("employee_domains")
        .update({ domain: domain.domain.toLowerCase() })
        .eq("id", domain.id)
        .then(({ error }) => {
          if (error) throw error;
        })
    );
  }

  function deleteDomain(id: number) {
    return Promise.resolve(
      supabase
        .from("employee_domains")
        .delete()
        .eq("id", id)
        .then(({ error }) => {
          if (error) throw error;
        })
    );
  }

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
                      .then(({ data: insertedData, error }) => {
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

  function getServerSideProps() {
    const queryClient = new QueryClient();

    return Promise.resolve(
      Promise.all([
        queryClient.prefetchQuery({
          queryKey: ["domains"],
          queryFn: fetchDomains,
        }),
        queryClient.prefetchQuery({
          queryKey: ["suggestions"],
          queryFn: fetchSuggestions,
        }),
        queryClient.prefetchQuery({
          queryKey: ["certificates"],
          queryFn: fetchCertificates,
        }),
        queryClient.prefetchQuery({
          queryKey: ["rangeWalk"],
          queryFn: fetchLatestRangeWalkReport,
        }),
        queryClient.prefetchQuery({
          queryKey: ["checklist"],
          queryFn: fetchLatestChecklistSubmission,
        }),
        queryClient.prefetchQuery({
          queryKey: ["gunsmiths"],
          queryFn: fetchLatestGunsmithMaintenance,
        }),
        queryClient.prefetchQuery({
          queryKey: ["dailyDeposit"],
          queryFn: fetchLatestDailyDeposit,
        }),
        queryClient.prefetchQuery({
          queryKey: ["dailyChecklistStatus"],
          queryFn: fetchDailyChecklistStatus,
        }),
      ]).then(() => ({
        props: {
          dehydratedState: dehydrate(queryClient),
        },
      }))
    );
  }

  function convertDateFormat(date: string) {
    if (!date) return "";
    const [month, day, year] = date.split("/");
    if (!month || !day || !year) return "";
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  function sendEmail(
    email: string,
    subject: string,
    templateName: string,
    templateData: any
  ) {
    return Promise.resolve(
      fetch("/api/send_email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, subject, templateName, templateData }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((result) => {
          // console.log("Email sent successfully:", result);
          return result;
        })
        .catch((error: any) => {
          // console.error("Failed to send email:", error.message);
          throw error;
        })
    );
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
    <RoleBasedWrapper allowedRoles={["admin", "super admin", "dev"]}>
      <div className="relative section w-full overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50">
            <LoadingIndicator />
          </div>
        )}
        <h1 className="text-3xl font-bold ml-8 mt-14 mb-10">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mx-auto max-w-[calc(100vw-100px)] overflow-hidden">
          {/*todo card*/}
          {flags.is_todo_enabled.enabled && (
            <div className="w-full overflow-hidden">
              <div className="w-full overflow-hidden">
                <div className="h-full overflow-hidden">
                  <div className="flex items-center gap-4 pb-4">
                    <CheckCircledIcon className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                    <h1 className="font-semibold text-2xl">Todos</h1>
                  </div>
                  <TodoWrapper />
                </div>
              </div>
            </div>
          )}

          {/*All Report cards*/}
          <div className="w-full overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 overflow-hidden">
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
                    value: dailyDeposit?.total_to_deposit?.toFixed(2) || "0.00",
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

          {/* Suggestions Card*/}
          <div className="w-full overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 overflow-hidden">
              <Card className="col-span-full">
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
                                <TableCell>{suggestion.created_by}</TableCell>
                                <TableCell>{suggestion.suggestion}</TableCell>
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
                                          disabled={suggestion.is_read ?? false}
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

          {/* Super Admin Only*/}

          <div className="w-full overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 my-2 gap-6 overflow-hidden">
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
                            <span>{fileData?.fileName || "Select File"}</span>
                          </label>
                          <Button
                            variant="outline"
                            onClick={() =>
                              fileData?.file &&
                              uploadFileMutation.mutate(fileData.file)
                            }
                            className="w-full"
                            disabled={
                              uploadFileMutation.isPending || !fileData?.file
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
                        <PopoverContent className="w-auto p-0" align="start">
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

          {/* Sales Chart*/}
          {flags.is_barchart_enabled.enabled && (
            <div className="col-span-full overflow-hidden">
              {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-hidden">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <CalendarIcon className="h-6 w-6" />
                      Select Date For Chart & Table
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-shrink-0 overflow-hidden">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full pl-3 text-left font-normal mb-2"
                        >
                          {selectedRange?.start
                            ? format(selectedRange.start, "PPP")
                            : "Select Date"}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CustomCalendar
                          selectedDate={selectedRange?.start || undefined}
                          onDateChange={handleRangeChange}
                          disabledDays={() => false}
                        />
                      </PopoverContent>
                    </Popover>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Gross Sales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${totalGross?.toFixed(2) || "N/A"}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Net Sales With Firearms
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${totalNet?.toFixed(2) || "N/A"}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Net Sales Without Firearms
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${totalNetMinusExclusions?.toFixed(2) || "N/A"}
                    </div>
                  </CardContent>
                </Card>
              </div> */}

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
                      "w-[calc(100vw-90px)] overflow-auto relative"
                    )}
                  >
                    <CardContent className="flex-grow overflow-auto">
                      <div className="h-[650px]">
                        {/* <Suspense
                          fallback={
                            <div>
                              <LoadingIndicator />
                            </div>
                          }
                        > */}
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
                        {/* </Suspense> */}
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
        </div>
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
