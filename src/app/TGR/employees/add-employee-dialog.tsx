import { useEffect, useState } from "react";
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

interface ReferenceOption {
  id: number;
  field_name: string;
  option_value: string;
  display_order: number;
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
      last_name: "",
      lanid: "",
      phone_number: "",
      street_address: "",
      city: "",
      state: "",
      zip: "",
      department: "",
      role: "",
      position: "",
      contact_info: "",
      pay_type: null,
      employee_number: null,
      pay_rate: null,
      hire_date: null,
      birthday: null,
      promotion_date: null,
      status:"",
      term_date:null
    }
  );

  const [schedule, setSchedule] = useState<ScheduleEntry[]>(initialSchedule);
  const [roles, setRoles] = useState<string[]>([]);
  const [referenceOptions, setReferenceOptions] = useState<ReferenceOption[]>(
    []
  );

  useEffect(() => {
    fetchReferenceOptions();
  }, []);

  const fetchReferenceOptions = async () => {
    const { data, error } = await supabase
      .from("onboarding_references")
      .select("*")
      .order("display_order");

    if (error) {
      console.error("Error fetching reference options:", error);
    } else {
      setReferenceOptions(data || []);
    }
  };

  const getOptionsForField = (fieldName: string) => {
    return referenceOptions
      .filter((option) => option.field_name === fieldName)
      .sort((a, b) => a.display_order - b.display_order);
  };

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
        last_name: "",
        lanid: "",
        phone_number: "",
        street_address: "",
        city: "",
        state: "",
        zip: "",
        department: "",
        role: "",
        position: "",
        contact_info: "",
        pay_type: null,
        employee_number: null,
        pay_rate: null,
        hire_date: null,
        birthday: null,
        promotion_date: null,
        status:"",
        term_date:null
      });
      setSchedule(initialSchedule);
      onClose();
    } catch (error) {
      console.error("Error in handleSubmit:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-2 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex-grow overflow-auto">
          <div className="grid grid-cols-6 gap-4 p-2">
            <div className="col-span-2">
              {/* Added space-y-2 for padding between label and input */}
              <div className="flex flex-col space-y-2">
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
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  value={newEmployee.last_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  name="phone_number"
                  value={newEmployee.phone_number}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="street_address">Street Address</Label>
                <Input
                  id="street_address"
                  name="street_address"
                  value={newEmployee.street_address}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  value={newEmployee.city}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  name="state"
                  value={newEmployee.state}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="zip">Zip</Label>
                <Input
                  id="zip"
                  name="zip"
                  value={newEmployee.zip}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select
                  onValueChange={(value) =>
                    handleSelectChange("department", value)
                  }
                  value={newEmployee.department}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {getOptionsForField("department").map((option) => (
                      <SelectItem key={option.id} value={option.option_value}>
                        {option.option_value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  onValueChange={(value) => handleSelectChange("role", value)}
                  value={newEmployee.role}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {getOptionsForField("role").map((option) => (
                      <SelectItem key={option.id} value={option.option_value}>
                        {option.option_value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Second column */}
            <div className="col-span-2 space-y-4">
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
                <Label htmlFor="pay_type">Pay Type</Label>
                <Select
                  onValueChange={(value) =>
                    handleSelectChange("pay_type", value)
                  }
                  value={newEmployee.pay_type || ""}
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
                <Label htmlFor="lanid">LANID</Label>
                <Input
                  id="lanid"
                  name="lanid"
                  value={newEmployee.lanid || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="rank">Employee Number</Label>
                <Input
                  id="rank"
                  name="rank"
                  type="number"
                  value={newEmployee.employee_number?.toString() || ""}
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
              <div className="flex flex-col space-y-2">
                <Label htmlFor="hire_date">Hire Date</Label>

                <Input
                  id="hire_date"
                  name="hire_date"
                  type="date"
                  value={newEmployee.hire_date || ""}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="flex flex-col space-y-2">
                <Label htmlFor="birthday">Birthday</Label>

                <Input
                  id="birthday"
                  name="birthday"
                  type="date"
                  value={newEmployee.birthday || ""}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="promotion_date">Promotion Date</Label>
                <Input
                  id="promotion_date"
                  name="promotion_date"
                  type="date"
                  value={newEmployee.promotion_date || ""}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          <div className="col-span-2 space-y-4">
            {/* Third column */}
            <div className="flex flex-col space-y-2">
              <h3 className="font-semibold text-lg mt-2">Schedule</h3>
              <div className="grid grid-cols-6 gap-2 mb-2">
                <div>Day</div>
                <div>Start Time</div>
                <div>End Time</div>
              </div>
              {schedule.map((entry, index) => (
                <div key={entry.day} className="grid grid-cols-6 gap-2">
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
