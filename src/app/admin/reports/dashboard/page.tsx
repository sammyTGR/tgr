"use client";

import { Suspense, useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "@radix-ui/react-icons";
import { format, formatDate, formatDistanceToNow } from "date-fns";
import SalesRangeStackedBarChart from "@/app/admin/reports/charts/SalesRangeStackedBarChart";
import SalesDataTable from "../sales/sales-data-table";
import { ScrollBar, ScrollArea  } from "@/components/ui/scroll-area";
import classNames from "classnames";

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

const timeZone = "America/Los_Angeles";

export default function AdminDashboard() {
  const [rangeWalk, setRangeWalk] = useState<RangeWalk | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [gunsmiths, setGunsmiths] = useState<Gunsmith | null>(null);
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [salesData, setSalesData] = useState(null);
  const [selectedRange, setSelectedRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() + 0)),
    end: new Date(),
  });

  useEffect(() => {
    const channel = supabase.channel("custom-all-channel");

    channel
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "firearms_maintenance" },
        (payload) => {
          console.log("Firearms maintenance change received!", payload);
          fetchLatestGunsmithMaintenance();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sales_data" },
        (payload) => {
          console.log("Sales data change received!", payload);
          fetchLatestSalesData(selectedRange.start, selectedRange.end);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "checklist_submissions" },
        (payload) => {
          console.log("Checklist submission change received!", payload);
          fetchLatestChecklistSubmission();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "range_walk_reports" },
        (payload) => {
          console.log("Range walk report change received!", payload);
          fetchLatestRangeWalkReport();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "certifications" },
        (payload) => {
          console.log("Certifications change received!", payload);
          fetchCertificates();
        }
      )
      .subscribe();

    // Initial data fetch
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
      console.log("Fetched sales data:", data);
      setSalesData(data);
    } else {
      console.error("Error fetching sales data:", response.statusText);
    }
  }

  async function fetchLatestGunsmithMaintenance() {
    console.log("Fetching latest gunsmith maintenance...");
    const { data, error } = await supabase
      .from("firearms_maintenance")
      .select("id, firearm_name, last_maintenance_date")
      .order("last_maintenance_date", { ascending: false })
      .limit(5) // Fetch the top 5 to see if there are any recent entries
      .not("last_maintenance_date", "is", null); // Ensure we only get entries with a maintenance date

    if (error) {
      console.error("Error fetching latest gunsmith maintenance:", error);
    } else {
      console.log("Fetched gunsmith maintenance data:", data);
      if (data && data.length > 0) {
        // Set the first (most recent) entry
        setGunsmiths(data[0]);
        console.log("Most recent maintenance:", data[0]);
      } else {
        console.log("No gunsmith maintenance data found");
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

  return (
    <div className="p-8 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
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
          extraInfo={certificates.length > 0 ? certificates[0].name : undefined}
          type="certificate"
          details={certificates} // Pass the certificates as details
        />

        <Card className="flex flex-col h-[calc(100vh-250px)]">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-6 w-6" />
              Select Date
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

        <Card className="flex flex-col h-full">
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

        <Card className="flex flex-col col-span-full overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DrawingPinIcon className="h-6 w-6" />
              Certificates Needing Renewal
            </CardTitle>
          </CardHeader>
          <div className="flex-grow overflow-hidden">
          <ScrollArea
                className="h-[calc(100vh-1050px)] overflow-auto"
              >
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
          <ScrollBar orientation="vertical" />
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
              </div>
        </Card>
      </div>
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
  details?: Certificate[];
}) {
  const timeZone = "America/Los_Angeles"; // Or use your preferred time zone

  const formatLocalDate = (dateString: string) => {
    if (!dateString) return "N/A";

    const parsedDate = parseISO(dateString);
    const zonedDate = toZonedTime(parsedDate, timeZone);

    return formatTZ(zonedDate, "PPP", { timeZone });
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
                {type === "maintenance" ? "Firearm:" : "By:"} {extraInfo}
              </p>
            )}
            <div className="flex items-center mt-2">
              <CheckCircledIcon className="text-green-500 mr-2" />
              <Badge variant="outline" className="bg-green-100 text-green-800">
                Submitted
              </Badge>
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
              {details.map((cert) => (
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
            <ScrollBar orientation="vertical" />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
