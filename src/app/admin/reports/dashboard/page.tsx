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
import classNames from "classnames";
import { Input } from "@/components/ui/input";
import Papa, { ParseResult } from "papaparse";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

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

const timeZone = "America/Los_Angeles";

export default function AdminDashboard() {
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
    fetchLatestDailyDeposit();
    fetchLatestGunsmithMaintenance();
    fetchLatestChecklistSubmission();
    fetchLatestRangeWalkReport();
    fetchCertificates();
    fetchLatestSalesData(selectedRange.start, selectedRange.end);

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

  const handleRangeChange = (date: Date | undefined) => {
    if (date) {
      // Create a new date object set to the start of the selected day in the local timezone
      const newStart = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      // Set the end date to the end of the same day
      const newEnd = new Date(newStart);
      newEnd.setHours(23, 59, 59, 999);

      setSelectedRange({ start: newStart, end: newEnd });
      fetchLatestSalesData(newStart, newEnd);
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
      const data = await response.json();
      // console.log("Fetched sales data:", data);
      setSalesData(data);
    } else {
      console.error("Error fetching sales data:", response.statusText);
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
          toast.success(
            `File processed successfully. Current record count: ${count}`
          );
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

  return (
    <div className="section w-full overflow-hidden">
      <Card className="flex flex-col max-h-[calc(100vh-200px)] max-w-6xl mx-auto my-12 overflow-hidden">
        <div className="p-8 min-h-screen overflow-hidden">
          <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
          <div className="flex-grow overflow-hidden">
            <ScrollArea className="h-[calc(100vh-310px)] overflow-auto">
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
                  title="Certificates Needing Renewal"
                  date={
                    certificates.length > 0
                      ? new Date(certificates[0].expiration).toISOString()
                      : null
                  }
                  icon={<DrawingPinIcon className="h-6 w-6" />}
                  extraInfo={
                    certificates.length > 0 ? certificates[0].name : undefined
                  }
                  type="certificate"
                  details={certificates} // Pass the certificates as details
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
                        dailyDeposit?.total_to_deposit?.toFixed(2) || "0.00",
                    },
                  ]}
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
                    <CardContent className="flex-grow overflow-auto">
                      {certificates.length > 0 ? (
                        <ul className="space-y-2 pr-4">
                          {certificates.map((cert) => (
                            <li
                              key={cert.id}
                              className="flex items-center justify-between space-x-2"
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
                              <Badge variant="destructive">
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

                {/* Select Date and Upload Data */}
                <Card className="flex flex-col h-full">
                  <CardHeader className="flex-shrink-0">
                    <CardTitle className="flex items-center gap-2">
                      <CalendarIcon className="h-6 w-6" />
                      Select Date & Upload Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-grow overflow-hidden">
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

                    {/* File Upload Section */}
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

                {/* <Card className="col-span-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellIcon className="h-6 w-6" />
              Important Notices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Add any important notices or announcements here.</p>
          </CardContent>
        </Card> */}

                {/* Manage Approved Domains*/}
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

                      <ul className="space-y-2">
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

                {/* Sales Report Chart*/}
                <Card className="flex flex-col col-span-full h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChartIcon className="h-6 w-6" />
                      Sales Report Chart
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow h-full overflow-hidden">
                    <SalesRangeStackedBarChart selectedRange={selectedRange} />
                  </CardContent>
                </Card>

                {/* Sales Report Table*/}
                <Card className="flex flex-col col-span-full h-[calc(100vh-250px)] w-[calc(100wh-200px)]">
                  <CardHeader className="flex-shrink-0">
                    <CardTitle className="flex items-center gap-2">
                      <TableIcon className="h-6 w-6" />
                      Sales Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-grow overflow-hidden">
                    <Suspense fallback={<div>Loading...</div>}>
                      <div className="flex-grow overflow-hidden border rounded-md">
                        <SalesDataTable
                          startDate={format(selectedRange.start, "yyyy-MM-dd")}
                          endDate={format(selectedRange.end, "yyyy-MM-dd")}
                        />
                      </div>
                    </Suspense>
                  </CardContent>
                </Card>
              </div>
              <ScrollBar orientation="vertical" />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </div>
      </Card>
    </div>
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
  date: string | null;
  icon: React.ReactNode;
  extraInfo?: string;
  type?: string;
  details?: Certificate[] | { name: string; value: string }[];
}) {
  const timeZone = "America/Los_Angeles"; // Or use your preferred time zone

  const formatLocalDate = (dateString: string) => {
    if (!dateString) return "N/A";

    const parsedDate = parseISO(dateString);
    const zonedDate = toZonedTime(parsedDate, timeZone);

    return formatTZ(zonedDate, "PPP", { timeZone });
  };

  const isSubmitted = () => {
    if (!date) return false;

    const submissionDate = parseISO(date);
    const currentDate = new Date();
    const oneDayAgo = new Date(currentDate);
    oneDayAgo.setDate(currentDate.getDate() - 1);
    oneDayAgo.setHours(0, 0, 0, 0); // Set to start of the previous day
    const sevenDaysAgo = new Date(currentDate);
    sevenDaysAgo.setDate(currentDate.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0); // Set to start of 7 days ago

    if (type === "maintenance") {
      return submissionDate >= sevenDaysAgo;
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
            <p className="text-sm text-gray-500">Last submitted:</p>
            <p className="font-semibold">{formatLocalDate(date)}</p>
            {extraInfo && (
              <p className="text-sm text-gray-500">
                {type === "maintenance"
                  ? "Firearm:"
                  : type === "deposit"
                  ? "Employee:"
                  : "By:"}{" "}
                {extraInfo}
              </p>
            )}
            <div className="flex items-center mt-2">
              {isSubmitted() ? (
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
