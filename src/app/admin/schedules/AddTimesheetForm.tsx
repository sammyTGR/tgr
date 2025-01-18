import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useQuery } from "@tanstack/react-query";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Employee {
  employee_id: number;
  name: string;
  status: string;
}

interface AddTimesheetFormProps {
  onTimesheetAdded: (
    employeeId: number,
    date: string,
    startTime: string,
    lunchStart: string | null,
    lunchEnd: string | null,
    endTime: string | null
  ) => void;
}

const AddTimesheetForm: React.FC<AddTimesheetFormProps> = ({
  onTimesheetAdded,
}) => {
  const supabase = createClientComponentClient();
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [lunchStart, setLunchStart] = useState("");
  const [lunchEnd, setLunchEnd] = useState("");
  const [endTime, setEndTime] = useState("");

  // Fetch active hourly employees
  const { data: employees } = useQuery({
    queryKey: ["activeHourlyEmployees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("employee_id, name")
        .eq("status", "active")
        .eq("pay_type", "hourly")
        .order("name");

      if (error) throw error;
      return data as Employee[];
    },
  });

  const handleSubmit = () => {
    if (employeeId && date && startTime) {
      onTimesheetAdded(
        employeeId,
        date,
        startTime,
        lunchStart || null,
        lunchEnd || null,
        endTime || null
      );
    } else {
      toast.error("Please fill in employee, date, and start time");
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Add Timesheet Entry</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div>
            <Label>Employee *</Label>
            <Select onValueChange={(value) => setEmployeeId(Number(value))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Employee" />
              </SelectTrigger>
              <SelectContent>
                {employees?.map((employee) => (
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
          <div>
            <Label>Date *</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <Label>Start Time *</Label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div>
            <Label>Lunch Start</Label>
            <Input
              type="time"
              value={lunchStart}
              onChange={(e) => setLunchStart(e.target.value)}
            />
          </div>
          <div>
            <Label>Lunch End</Label>
            <Input
              type="time"
              value={lunchEnd}
              onChange={(e) => setLunchEnd(e.target.value)}
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
          <Button variant="outline" onClick={handleSubmit}>
            Submit
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AddTimesheetForm;
