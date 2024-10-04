"use client";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SickTimeTable } from "./SickTimeTable"; // Import the SickTimeTable component
import { TimesheetTable } from "./TimesheetTable"; // Import the TimesheetTable component
import { supabase } from "@/utils/supabase/client";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import { Button } from "@/components/ui/button";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { format } from "date-fns";

interface SickTimeReport {
  employee_id: number;
  name: string; // Change this from employee_name to name
  available_sick_time: number;
  used_sick_time: number;
  used_dates: string[];
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

const AdminReportsPage = () => {
  const [sickTimeData, setSickTimeData] = useState<SickTimeReport[]>([]);
  const [timesheetData, setTimesheetData] = useState<TimesheetReport[]>([]);
  const [activeTab, setActiveTab] = useState("timesheet");
  const [isAllExpanded, setIsAllExpanded] = useState(false);
  const [selectedPayPeriod, setSelectedPayPeriod] = useState<string | null>(
    null
  );
  const [filteredTimesheetData, setFilteredTimesheetData] = useState<
    TimesheetReport[]
  >([]);

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

    fetchSickTimeData();
    fetchTimesheetData();
  }, []);

  const handleTimesheetDataUpdate = (
    updater: (prevData: TimesheetReport[]) => TimesheetReport[]
  ) => {
    setTimesheetData((prevData) => {
      const newData = updater(prevData);
      console.log("Updated timesheet data:", newData);
      return newData;
    });
  };

  const handleFilteredDataUpdate = (filteredData: TimesheetReport[]) => {
    setFilteredTimesheetData(filteredData);
  };

  const handleDownload = () => {
    let dataToExport: any[] = [];
    let fileName = "";

    if (activeTab === "sick-time") {
      dataToExport = sickTimeData.map((row) => ({
        Employee: row.name,
        "Available Sick Time": row.available_sick_time,
        "Used Sick Time": row.used_sick_time,
        "Used Dates": row.used_dates.join(", "),
      }));
      fileName = "sick_time_report.xlsx";
    } else if (activeTab === "timesheet") {
      dataToExport = filteredTimesheetData.map((row) => ({
        Employee: row.name,
        Date: row.event_date
          ? format(new Date(row.event_date), "M-dd-yyyy")
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
    }

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });

    saveAs(new Blob([wbout], { type: "application/octet-stream" }), fileName);
  };

  useEffect(() => {
    console.log("Filtered Timesheet Data:", filteredTimesheetData);
  }, [filteredTimesheetData]);

  const handleExpandCollapseAll = () => {
    setIsAllExpanded(!isAllExpanded);
  };

  return (
    <RoleBasedWrapper allowedRoles={["admin", "super admin"]}>
      <Card className="flex flex-col h-full max-w-6xl mx-auto my-12">
        <CardHeader className="bg-gray-100 dark:bg-muted px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between">
            <h1 className="text-xl font-bold">Reports Central</h1>
            <Button variant="linkHover1" onClick={handleDownload}>
              Download Report
            </Button>
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
        </Tabs>
      </Card>
    </RoleBasedWrapper>
  );
};

export default AdminReportsPage;
