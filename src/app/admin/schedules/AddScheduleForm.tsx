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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [open, setOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const handleSubmit = () => {
    if (employeeId && date && startTime && endTime) {
      onAddSchedule(employeeId, date, startTime, endTime);
      setOpen(false); // Close the popover
      // Reset form fields
      setEmployeeId(null);
      setDate("");
      setStartTime("");
      setEndTime("");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button>Add Schedule</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employee">Employee</Label>
            <Select
              value={employeeId?.toString() ?? ""}
              onValueChange={(value) => setEmployeeId(Number(value))}
            >
              <SelectTrigger id="employee">
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
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="startTime">Start Time</Label>
            <Input
              id="startTime"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endTime">End Time</Label>
            <Input
              id="endTime"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
          <Button onClick={handleSubmit} className="w-full">
            Submit
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AddScheduleForm;
