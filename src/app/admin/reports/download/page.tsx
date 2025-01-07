"use client";
import { useEffect, useState } from "react";
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

interface SickTimeReport {
  employee_id: number;
  name: string;
  available_sick_time: number;
  used_sick_time: number;
  used_dates: string[];
  hours_per_date: number[];
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
  const [sickTimeData, setSickTimeData] = useState<SickTimeReport[]>([]);
  const [timesheetData, setTimesheetData] = useState<TimesheetReport[]>([]);
  const [vacationTimeData, setVacationTimeData] = useState<
    VacationTimeReport[]
  >([]);
  const [activeTab, setActiveTab] = useState("timesheet");
  const [isAllExpanded, setIsAllExpanded] = useState(false);
  const [selectedPayPeriod, setSelectedPayPeriod] = useState<string | null>(
    null
  );
  const [filteredTimesheetData, setFilteredTimesheetData] = useState<
    TimesheetReport[]
  >([]);

  // Add a computed value for filtered vacation data
  const filteredVacationData = vacationTimeData.filter(
    (row) => row.used_vacation_time > 0
  );

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

    const fetchTimesheetData = async () => {
      const { data, error } = await supabase.rpc("get_timesheet_data");
      if (error) {
        //console.("Error fetching timesheet data:", error.message);
      } else {
        // console.log("Timesheet Data:", data); // For debugging
        setTimesheetData(data as TimesheetReport[]);
      }
    };

    const fetchVacationTimeData = async () => {
      const { data, error } = await supabase.rpc(
        "get_all_employee_vacation_time_usage"
      );
      if (error) {
        console.error("Error fetching vacation time data:", error.message);
      } else {
        setVacationTimeData(data as VacationTimeReport[]);
      }
    };

    fetchSickTimeData();
    fetchTimesheetData();
    fetchVacationTimeData();
  }, []);

  const handleTimesheetDataUpdate = (
    updater: (prevData: TimesheetReport[]) => TimesheetReport[]
  ) => {
    setTimesheetData((prevData) => {
      const newData = updater(prevData);
      // console.log("Updated timesheet data:", newData);
      return newData;
    });
  };

  const handleFilteredDataUpdate = (filteredData: TimesheetReport[]) => {
    setFilteredTimesheetData(filteredData);
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
        // Add a row for the employee's summary
        dataToExport.push({
          "Employee Name": row.name,
          "Employee ID": row.employee_id,
          "Total Available Hours": row.available_sick_time,
          "Total Used Hours": row.hours_per_date.reduce(
            (sum, hours) => sum + hours,
            0
          ),
          "Remaining Hours":
            row.available_sick_time -
            row.hours_per_date.reduce((sum, hours) => sum + hours, 0),
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

      fileName = "sick_time_report.xlsx";
    }

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });

    saveAs(new Blob([wbout], { type: "application/octet-stream" }), fileName);
  };

  useEffect(() => {
    // console.log("Filtered Timesheet Data:", filteredTimesheetData);
  }, [filteredTimesheetData]);

  const handleExpandCollapseAll = () => {
    setIsAllExpanded(!isAllExpanded);
  };

  // Add a new function to handle combined download
  const handleCombinedDownload = () => {
    const wb = XLSX.utils.book_new();

    // Process sick time data
    const sickTimeExport: any[] = [];
    sickTimeData.forEach((row) => {
      sickTimeExport.push({
        "Employee Name": row.name,
        "Employee ID": row.employee_id,
        "Total Available Sick Hours": row.available_sick_time,
        "Total Used Sick Hours": row.hours_per_date.reduce(
          (sum, hours) => sum + hours,
          0
        ),
        "Remaining Sick Hours":
          row.available_sick_time -
          row.hours_per_date.reduce((sum, hours) => sum + hours, 0),
      });

      row.used_dates.forEach((date, index) => {
        const zonedDate = toZonedTime(new Date(date), TIME_ZONE);
        sickTimeExport.push({
          "Usage Date": formatTZ(zonedDate, "M-dd-yyyy", {
            timeZone: TIME_ZONE,
          }),
          "Usage Hours": row.hours_per_date[index],
        });
      });
      sickTimeExport.push({});
    });

    // Process vacation time data - use filtered data
    const vacationTimeExport: any[] = [];
    filteredVacationData.forEach((row) => {
      // Calculate total used hours by summing the hours_per_date array
      const totalUsedHours = row.hours_per_date.reduce(
        (sum, hours) => sum + hours,
        0
      );

      vacationTimeExport.push({
        "Employee Name": row.name,
        "Employee ID": row.employee_id,
        "Total Available Vacation Hours": row.available_vacation_time,
        "Total Used Vacation Hours": totalUsedHours,
      });

      row.used_dates.forEach((date, index) => {
        const zonedDate = toZonedTime(new Date(date), TIME_ZONE);
        vacationTimeExport.push({
          "Usage Date": formatTZ(zonedDate, "M-dd-yyyy", {
            timeZone: TIME_ZONE,
          }),
          "Usage Hours": row.hours_per_date[index],
        });
      });
      vacationTimeExport.push({});
    });

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
          onValueChange={setActiveTab}
        >
          <TabsList>
            <TabsTrigger value="timesheet">Timesheet Report</TabsTrigger>
            <TabsTrigger value="sick-time">Sick Time Report</TabsTrigger>
            <TabsTrigger value="vacation-time">
              Vacation Time Report
            </TabsTrigger>
            <TabsTrigger value="sales">Sales Report</TabsTrigger>
          </TabsList>

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

          <TabsContent value="timesheet">
            <Card>
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
