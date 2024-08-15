"use client";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { SickTimeTable } from "./SickTimeTable"; // Import the SickTimeTable component
import { TimesheetTable } from "./TimesheetTable"; // Import the TimesheetTable component
import { supabase } from "@/utils/supabase/client";

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
  name: string | null; // This should match the `TEXT` type
  event_date: string | null;
  start_time: string;
  end_time: string;
  total_hours: string | null;
}

const AdminReportsPage = () => {
  const [sickTimeData, setSickTimeData] = useState<SickTimeReport[]>([]);
  const [timesheetData, setTimesheetData] = useState<TimesheetReport[]>([]);

  useEffect(() => {
    const fetchSickTimeData = async () => {
      const { data, error } = await supabase.rpc(
        "get_all_employee_sick_time_usage"
      );
      if (error) {
        console.error("Error fetching sick time data:", error.message);
      } else {
        // console.log("Fetched Sick Time Data:", data);
        setSickTimeData(data as SickTimeReport[]);
      }
    };

    const fetchTimesheetData = async () => {
      const { data, error } = await supabase.rpc("get_timesheet_data");
      if (error) {
        console.error("Error fetching timesheet data:", error.message);
      } else {
        console.log("Timesheet Data:", data); // For debugging
        setTimesheetData(data as TimesheetReport[]);
      }
    };

    fetchSickTimeData();
    fetchTimesheetData();
  }, []);

  return (
    <div className="overflow-x-auto ml-2">
      <Tabs defaultValue="sick-time">
        <TabsList>
          <TabsTrigger value="sick-time">Sick Time Report</TabsTrigger>
          <TabsTrigger value="timesheet">Timesheet Report</TabsTrigger>
        </TabsList>

        <TabsContent value="sick-time">
          <Card>
            <SickTimeTable data={sickTimeData} />
          </Card>
        </TabsContent>

        <TabsContent value="timesheet">
          <Card>
            {timesheetData.length > 0 ? (
              <TimesheetTable data={timesheetData} />
            ) : (
              <p>No timesheet data available.</p>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminReportsPage;
