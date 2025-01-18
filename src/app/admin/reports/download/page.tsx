"use client";
import { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SickTimeTable } from "./SickTimeTable"; // Import the SickTimeTable component
import { TimesheetTable } from "./TimesheetTable"; // Import the TimesheetTable component
import { VacationTimeTable } from "./VacationTimeTable";
import { supabase } from "@/utils/supabase/client";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import { Button } from "@/components/ui/button";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { format, parseISO } from "date-fns";
import { toZonedTime, format as formatTZ } from "date-fns-tz";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";

interface SickTimeReport {
  employee_id: number;
  name: string;
  sick_time_history: {
    year: number;
    total_hours_used: number;
    requests_count: number;
    details: {
      request_id: number;
      hours_used: number;
      date_used: string;
      start_date: string;
      end_date: string;
    }[];
  }[];
}

interface TimesheetReport {
  id: number;
  employee_id: number;
  name: string;
  event_date: string | null;
  start_time: string;
  end_time: string | null;
  lunch_start: string | null;
  lunch_end: string | null;
  stored_total_hours: string | null;
  calculated_total_hours: string | null;
  scheduled_hours: number;
  sick_time_usage: number;
  vacation_time_usage: number;
  regular_time: number;
  overtime: number;
  available_sick_time: number;
  hoursToReconcile?: number;
  total_hours_with_sick?: number;
}

interface VacationTimeReport {
  employee_id: number;
  name: string;
  available_vacation_time: number;
  used_vacation_time: number;
  used_dates: string[];
  hours_per_date: number[];
}

const TIME_ZONE = "America/Los_Angeles";

