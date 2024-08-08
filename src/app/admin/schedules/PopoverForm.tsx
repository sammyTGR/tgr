"use client";

import { useState } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface TimesheetData {
  id: number;
  employee_id: number;
  start_time: string;
  lunch_start: string | null;
  lunch_end: string | null;
  end_time: string | null;
  total_hours: string | null;
  created_at: string | null;
  employee_name: string | null;
  event_date: string | null;
}

interface PopoverFormProps {
  onSubmit: (
    employeeName: string,
    weeks?: string,
    date?: string,
    startTime?: string,
    endTime?: string,
    lunchStart?: string,
    lunchEnd?: string
  ) => void;
  buttonText: string;
  placeholder: string;
  employees?: { employee_id: number; name: string }[];
  formType:
    | "generate"
    | "addSchedule"
    | "generateAll"
    | "clearSchedule"
    | "editTimesheet";
  row?: TimesheetData; // Add this for timesheet editing
}

export const PopoverForm: React.FC<PopoverFormProps> = ({
  onSubmit,
  buttonText,
  placeholder,
  employees,
  formType,
  row,
}) => {
  const [employeeName, setEmployeeName] = useState("");
  const [weeks, setWeeks] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [lunchStart, setLunchStart] = useState(row?.lunch_start || "");
  const [lunchEnd, setLunchEnd] = useState(row?.lunch_end || "");
  const [employeeId, setEmployeeId] = useState<number | null>(null);

  const handleSubmit = () => {
    if (formType === "generate" || formType === "clearSchedule") {
      const selectedEmployee = employees?.find(
        (emp) => emp.employee_id === employeeId
      );
      onSubmit(selectedEmployee?.name || "", weeks);
      if (formType === "generate") {
        toast.success(
          `Published ${weeks} weeks of schedules for ${selectedEmployee?.name}!`
        );
      } else {
        toast.success(`Cleared all of ${selectedEmployee?.name}'s schedules!`);
      }
    } else if (formType === "generateAll") {
      onSubmit("", weeks);
      toast.success(
        `${weeks} weeks of schedules have been published for the crew!`
      );
    } else if (
      formType === "addSchedule" &&
      employeeId &&
      date &&
      startTime &&
      endTime
    ) {
      const selectedEmployee = employees?.find(
        (emp) => emp.employee_id === employeeId
      );
      onSubmit(
        selectedEmployee?.name || "",
        undefined,
        date,
        startTime,
        endTime
      );
      toast.success(
        `Added a shift for ${selectedEmployee?.name} on ${date} from ${startTime} - ${endTime}!`
      );
    } else if (formType === "editTimesheet") {
      onSubmit(
        row?.employee_name || "",
        undefined,
        undefined,
        undefined,
        undefined,
        lunchStart,
        lunchEnd
      );
      toast.success(
        `Updated lunch times for ${row?.employee_name} on ${row?.event_date}!`
      );
    }
    resetForm();
  };

  const resetForm = () => {
    setEmployeeName("");
    setWeeks("");
    setDate("");
    setStartTime("");
    setEndTime("");
    setLunchStart("");
    setLunchEnd("");
    setEmployeeId(null);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="linkHover2">{buttonText}</Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="p-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {placeholder}
          </label>
          {formType === "generateAll" ? (
            <Input
              type="number"
              value={weeks}
              onChange={(e) => setWeeks(e.target.value)}
              placeholder="Number of weeks"
              className="mt-2"
            />
          ) : formType === "editTimesheet" ? (
            <>
              <Label>Lunch Start</Label>
              <Input
                type="time"
                value={lunchStart}
                onChange={(e) => setLunchStart(e.target.value)}
              />
              <Label>Lunch End</Label>
              <Input
                type="time"
                value={lunchEnd}
                onChange={(e) => setLunchEnd(e.target.value)}
              />
              <Button className="mt-2" onClick={handleSubmit}>
                Submit
              </Button>
            </>
          ) : (
            <>
              {(formType === "generate" ||
                formType === "clearSchedule" ||
                formType === "addSchedule") &&
                employees && (
                  <div>
                    <Label>Employee</Label>
                    <Select
                      onValueChange={(value) => setEmployeeId(Number(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem
                            key={employee.employee_id}
                            value={employee.employee_id.toString()}
                          >
                            {employee.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              {formType === "generate" && (
                <Input
                  type="number"
                  value={weeks}
                  onChange={(e) => setWeeks(e.target.value)}
                  placeholder="Number of weeks"
                  className="mt-2"
                />
              )}
              {formType === "addSchedule" && (
                <>
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </>
              )}
            </>
          )}
          <Button variant="linkHover1" className="mt-2" onClick={handleSubmit}>
            Submit
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};