import { useState } from "react";
import { supabase } from "@/utils/supabase/client";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface AddScheduleFormProps {
  onAddSchedule: (
    employeeId: number,
    date: string,
    startTime: string,
    endTime: string
  ) => void;
  employees: { employee_id: number; name: string }[];
}

const AddScheduleForm: React.FC<AddScheduleFormProps> = ({
  onAddSchedule,
  employees,
}) => {
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const handleSubmit = () => {
    if (employeeId && date && startTime && endTime) {
      onAddSchedule(employeeId, date, startTime, endTime);
    }
  };

  return (
    <Popover>
      <PopoverTrigger>
        <Button>Add Schedule</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="space-y-4">
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
                <option key={employee.employee_id} value={employee.employee_id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>
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
          <Button onClick={handleSubmit}>Submit</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AddScheduleForm;
