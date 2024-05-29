"use client";
import { useState, useEffect, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import WithRole from "@/components/withRole"; // Import the HOC
import UserSessionHandler from "@/components/UserSessionHandler"; // Import UserSessionHandler
import supabase from "../../../../supabase/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectContent,
  SelectGroup,
} from "@/components/ui/select"; // Import Select components
import { Calendar } from "@/components/ui/calendar"; // Import the Calendar component
import * as SelectPrimitive from "@radix-ui/react-select";
import BackfillButton from "@/components/BackfillButton";

interface ScheduleData {
  employee_id: string;
  day: Date | null;
  start_time: string;
  end_time: string;
}

const ScheduleGeneratorPage = () => {
  const [weeks, setWeeks] = useState(4);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [employees, setEmployees] = useState<
    { employee_id: string; name: string }[]
  >([]);
  const [scheduleData, setScheduleData] = useState<ScheduleData[]>([
    { employee_id: "", day: null, start_time: "", end_time: "" },
  ]);

  useEffect(() => {
    // Fetch employees from Supabase
    const fetchEmployees = async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("employee_id, name");
      if (error) {
        console.error("Error fetching employees:", error);
      } else {
        setEmployees(data);
      }
    };

    fetchEmployees();
  }, []);

  const handleInputChange = (
    index: number,
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    const values = [...scheduleData];
    if (
      name === "employee_id" ||
      name === "start_time" ||
      name === "end_time"
    ) {
      values[index][name as keyof ScheduleData] = value as never;
    }
    setScheduleData(values);
  };

  const handleDateChange = (index: number, date: Date | undefined) => {
    const values = [...scheduleData];
    values[index].day = date || null;
    setScheduleData(values);
  };

  const handleAddFields = () => {
    setScheduleData([
      ...scheduleData,
      { employee_id: "", day: null, start_time: "", end_time: "" },
    ]);
  };

  const handleRemoveFields = (index: number) => {
    const values = [...scheduleData];
    values.splice(index, 1);
    setScheduleData(values);
  };

  const handleSubmitSchedule = async (schedule: ScheduleData) => {
    console.log("Submitting schedule:", schedule);
    try {
      const response = await fetch("/api/submit_schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employee_id: schedule.employee_id,
          day: schedule.day?.toISOString().split("T")[0], // Format the date as YYYY-MM-DD
          start_time: schedule.start_time,
          end_time: schedule.end_time,
        }),
      });

      const result = await response.json();
      console.log("Server response:", result);

      if (!response.ok) {
        throw new Error(
          `HTTP error! status: ${response.status} - ${result.message}`
        );
      }
      setMessage(result.message);
    } catch (error: any) {
      console.error("Failed to submit schedule:", error);
      setMessage(`Failed to submit schedule: ${error.message}`);
    }
  };

  const handleGenerateSchedules = async () => {
    setLoading(true);
    setMessage("");
    try {
      for (const schedule of scheduleData) {
        await handleSubmitSchedule(schedule);
      }
      setMessage("Schedules generated successfully");
    } catch (error: any) {
      setMessage(`Failed to generate schedules: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col w-full max-w-md mx-auto py-8 md:py-12">
        <UserSessionHandler /> {/* Include UserSessionHandler */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Generate Schedules</h1>
        </div>
        <div className="flex flex-col mb-4">
          <label htmlFor="weeks" className="block text-sm font-medium">
            Number of Weeks
          </label>
          <Input
            type="number"
            id="weeks"
            value={weeks}
            onChange={(e) => setWeeks(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            min="1"
          />
        </div>
        {scheduleData.map((schedule, index) => (
          <div
            key={index}
            className="mb-4 flex flex-col items-center space-y-2"
          >
            <Select
              onValueChange={(value) =>
                handleInputChange(index, {
                  target: { name: "employee_id", value },
                } as ChangeEvent<HTMLSelectElement>)
              }
            >
              <SelectTrigger className="w-full">
                <SelectPrimitive.Value placeholder="Select Employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {employees.map((employee) => (
                    <SelectItem
                      key={employee.employee_id}
                      value={employee.employee_id}
                    >
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Calendar
              selected={schedule.day || undefined}
              onDayClick={(date) => handleDateChange(index, date)}
            />
            <div className="flex space-x-2">
              <Input
                type="text"
                name="start_time"
                value={schedule.start_time}
                onChange={(e) => handleInputChange(index, e)}
                placeholder="Start Time (e.g., 5:30PM)"
              />
              <Input
                type="text"
                name="end_time"
                value={schedule.end_time}
                onChange={(e) => handleInputChange(index, e)}
                placeholder="End Time (e.g., 9:30PM)"
              />
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => handleRemoveFields(index)}
              >
                Remove
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSubmitSchedule(schedule)}
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit Schedule"}
              </Button>
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between max-w-full py-2">
          <Button variant="outline" onClick={handleAddFields}>
            Add Schedule
          </Button>
          <Button
            variant="outline"
            onClick={handleGenerateSchedules}
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Schedules"}
          </Button>
        </div>
        {message && <p className="mt-4 text-center text-lg">{message}</p>}
      </div>
    </>
  );
};

// Wrap the page with the WithRole HOC and specify allowed roles and emails
export default function ProtectedScheduleGeneratorPage() {
  return (
    <WithRole
      allowedRoles={["super admin"]}
      allowedEmails={["samlee@thegunrange.biz"]}
    >
      <ScheduleGeneratorPage />
    </WithRole>
  );
}
