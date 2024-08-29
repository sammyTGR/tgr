import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Employee } from "./types";
import { supabase } from "@/utils/supabase/client";

interface AddEmployeeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (employee: Omit<Employee, "employee_id">) => void;
}

interface ScheduleEntry {
  day: string;
  start_time: string;
  end_time: string;
}

const initialSchedule: ScheduleEntry[] = [
  { day: "Sunday", start_time: "", end_time: "" },
  { day: "Monday", start_time: "", end_time: "" },
  { day: "Tuesday", start_time: "", end_time: "" },
  { day: "Wednesday", start_time: "", end_time: "" },
  { day: "Thursday", start_time: "", end_time: "" },
  { day: "Friday", start_time: "", end_time: "" },
  { day: "Saturday", start_time: "", end_time: "" },
];

export default function AddEmployeeDialog({
  isOpen,
  onClose,
  onAdd,
}: AddEmployeeDialogProps) {
  const [newEmployee, setNewEmployee] = useState<Omit<Employee, "employee_id">>(
    {
      name: "",
      department: "",
      role: "",
      contact_info: "",
      lanid: "",
      pay_type: "",
      rank: null,
      pay_rate: null,
    }
  );

  const [schedule, setSchedule] = useState<ScheduleEntry[]>(initialSchedule);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewEmployee((prev) => ({
      ...prev,
      [name]:
        name === "rank" || name === "pay_rate"
          ? parseFloat(value) || null
          : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setNewEmployee((prev) => ({ ...prev, [name]: value }));
  };

  const handleScheduleChange = (
    index: number,
    field: "start_time" | "end_time",
    value: string
  ) => {
    setSchedule((prev) =>
      prev.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // console.log("New employee data:", newEmployee);

      // Add the employee
      const { data: insertedEmployee, error: employeeError } = await supabase
        .from("employees")
        .insert([newEmployee])
        .select();

      if (employeeError) {
        console.error("Error adding employee:", employeeError);
        return;
      }

      if (!insertedEmployee || insertedEmployee.length === 0) {
        console.error("No employee data returned after insert");
        return;
      }

      const newEmployeeId = insertedEmployee[0].employee_id;

      // Add all schedule entries, including those without times
      const scheduleEntries = schedule.map((entry) => ({
        employee_id: newEmployeeId,
        name: newEmployee.name,
        day_of_week: entry.day,
        start_time: entry.start_time || null,
        end_time: entry.end_time || null,
      }));

      const { error: scheduleError } = await supabase
        .from("reference_schedules")
        .insert(scheduleEntries);

      if (scheduleError) {
        console.error("Error adding schedule:", scheduleError);
        return;
      }

      // Call onAdd with the newly created employee data
      onAdd(insertedEmployee[0]);

      // Reset form and close dialog
      setNewEmployee({
        name: "",
        department: "",
        role: "",
        contact_info: "",
        lanid: "",
        pay_type: "",
        rank: null,
        pay_rate: null,
      });
      setSchedule(initialSchedule);
      onClose();
    } catch (error) {
      console.error("Error in handleSubmit:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-2">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                {" "}
                {/* Added space-y-2 for padding between label and input */}
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={newEmployee.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  name="department"
                  value={newEmployee.department}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  name="role"
                  value={newEmployee.role}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="contact_info">Contact Info</Label>
                <Input
                  id="contact_info"
                  name="contact_info"
                  value={newEmployee.contact_info}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="lanid">LANID</Label>
                <Input
                  id="lanid"
                  name="lanid"
                  value={newEmployee.lanid}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="pay_type">Pay Type</Label>
                <Select
                  onValueChange={(value) =>
                    handleSelectChange("pay_type", value)
                  }
                  value={newEmployee.pay_type}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select pay type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="salary">Salary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="rank">Rank</Label>
                <Input
                  id="rank"
                  name="rank"
                  type="number"
                  value={newEmployee.rank?.toString() || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="pay_rate">Pay Rate</Label>
                <Input
                  id="pay_rate"
                  name="pay_rate"
                  type="number"
                  step="0.01"
                  value={newEmployee.pay_rate?.toString() || ""}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold">Schedule</h3>
              {schedule.map((entry, index) => (
                <div key={entry.day} className="grid grid-cols-3 gap-2">
                  <div>{entry.day}</div>
                  <Input
                    type="time"
                    value={entry.start_time}
                    onChange={(e) =>
                      handleScheduleChange(index, "start_time", e.target.value)
                    }
                  />
                  <Input
                    type="time"
                    value={entry.end_time}
                    onChange={(e) =>
                      handleScheduleChange(index, "end_time", e.target.value)
                    }
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="linkHover1" type="submit">
              Add Employee
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}