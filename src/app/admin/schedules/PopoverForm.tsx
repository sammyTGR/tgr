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

interface PopoverFormProps {
  onSubmit: (
    employeeName: string,
    weeks?: string,
    date?: string,
    startTime?: string,
    endTime?: string
  ) => void;
  buttonText: string;
  placeholder: string;
  formType: "generate" | "addSchedule";
  employees?: { employee_id: number; name: string }[];
}

const PopoverForm: React.FC<PopoverFormProps> = ({
  onSubmit,
  buttonText,
  placeholder,
  formType,
  employees,
}) => {
  const [employeeName, setEmployeeName] = useState("");
  const [weeks, setWeeks] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [employeeId, setEmployeeId] = useState<number | null>(null);

  const handleSubmit = () => {
    if (formType === "generate") {
      onSubmit(employeeName, weeks);
    } else if (
      formType === "addSchedule" &&
      employeeId &&
      date &&
      startTime &&
      endTime
    ) {
      onSubmit(employeeName, undefined, date, startTime, endTime);
    }
  };

  return (
    <Popover>
      <PopoverTrigger>
        <Button>{buttonText}</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="space-y-4">
          {formType === "addSchedule" && employees && (
            <div>
              <Label>Employee</Label>
              <select
                value={employeeId ?? ""}
                onChange={(e) => setEmployeeId(Number(e.target.value))}
              >
                <option value="" disabled>
                  Select Employee
                </option>
                {employees.map((employee) => (
                  <option
                    key={employee.employee_id}
                    value={employee.employee_id}
                  >
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <Label>Employee Name</Label>
            <Input
              type="text"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              placeholder={placeholder}
            />
          </div>
          {formType === "generate" && (
            <div>
              <Label>Weeks</Label>
              <Input
                type="text"
                value={weeks}
                onChange={(e) => setWeeks(e.target.value)}
                placeholder="Enter number of weeks"
              />
            </div>
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
          <Button onClick={handleSubmit}>Submit</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default PopoverForm;
