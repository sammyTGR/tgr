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
  employees?: { employee_id: number; name: string }[];
  formType: "generate" | "addSchedule" | "generateAll" | "clearSchedule";
}

export const PopoverForm: React.FC<PopoverFormProps> = ({
  onSubmit,
  buttonText,
  placeholder,
  employees,
  formType,
}) => {
  const [employeeName, setEmployeeName] = useState("");
  const [weeks, setWeeks] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
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
    }
    resetForm();
  };

  const resetForm = () => {
    setEmployeeName("");
    setWeeks("");
    setDate("");
    setStartTime("");
    setEndTime("");
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
