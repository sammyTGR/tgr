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
import { TimesheetData } from "./data-schema";

interface Employee {
  employee_id: number;
  name: string;
  status: string;
}

interface AddTimesheetFormProps {
  onTimesheetAdded: (timesheet: TimesheetData) => void;
}

const AddTimesheetForm: React.FC<AddTimesheetFormProps> = ({
  onTimesheetAdded,
}) => {
  const supabase = createClientComponentClient();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const resetForm = () => {
    setEmployeeId(null);
    setDate("");
    setStartTime("");
    setLunchStart("");
    setLunchEnd("");
    setEndTime("");
  };

  const handleSubmit = async () => {
    if (employeeId && date && startTime) {
      setIsSubmitting(true);
      try {
        // Get the employee name first
        const selectedEmployee = employees?.find(
          (emp) => emp.employee_id === employeeId
        );
        if (!selectedEmployee) {
          throw new Error("Selected employee not found");
        }

        // Format time to match PostgreSQL time without time zone format
        const formatTimeForDB = (time: string) => {
          if (!time) return null;
          return time + ":00"; // Add seconds to match "HH:mm:ss" format
        };

        const { data, error } = await supabase
          .from("employee_clock_events")
          .insert({
            employee_id: employeeId,
            employee_name: selectedEmployee.name, // Add the employee name here
            event_date: date,
            start_time: formatTimeForDB(startTime),
            lunch_start: formatTimeForDB(lunchStart),
            lunch_end: formatTimeForDB(lunchEnd),
            end_time: formatTimeForDB(endTime),
          })
          .select()
          .single();

        if (error) throw error;

        const newTimesheet = {
          ...data,
          employee_name: selectedEmployee.name, // Use the name from the selected employee
        } as TimesheetData;

        onTimesheetAdded(newTimesheet);
        setOpen(false);
        resetForm();
        toast.success("Timesheet entry added successfully");
      } catch (error) {
        console.error("Error submitting timesheet:", error);
        toast.error("Failed to submit timesheet");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      toast.error("Please fill in employee, date, and start time");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
          <Button
            variant="outline"
            onClick={handleSubmit}
            disabled={isSubmitting || !employeeId || !date || !startTime}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AddTimesheetForm;