const AdminReportsPage = () => {
  const queryClient = useQueryClient();

  // Add mutation for activeTab
  const setActiveTab = useMutation({
    mutationFn: (newTab: string) => {
      return Promise.resolve(queryClient.setQueryData(["activeTab"], newTab));
    },
  });

  // Convert all state to TanStack Query
  const { data: sickTimeData = [], error: sickTimeError } = useQuery({
    queryKey: ["sickTimeData"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc(
          "get_all_employee_sick_time_history",
          {}, // Add empty params object
          {
            count: "exact", // Add count option
          }
        );

        if (error) {
          console.error("Supabase RPC error:", error);
          throw error;
        }

        if (!data) {
          console.warn("No data returned from sick time query");
          return [];
        }

        // console.log("Sick time data:", data); // Debug log
        return data as SickTimeReport[];
      } catch (err) {
        console.error("Error fetching sick time data:", err);
        throw err;
      }
    },
    retry: 1, // Only retry once
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  const { data: timesheetData = [] } = useQuery({
    queryKey: ["timesheetData"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_timesheet_data");
      if (error) throw error;
      return data as TimesheetReport[];
    },
  });

  const { data: vacationTimeData = [] } = useQuery({
    queryKey: ["vacationTimeData"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        "get_all_employee_vacation_time_usage"
      );
      if (error) throw error;
      return data as VacationTimeReport[];
    },
  });

  const { data: activeTab = "timesheet" } = useQuery({
    queryKey: ["activeTab"],
    queryFn: () => "timesheet" as const,
    initialData: "timesheet",
  });

  const { data: isAllExpanded = false } = useQuery({
    queryKey: ["isAllExpanded"],
    queryFn: () => false,
    initialData: false,
  });

  const { data: selectedPayPeriod = null } = useQuery({
    queryKey: ["selectedPayPeriod"],
    queryFn: () => null as string | null,
    initialData: null,
  });

  const { data: filteredTimesheetData = [] } = useQuery({
    queryKey: ["filteredTimesheetData"],
    queryFn: () => [] as TimesheetReport[],
    initialData: [],
  });

  // Computed value for filtered vacation data
  const filteredVacationData = vacationTimeData.filter(
    (row) => row.used_vacation_time > 0
  );

  // Update handlers to use mutations
  const handleTimesheetDataUpdate = (
    updater: (prevData: TimesheetReport[]) => TimesheetReport[]
  ) => {
    queryClient.setQueryData(
      ["timesheetData"],
      (oldData: TimesheetReport[]) => {
        const newData = updater(oldData);
        return newData;
      }
    );
  };

  const handleFilteredDataUpdate = (filteredData: TimesheetReport[]) => {
    queryClient.setQueryData(
      ["filteredTimesheetData"],
      (oldData: TimesheetReport[]) => {
        const newData = filteredData;
        return newData;
      }
    );
  };

  const handleExpandCollapseAll = () => {
    queryClient.setQueryData(["isAllExpanded"], (oldData: boolean) => {
      const newData = !oldData;
      return newData;
    });
  };

  const exportSickTimeData = (data: SickTimeReport[]) => {
    const sickTimeExport: any[] = [];

    data.forEach((row) => {
      const currentYear = new Date().getFullYear();
      const currentYearData = row.sick_time_history.find(
        (h) => h.year === currentYear
      );
      const currentYearUsage = currentYearData?.total_hours_used || 0;
      const availableHours = Math.max(0, 40 - currentYearUsage);

      sickTimeExport.push({
        "Employee Name": row.name,
        "Employee ID": row.employee_id,
        "Available Sick Hours": availableHours.toFixed(2),
        "Used This Year": currentYearUsage.toFixed(2),
        Year: currentYear,
      });

      // Add detailed usage rows
      row.sick_time_history.forEach((yearData) => {
        sickTimeExport.push({
          Year: yearData.year,
          "Total Hours Used": yearData.total_hours_used.toFixed(2),
          "Number of Requests": yearData.requests_count,
        });

        yearData.details.forEach((usage) => {
          sickTimeExport.push({
            "Request Date": format(new Date(usage.date_used), "MM/dd/yyyy"),
            "Start Date": format(new Date(usage.start_date), "MM/dd/yyyy"),
            "End Date": format(new Date(usage.end_date), "MM/dd/yyyy"),
            "Hours Used": usage.hours_used.toFixed(2),
          });
        });

        sickTimeExport.push({}); // Add separator row
      });
    });

    return sickTimeExport;
  };

  const handleDownload = () => {
    let dataToExport: any[] = [];
    let fileName = "";

    if (activeTab === "vacation-time") {
      // Use filtered data instead of all vacation data
      filteredVacationData.forEach((row) => {
        // Calculate total used hours correctly
        const totalUsedHours = row.hours_per_date.reduce(
          (sum, hours) => sum + hours,
          0
        );

        dataToExport.push({
          "Employee Name": row.name,
          "Employee ID": row.employee_id,
          "Total Available Hours": row.available_vacation_time,
          "Total Used Hours": totalUsedHours,
        });

        // Add rows for each usage entry
        row.used_dates.forEach((date, index) => {
          const zonedDate = toZonedTime(new Date(date), TIME_ZONE);
          dataToExport.push({
            "Usage Date": formatTZ(zonedDate, "M-dd-yyyy", {
              timeZone: TIME_ZONE,
            }),
            "Usage Hours": row.hours_per_date[index],
          });
        });

        // Add an empty row for separation
        dataToExport.push({});
      });

      fileName = "vacation_time_report.xlsx";
    } else if (activeTab === "timesheet") {
      dataToExport = filteredTimesheetData.map((row) => ({
        Employee: row.name,
        Date: row.event_date
          ? formatTZ(
              toZonedTime(new Date(row.event_date), TIME_ZONE),
              "M-dd-yyyy",
              { timeZone: TIME_ZONE }
            )
          : "N/A",
        "Start Time": row.start_time,
        "End Time": row.end_time,
        "Total Hours Logged": row.calculated_total_hours || "N/A",
        "Scheduled Hours": row.scheduled_hours?.toFixed(2),
        "Sick Time Usage": row.sick_time_usage?.toFixed(2) || "N/A",
        "Vacation Time Usage": row.vacation_time_usage?.toFixed(2) || "N/A",
        "Regular Time": row.regular_time.toFixed(2),
        Overtime: row.overtime.toFixed(2),
        "Available Sick Time": row.available_sick_time?.toFixed(2) || "N/A",
        "Total Hours With Sick": row.total_hours_with_sick?.toFixed(2) || "N/A",
      }));
      fileName = "timesheet_report.xlsx";
    } else if (activeTab === "sick-time") {
      sickTimeData.forEach((row) => {
        const currentYear = new Date().getFullYear();
        const currentYearData = row.sick_time_history.find(
          (h) => h.year === currentYear
        );
        const currentYearUsage = currentYearData?.total_hours_used || 0;
        const availableHours = Math.max(0, 40 - currentYearUsage);

        dataToExport.push({
          "Employee Name": row.name,
          "Employee ID": row.employee_id,
          "Available Sick Hours": availableHours.toFixed(2),
          "Used This Year": currentYearUsage.toFixed(2),
          "Total Requests This Year": currentYearData?.requests_count || 0,
        });

        row.sick_time_history.forEach((yearData) => {
          dataToExport.push({
            Year: yearData.year,
            "Total Hours Used": yearData.total_hours_used.toFixed(2),
            "Number of Requests": yearData.requests_count,
          });

          yearData.details.forEach((usage) => {
            dataToExport.push({
              "Start Date": format(new Date(usage.start_date), "MM/dd/yyyy"),
              "End Date": format(new Date(usage.end_date), "MM/dd/yyyy"),
              "Hours Used": usage.hours_used.toFixed(2),
              "Date Requested": format(new Date(usage.date_used), "MM/dd/yyyy"),
            });
          });

          dataToExport.push({});
        });

        dataToExport.push({});
      });

      fileName = "sick_time_report.xlsx";
    }

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });

    saveAs(new Blob([wbout], { type: "application/octet-stream" }), fileName);
  };

  // Add a function to process vacation time data
  const processVacationTimeData = (data: VacationTimeReport[]) => {
    const vacationTimeExport: any[] = [];

    // Use filtered data instead of all vacation data
    data.forEach((row) => {
      const totalUsedHours = row.hours_per_date.reduce(
        (sum, hours) => sum + hours,
        0
      );

      vacationTimeExport.push({
        "Employee Name": row.name,
        "Employee ID": row.employee_id,
        "Total Available Hours": row.available_vacation_time,
        "Total Used Hours": totalUsedHours,
      });

      // Add rows for each usage entry
      row.used_dates.forEach((date, index) => {
        const zonedDate = toZonedTime(new Date(date), TIME_ZONE);
        vacationTimeExport.push({
          "Usage Date": formatTZ(zonedDate, "M-dd-yyyy", {
            timeZone: TIME_ZONE,
          }),
          "Usage Hours": row.hours_per_date[index],
        });
      });

      // Add an empty row for separation
      vacationTimeExport.push({});
    });

    return vacationTimeExport;
  };

  // Update handleCombinedDownload to use the new function
  const handleCombinedDownload = () => {
    const wb = XLSX.utils.book_new();

    // Process sick time data
    const sickTimeExport = exportSickTimeData(sickTimeData);

    // Process vacation time data
    const vacationTimeExport = processVacationTimeData(filteredVacationData);

    // Add both sheets to workbook
    const ws1 = XLSX.utils.json_to_sheet(sickTimeExport);
    const ws2 = XLSX.utils.json_to_sheet(vacationTimeExport);
    XLSX.utils.book_append_sheet(wb, ws1, "Sick Time Report");
    XLSX.utils.book_append_sheet(wb, ws2, "Vacation Time Report");

    // Save the file
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([wbout], { type: "application/octet-stream" }),
      "combined_time_report.xlsx"
    );
  };

  // Add error handling in the render
  if (sickTimeError) {
    console.error("Sick time query error:", sickTimeError);
    // Optionally render an error state
    return <div>Error loading sick time data</div>;
  }

  return (
    <RoleBasedWrapper allowedRoles={["admin", "ceo", "super admin", "dev"]}>
      <Card className="flex flex-col h-full max-w-6xl mx-auto my-12">
        <CardHeader className="bg-gray-100 dark:bg-muted px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">Reports Central</h1>
            <div className="flex gap-4">
              <Button variant="outline" onClick={handleCombinedDownload}>
                Download Combined Report
              </Button>
              <Button variant="outline" onClick={handleDownload}>
                Download Current Report
              </Button>
            </div>
          </div>
        </CardHeader>

        <Tabs
          defaultValue="sick-time"
          value={activeTab}
          onValueChange={(value) => setActiveTab.mutate(value)}
        >
          <TabsList>
            <TabsTrigger value="timesheet">Timesheet Report</TabsTrigger>
            <TabsTrigger value="sick-time">Sick Time Report</TabsTrigger>
            <TabsTrigger value="vacation-time">
              Vacation Time Report
            </TabsTrigger>
            <TabsTrigger value="sales">Sales Report</TabsTrigger>
          </TabsList>

          <TabsContent value="timesheet">
            <>
              {timesheetData.length > 0 ? (
                <TimesheetTable
                  data={timesheetData}
                  onDataUpdate={handleTimesheetDataUpdate}
                  onFilteredDataUpdate={handleFilteredDataUpdate}
                  selectedPayPeriod={selectedPayPeriod}
                />
              ) : (
                <p>No timesheet data available.</p>
              )}
            </>
          </TabsContent>

          <TabsContent value="sick-time">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Sick Time Report</CardTitle>
                <Button variant="linkHover1" onClick={handleExpandCollapseAll}>
                  {isAllExpanded ? "Collapse All" : "Expand All"}
                </Button>
              </CardHeader>
              <SickTimeTable
                data={sickTimeData}
                isAllExpanded={isAllExpanded}
                onExpandCollapseAll={handleExpandCollapseAll}
              />
            </Card>
          </TabsContent>

          <TabsContent value="vacation-time">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Vacation Time Report</CardTitle>
                <Button variant="linkHover1" onClick={handleExpandCollapseAll}>
                  {isAllExpanded ? "Collapse All" : "Expand All"}
                </Button>
              </CardHeader>
              <VacationTimeTable
                data={filteredVacationData}
                isAllExpanded={isAllExpanded}
                onExpandCollapseAll={handleExpandCollapseAll}
              />
            </Card>
          </TabsContent>
        </Tabs>
      </Card>
    </RoleBasedWrapper>
  );
};

export default AdminReportsPage;
