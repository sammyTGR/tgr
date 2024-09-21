"use client";

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
import { ResponsiveContainer } from "recharts";
import { parseISO } from "date-fns";
import { format as formatTZ, toZonedTime } from "date-fns-tz";
import ChatClient from "../../../TGR/crew/chat/page";
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

interface Certificate {
  id: number;
  name: string;
  certificate: string; // Add this line
  action_status: string;
  expiration: Date;
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
  created_at: string;
  is_read: boolean;
  replied_by: string | null;
  replierName: string | null;
  replied_at: string | null;
  reply: string | null; // Add this line
  email: string;
}

const timeZone = "America/Los_Angeles";

export default function AdminDashboard() {
  const { role, loading: roleLoading } = useRole();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
  const [rangeWalk, setRangeWalk] = useState<RangeWalk | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [gunsmiths, setGunsmiths] = useState<Gunsmith | null>(null);
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [salesData, setSalesData] = useState(null);
  const [dailyDeposit, setDailyDeposit] = useState<DailyDeposit | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileInputKey, setFileInputKey] = useState<number>(0);
  const [replyText, setReplyText] = useState<string>("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [totalGross, setTotalGross] = useState<number>(0);
  const [totalNet, setTotalNet] = useState<number>(0);
  const [totalNetMinusExclusions, setTotalNetMinusExclusions] =
    useState<number>(0);
  const [selectedRange, setSelectedRange] = useState(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0); // Set to start of the day

    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setHours(23, 59, 59, 999); // Set to end of the day

    return {
      start: yesterday,
      end: endOfYesterday,
    };
  });

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

  useEffect(() => {
    const channel = supabase.channel("custom-all-channel");

    channel
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "firearms_maintenance" },
        (payload) => {
          // console.log("Firearms maintenance change received!", payload);
          fetchLatestGunsmithMaintenance();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sales_data" },
        (payload) => {
          // console.log("Sales data change received!", payload);
          fetchLatestSalesData(selectedRange.start, selectedRange.end);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_deposits" },
        (payload) => {
          fetchLatestDailyDeposit();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "checklist_submissions" },
        (payload) => {
          // console.log("Checklist submission change received!", payload);
          fetchLatestChecklistSubmission();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "range_walk_reports" },
        (payload) => {
          // console.log("Range walk report change received!", payload);
          fetchLatestRangeWalkReport();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "certifications" },
        (payload) => {
          // console.log("Certifications change received!", payload);
          fetchCertificates();
        }
      )
      .subscribe();

    // Initial data fetch
    const fetchInitialData = async () => {
      fetchLatestDailyDeposit();
      fetchLatestGunsmithMaintenance();
      fetchLatestChecklistSubmission();
      fetchLatestRangeWalkReport();
      fetchCertificates();

      const result = await fetchLatestSalesData(
        selectedRange.start,
        selectedRange.end
      );
      if (result) {
        const { totalGross, totalNet, totalNetMinusExclusions, salesData } =
          result;
        setTotalGross(totalGross);
        setTotalNet(totalNet);
        setTotalNetMinusExclusions(totalNetMinusExclusions);
        setSalesData(salesData);

        // console.log("Initial data fetch:", {
        //   totalGross,
        //   totalNet,
        //   totalNetMinusExclusions,
        // });
      }
    };

    fetchInitialData();

    // Cleanup function
    return () => {
      channel.unsubscribe();
    };
  }, []);

  async function fetchLatestDailyDeposit() {
    const { data, error } = await supabase
      .from("daily_deposits")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error("Error fetching latest daily deposit:", error);
    } else {
      setDailyDeposit(data);
    }
  }

  const handleRangeChange = async (date: Date | undefined) => {
    if (date) {
      const newStart = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      const newEnd = new Date(newStart);
      newEnd.setHours(23, 59, 59, 999);

      setSelectedRange({ start: newStart, end: newEnd });

      const result = await fetchLatestSalesData(newStart, newEnd);
      if (result) {
        const { totalGross, totalNet, totalNetMinusExclusions, salesData } =
          result;
        setTotalGross(totalGross);
        setTotalNet(totalNet);
        setTotalNetMinusExclusions(totalNetMinusExclusions);
        setSalesData(salesData);

        // console.log("Updated state:", {
        //   totalGross,
        //   totalNet,
        //   totalNetMinusExclusions,
        // });
      }
    }
  };

  async function fetchLatestSalesData(startDate: Date, endDate: Date) {
    const utcStartDate = new Date(startDate.toUTCString().slice(0, -4));
    const utcEndDate = new Date(endDate.toUTCString().slice(0, -4));

    const response = await fetch("/api/fetch-sales-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate: utcStartDate.toISOString(),
        endDate: utcEndDate.toISOString(),
      }),
    });

    if (response.ok) {
      const responseData = await response.json();
      let salesData;

      if (Array.isArray(responseData)) {
        salesData = responseData;
      } else if (responseData && Array.isArray(responseData.data)) {
        salesData = responseData.data;
      } else {
        console.error("Unexpected data format:", responseData);
        return null;
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

      salesData.forEach((item: any) => {
        const category = item.category_label;
        const grossValue = item.total_gross ?? 0;
        const netValue = item.total_net ?? 0;

        totalGross += grossValue;
        totalNet += netValue;

        if (!excludeCategoriesFromTotalNet.includes(category)) {
          totalNetMinusExclusions += netValue;
        }
      });

      // console.log("Calculated totals:", {
      //   totalGross,
      //   totalNet,
      //   totalNetMinusExclusions,
      // });

      return { totalGross, totalNet, totalNetMinusExclusions, salesData };
    } else {
      console.error("Error fetching sales data:", response.statusText);
      return null;
    }
  }

  async function fetchLatestGunsmithMaintenance() {
    // console.log("Fetching latest gunsmith maintenance...");
    const { data, error } = await supabase
      .from("firearms_maintenance")
      .select("id, firearm_name, last_maintenance_date")
      .order("last_maintenance_date", { ascending: false })
      .limit(5) // Fetch the top 5 to see if there are any recent entries
      .not("last_maintenance_date", "is", null); // Ensure we only get entries with a maintenance date

    if (error) {
      console.error("Error fetching latest gunsmith maintenance:", error);
    } else {
      // console.log("Fetched gunsmith maintenance data:", data);
      if (data && data.length > 0) {
        // Set the first (most recent) entry
        setGunsmiths(data[0]);
        // console.log("Most recent maintenance:", data[0]);
      } else {
        // console.log("No gunsmith maintenance data found");
        setGunsmiths(null);
      }
    }
  }

  async function fetchLatestChecklistSubmission() {
    const { data, error } = await supabase
      .from("checklist_submissions")
      .select("*")
      .order("submission_date", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error("Error fetching latest checklist submission:", error);
    } else {
      setChecklist(data);
    }
  }

  async function fetchLatestRangeWalkReport() {
    const { data, error } = await supabase
      .from("range_walk_reports")
      .select("*")
      .order("date_of_walk", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error("Error fetching latest range walk report:", error);
    } else {
      setRangeWalk(data);
    }
  }

  async function fetchCertificates() {
    const { data, error } = await supabase
      .from("certifications")
      .select("*")
      .lt(
        "expiration",
        new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
      ) // Expiring in the next 60 days
      .order("expiration", { ascending: true });

    if (error) {
      console.error("Error fetching certificates:", error);
    } else {
      setCertificates(data);
    }
  }

  function formatDate(dateString: string) {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  }

  useEffect(() => {
    fetchDomains();
  }, []);

  async function fetchDomains() {
    const { data, error } = await supabase
      .from("employee_domains")
      .select("*")
      .order("domain");

    if (error) {
      console.error("Error fetching domains:", error.message);
    } else {
      setDomains(data as Domain[]);
    }
  }

  async function addDomain() {
    const { error } = await supabase
      .from("employee_domains")
      .insert({ domain: newDomain.toLowerCase() });

    if (error) {
      console.error("Error adding domain:", error.message);
    } else {
      setNewDomain("");
      fetchDomains();
    }
  }

  async function updateDomain() {
    if (!editingDomain) return;

    const { error } = await supabase
      .from("employee_domains")
      .update({ domain: editingDomain.domain.toLowerCase() })
      .eq("id", editingDomain.id);

    if (error) {
      console.error("Error updating domain:", error.message);
    } else {
      setEditingDomain(null);
      fetchDomains();
    }
  }

  async function deleteDomain(id: number) {
    const { error } = await supabase
      .from("employee_domains")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting domain:", error.message);
    } else {
      fetchDomains();
    }
  }

  const convertDateFormat = (date: string) => {
    if (!date) return "";
    const [month, day, year] = date.split("/");
    if (!month || !day || !year) return "";
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  };

  const handleFileUpload = async (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          const keys = jsonData[0] as string[];
          const formattedData = jsonData.slice(1).map((row: any) => {
            const rowData: any = {};
            keys.forEach((key, index) => {
              rowData[key] = row[index];
            });

            const categoryLabel = categoryMap.get(parseInt(rowData.Cat)) || "";
            const subcategoryKey = `${rowData.Cat}-${rowData.Sub}`;
            const subcategoryLabel = subcategoryMap.get(subcategoryKey) || "";

            return {
              ...rowData,
              Date: convertDateFormat(rowData.Date),
              category_label: categoryLabel,
              subcategory_label: subcategoryLabel,
            };
          });

          // Process in smaller batches
          const batchSize = 100;
          let processedCount = 0;
          for (let i = 0; i < formattedData.length; i += batchSize) {
            const batch = formattedData.slice(i, i + batchSize);
            const { data: insertedData, error } = await supabase
              .from("sales_data")
              .upsert(batch);

            if (error) {
              console.error("Error upserting data batch:", error);
              // Continue with the next batch instead of rejecting
            } else {
              processedCount += batch.length;
            }

            // Update progress
            setProgress((processedCount / formattedData.length) * 100);
          }

          // console.log(
          //   `Successfully processed ${processedCount} records out of ${formattedData.length} total records`
          // );
          resolve();
        } catch (error) {
          console.error("Error processing data:", error);
          reject(error);
        }
      };

      reader.onerror = (error) => {
        console.error("Error reading file:", error);
        reject(error);
      };

      reader.readAsArrayBuffer(file);
    });
  };

  const handleSubmit = async () => {
    if (file) {
      setLoading(true);
      setProgress(0);

      try {
        await handleFileUpload(file);

        // Check the current record count
        const { count, error } = await supabase
          .from("sales_data")
          .select("*", { count: "exact", head: true });

        if (error) {
          console.error("Error checking record count:", error);
          toast.error("Failed to verify data upload.");
        } else {
          toast.success(`Successfully uploaded ${count} records.`);
        }

        setFile(null);
        setFileName(null);
        setFileInputKey((prevKey) => prevKey + 1);
      } catch (error) {
        console.error("Error during upload and processing:", error);
        toast.error("Failed to upload and process file.");
      } finally {
        setLoading(false);
        setProgress(100);
      }
    } else {
      toast.error("No file selected.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setFileName(e.target.files[0].name);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  async function fetchSuggestions() {
    const { data, error } = await supabase
      .from("employee_suggestions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching suggestions:", error);
    } else {
      setSuggestions(data || []);
    }
  }

  // Add this function at the top of your component or in a separate utility file
  const sendEmail = async (
    email: string,
    subject: string,
    templateName: string,
    templateData: any
  ) => {
    try {
      const response = await fetch("/api/send_email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, subject, templateName, templateData }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      // console.log("Email sent successfully:", result);
    } catch (error: any) {
      console.error("Failed to send email:", error.message);
      throw error; // Re-throw the error so we can handle it in the calling function
    }
  };

  // Now update the handleReply function
  async function handleReply(suggestion: Suggestion) {
    if (!replyText.trim()) {
      toast.error("Please enter a reply");
      return;
    }

    // Get the current user's information from Supabase
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("Error getting current user:", userError);
      toast.error("Failed to get current user information");
      return;
    }

    console.log("Current user data:", user); // Log the entire user object

    const fullName = user?.user_metadata?.name || "";
    const firstName = fullName.split(" ")[0]; // This will get the first word of the name
    const replierName = firstName || "Admin";
    // console.log("Replier name:", replierName); // Log the replier name

    const { error } = await supabase
      .from("employee_suggestions")
      .update({
        is_read: true,
        replied_by: replierName, // This is correct
        replied_at: new Date().toISOString(),
        reply: replyText,
      })
      .eq("id", suggestion.id);

    if (error) {
      console.error("Error replying to suggestion:", error);
      toast.error("Failed to reply to suggestion");
    } else {
      // Send email
      try {
        await sendEmail(
          suggestion.email,
          "Reply to Your Suggestion",
          "SuggestionReply",
          {
            employeeName: suggestion.created_by,
            originalSuggestion: suggestion.suggestion,
            replyText: replyText,
            repliedBy: "Admin",
          }
        );

        toast.success("Replied to suggestion and sent email");
      } catch (error) {
        console.error("Error sending email:", error);
        toast.error("Failed to send email, but reply was saved");
      }

      setReplyText("");
      await fetchSuggestions(); // Refresh the suggestions list
    }
  }

  return (
    <RoleBasedWrapper allowedRoles={["admin", "super admin"]}>
      <div className="section w-full overflow-hidden">
        <h1 className="text-3xl font-bold ml-8">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mx-auto max-w-[calc(100vw-100px)] overflow-hidden">
          {/*chat card*/}
          <div className="w-full overflow-hidden">
            <div className="w-full overflow-hidden">
              {/* <Card className="flex flex-col mt-2 overflow-hidden">
              <CardContent className="flex-grow overflow-hidden"> */}
              <div className="h-full overflow-hidden">
                <ChatClient />
              </div>
              {/* </CardContent>
            </Card> */}
            </div>
          </div>

          {/*All Report cards*/}
          <div className="w-full overflow-hidden">
            {/* <Card className="flex flex-col max-h-[calc(100vh-250px)] max-w-full mx-auto my-12 overflow-hidden">
            <CardContent> */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 overflow-hidden">
              <ReportCard
                title="Gunsmithing Weekly Maintenance"
                date={gunsmiths?.last_maintenance_date || null}
                icon={<PersonIcon className="h-6 w-6" />}
                extraInfo={gunsmiths?.firearm_name}
                type="maintenance"
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
                extraInfo={rangeWalk?.user_name}
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
                  certificates.length > 0
                    ? certificates[certificates.length - 1].expiration
                    : null
                }
                icon={<DrawingPinIcon className="h-6 w-6" />}
                extraInfo={`${certificates.length} certificate${
                  certificates.length !== 1 ? "s" : ""
                } need${certificates.length === 1 ? "s" : ""} renewal`}
                type="certificate"
                details={certificates}
              />

              {/* Certificate Renewals List*/}
              <Card className="flex flex-col overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DrawingPinIcon className="h-6 w-6" />
                    Certificate Renewals List
                  </CardTitle>
                </CardHeader>
                <div className="flex-grow overflow-hidden">
                  {/* <ScrollArea className="h-[calc(100vh-1000px)] overflow-auto"> */}
                  <CardContent className="flex-grow ">
                    {certificates.length > 0 ? (
                      <ul className="space-y-1">
                        {certificates.map((cert) => (
                          <li
                            key={cert.id}
                            className="flex items-center justify-between"
                          >
                            <span className="flex-shrink-0 w-1/4 truncate">
                              {cert.name}
                            </span>
                            <span className="flex-shrink-0 w-1/4 truncate">
                              {cert.certificate}
                            </span>
                            <span className="flex-shrink-0 w-1/4 truncate">
                              {cert.action_status}
                            </span>
                            <Badge variant="destructive" className="w-1/8">
                              {new Date(cert.expiration).toLocaleDateString()}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-center">
                        No certificates need renewal at this time.
                      </p>
                    )}
                  </CardContent>
                  {/* <ScrollBar orientation="vertical" /> */}
                  {/* <ScrollBar orientation="horizontal" /> */}
                  {/* </ScrollArea> */}
                </div>
              </Card>
            </div>
            {/* </CardContent>
          </Card> */}
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
                  {suggestions.length === 0 ? (
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
                          {suggestions.map((suggestion) => (
                            <TableRow key={suggestion.id}>
                              <TableCell>{suggestion.created_by}</TableCell>
                              <TableCell>{suggestion.suggestion}</TableCell>
                              <TableCell>
                                {new Date(
                                  suggestion.created_at
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
                                        disabled={suggestion.is_read}
                                      >
                                        {suggestion.is_read
                                          ? "Replied"
                                          : "Reply"}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80">
                                      <div className="space-y-2">
                                        <h4 className="font-medium">
                                          Reply to Suggestion
                                        </h4>
                                        <Textarea
                                          placeholder="Type your reply here..."
                                          value={replyText}
                                          onChange={(e) =>
                                            setReplyText(e.target.value)
                                          }
                                        />
                                        <Button
                                          onClick={() =>
                                            handleReply(suggestion)
                                          }
                                        >
                                          Send Reply
                                        </Button>
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                  {suggestion.is_read && (
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button variant="outline">View</Button>
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
                                            Replied by: {suggestion.replied_by}
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
              {role === "super admin" && (
                <Card className="flex flex-col h-full">
                  <CardHeader className="flex-shrink-0">
                    <CardTitle className="flex items-center gap-2">
                      <CalendarIcon className="h-6 w-6" />
                      Select Date For Chart & Table
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
                          <span>{fileName || "Select File"}</span>
                        </label>
                        <Button
                          variant="outline"
                          onClick={handleSubmit}
                          className="w-full"
                          disabled={loading || !file}
                        >
                          {loading ? "Uploading..." : "Upload & Process"}
                        </Button>
                      </div>
                    </div>

                    {loading && <Progress value={progress} className="mt-4" />}
                  </CardContent>
                </Card>
              )}

              {role === "super admin" && !loading && (
                <Card className="flex flex-col overflow-hidden">
                  <CardHeader>
                    <CardTitle>Manage Approved Domains</CardTitle>
                    <CardDescription>
                      Add, edit, or remove domains for internal email addresses.
                    </CardDescription>
                  </CardHeader>
                  <div className="flex-grow overflow-hidden">
                    {/* <ScrollArea className="h-[calc(100vh-1000px)] overflow-auto"> */}
                    <CardContent>
                      <div className="mb-4 flex items-center space-x-2">
                        <Input
                          type="text"
                          value={newDomain}
                          onChange={(e) => setNewDomain(e.target.value)}
                          placeholder="Enter new domain"
                          className="flex-grow"
                        />
                        <Button variant="outline" onClick={addDomain}>
                          Add Domain
                        </Button>
                      </div>

                      <ul className="space-y-2 flex flex-col flex-shrink-0">
                        {domains.map((domain) => (
                          <li
                            key={domain.id}
                            className="flex items-center space-x-2"
                          >
                            {editingDomain && editingDomain.id === domain.id ? (
                              <>
                                <Input
                                  type="text"
                                  value={editingDomain.domain}
                                  onChange={(e) =>
                                    setEditingDomain({
                                      ...editingDomain,
                                      domain: e.target.value,
                                    })
                                  }
                                  className="flex-grow"
                                />
                                <Button
                                  onClick={updateDomain}
                                  variant="outline"
                                >
                                  Save
                                </Button>
                                <Button
                                  onClick={() => setEditingDomain(null)}
                                  variant="outline"
                                >
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <>
                                <span className="flex-grow">
                                  {domain.domain}
                                </span>
                                <Button
                                  onClick={() => setEditingDomain(domain)}
                                  variant="outline"
                                >
                                  Edit
                                </Button>
                                <Button
                                  onClick={() => deleteDomain(domain.id)}
                                  variant="destructive"
                                >
                                  Delete
                                </Button>
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    {/* <ScrollBar orientation="vertical" /> */}
                    {/* </ScrollArea> */}
                  </div>
                </Card>
              )}
            </div>
            {/* </CardContent>
          </Card> */}
          </div>

          {/* Sales Chart*/}
          <div className="col-span-full overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-hidden">
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
                        {format(selectedRange.start, "PPP")}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CustomCalendar
                        selectedDate={selectedRange.start}
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
                    ${totalGross.toFixed(2)}
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
                    ${totalNet.toFixed(2)}
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
                    ${totalNetMinusExclusions.toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            </div>
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
                    "w-[calc(100vw-90px)] overflow-auto"
                  )}
                >
                  <CardContent className=" flex-grow overflow-auto">
                    <div className="h-[400px]">
                      <SalesRangeStackedBarChart
                        selectedRange={selectedRange}
                      />
                    </div>
                  </CardContent>
                  <ScrollBar orientation="horizontal" />
                  <ScrollBar orientation="vertical" />
                </ScrollArea>
              </div>
            </Card>
          </div>

          {/* Sales Report Table*/}
          <div className="col-span-full overflow-hidden mt-2">
            <Card className="flex flex-col col-span-full h-full">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="flex items-center gap-2">
                  <TableIcon className="h-6 w-6" />
                  Sales Details
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col max-h-[calc(100vh-600px)] overflow-hidden">
                <Suspense fallback={<div>Loading...</div>}>
                  <div className=" overflow-hidden ">
                    <SalesDataTable
                      startDate={format(selectedRange.start, "yyyy-MM-dd")}
                      endDate={format(selectedRange.end, "yyyy-MM-dd")}
                    />
                  </div>
                </Suspense>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RoleBasedWrapper>
  );
}

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
  const timeZone = "America/Los_Angeles"; // Or use your preferred time zone

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
    oneDayAgo.setHours(0, 0, 0, 0); // Set to start of the previous day
    const sevenDaysAgo = new Date(currentDate);
    sevenDaysAgo.setDate(currentDate.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0); // Set to start of 7 days ago

    if (type === "maintenance") {
      return submissionDate >= sevenDaysAgo;
    } else if (type === "certificate") {
      return false; // Always show as not submitted for certificates
    } else {
      return submissionDate >= oneDayAgo;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {date ? (
          <>
            <p className="text-sm text-gray-500">
              {type === "certificate"
                ? "Oldest expiration:"
                : "Last submitted:"}
            </p>
            <p className="font-semibold">{formatLocalDate(date)}</p>
            {extraInfo && (
              <p className="text-sm text-gray-500">
                {type === "maintenance"
                  ? "Firearm:"
                  : type === "deposit"
                  ? "Employee:"
                  : type === "certificate"
                  ? "Total:"
                  : "By:"}{" "}
                {extraInfo}
              </p>
            )}
            <div className="flex items-center mt-2">
              {type === "certificate" ? (
                <>
                  <CrossCircledIcon className="text-red-500 mr-2" />
                  <Badge variant="outline" className="bg-red-100 text-red-800">
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
                  <Badge variant="outline" className="bg-red-100 text-red-800">
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
              "h-[calc(100vh-1200px)]" // Adjusted height to account for CardHeader
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
                        {item.name}
                      </span>
                      <span className="flex-shrink-0 w-1/4 truncate">
                        {item.certificate}
                      </span>
                      <span className="flex-shrink-0 w-1/4 truncate">
                        {item.action_status}
                      </span>
                      <Badge variant="destructive">
                        {new Date(item.expiration).toLocaleDateString()}
                      </Badge>
                    </>
                  ) : (
                    <>
                      <span className="flex-shrink-0 w-1/2 truncate">
                        {item.name}
                      </span>
                      <Badge variant="secondary">${item.value}</Badge>
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
