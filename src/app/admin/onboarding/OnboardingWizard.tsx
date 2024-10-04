"use client";

import { useState, useEffect } from "react";
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
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";

type OnboardingData = {
  first_name: string;
  last_name: string;
  work_email: string;
  phone_number: string;
  street_address: string;
  city: string;
  state: string;
  zip: string;
  birthday: string;
  hire_date: string;
  promotion_date: string | null;
  department: string;
  role: string;
  position: string | null;
  employee_number: number;
  pay_type: string;
  pay_rate: number;
  schedule: {
    [day: string]: { start_time: string; end_time: string };
  };
};

const initialData: OnboardingData = {
  first_name: "",
  last_name: "",
  work_email: "",
  phone_number: "",
  street_address: "",
  city: "",
  state: "",
  zip: "",
  birthday: "",
  hire_date: "",
  promotion_date: null,
  department: "",
  role: "",
  position: null,
  employee_number: 0,
  pay_type: "hourly",
  pay_rate: 0,
  schedule: {
    monday: { start_time: "", end_time: "" },
    tuesday: { start_time: "", end_time: "" },
    wednesday: { start_time: "", end_time: "" },
    thursday: { start_time: "", end_time: "" },
    friday: { start_time: "", end_time: "" },
    saturday: { start_time: "", end_time: "" },
    sunday: { start_time: "", end_time: "" },
  },
};

interface ReferenceData {
  departments: string[];
  positions: string[];
  roles: string[];
}

const OnboardingWizard = () => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(initialData);
  const [referenceData, setReferenceData] = useState<ReferenceData>({
    departments: [],
    positions: [],
    roles: [],
  });

  useEffect(() => {
    // Fetch reference data from Supabase
    const fetchReferenceData = async () => {
      // Replace this with your actual Supabase query
      const { data: departments } = await supabase
        .from("onboarding_references")
        .select("option_value")
        .eq("field_name", "department")
        .order("display_order");

      const { data: positions } = await supabase
        .from("onboarding_references")
        .select("option_value")
        .eq("field_name", "position")
        .order("display_order");

      const { data: roles } = await supabase
        .from("onboarding_references")
        .select("option_value")
        .eq("field_name", "role")
        .order("display_order");

      setReferenceData({
        departments: departments?.map((d) => d.option_value) || [],
        positions: positions?.map((p) => p.option_value) || [],
        roles: roles?.map((r) => r.option_value) || [],
      });
    };

    fetchReferenceData();
  }, []);

  const updateData = (fields: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...fields }));
  };

  const handleNext = () => setStep((prev) => Math.min(prev + 1, 4));
  const handlePrev = () => setStep((prev) => Math.max(prev - 1, 1));

  const formatPhoneNumber = (input: string) => {
    const cleaned = input.replace(/\D/g, "");
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
    return input;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    updateData({ phone_number: formatted });
  };

  const handleTimeChange = (
    day: string,
    field: "start_time" | "end_time",
    value: string
  ) => {
    setData((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: { ...prev.schedule[day], [field]: value },
      },
    }));
  };

  const isStepComplete = () => {
    switch (step) {
      case 1:
        return (
          data.first_name.trim() !== "" &&
          data.last_name.trim() !== "" &&
          data.work_email.trim() !== ""
        );
      case 2:
        return data.department !== "" && data.role !== "";
      case 3:
        return data.pay_type !== "" && data.pay_rate > 0;
      case 4:
        return Object.values(data.schedule).some(
          (day) => day.start_time && day.end_time
        );
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={data.first_name}
                onChange={(e) => updateData({ first_name: e.target.value })}
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={data.last_name}
                onChange={(e) => updateData({ last_name: e.target.value })}
                placeholder="Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="work_email">Work Email</Label>
              <Input
                id="work_email"
                value={data.work_email}
                onChange={(e) => updateData({ work_email: e.target.value })}
                placeholder="john.doe@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                value={data.phone_number}
                onChange={handlePhoneChange}
                placeholder="xxx-xxx-xxxx"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="street_address">Street Address</Label>
              <Input
                id="street_address"
                value={data.street_address}
                onChange={(e) => updateData({ street_address: e.target.value })}
                placeholder="123 Main St"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={data.city}
                onChange={(e) => updateData({ city: e.target.value })}
                placeholder="Anytown"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={data.state}
                onChange={(e) => updateData({ state: e.target.value })}
                placeholder="CA"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">ZIP Code</Label>
              <Input
                id="zip"
                value={data.zip}
                onChange={(e) => updateData({ zip: e.target.value })}
                placeholder="12345"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthday">Birthday</Label>
              <Input
                id="birthday"
                type="date"
                value={data.birthday}
                onChange={(e) => updateData({ birthday: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hire_date">Hire Date</Label>
              <Input
                id="hire_date"
                type="date"
                value={data.hire_date}
                onChange={(e) => updateData({ hire_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promotion_date">Promotion Date</Label>
              <Input
                id="promotion_date"
                type="date"
                value={data.promotion_date || ""}
                onChange={(e) =>
                  updateData({ promotion_date: e.target.value || null })
                }
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={data.department}
                onValueChange={(value) => updateData({ department: value })}
              >
                <SelectTrigger id="department">
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent>
                  {referenceData.departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Select
                value={data.position || ""}
                onValueChange={(value) => updateData({ position: value })}
              >
                <SelectTrigger id="position">
                  <SelectValue placeholder="Select a position" />
                </SelectTrigger>
                <SelectContent>
                  {referenceData.positions.map((pos) => (
                    <SelectItem key={pos} value={pos}>
                      {pos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div> */}
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={data.role}
                onValueChange={(value) => updateData({ role: value })}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {referenceData.roles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee_number">Employee Number</Label>
              <Input
                id="employee_number"
                type="number"
                value={data.employee_number.toString()}
                onChange={(e) =>
                  updateData({ employee_number: parseInt(e.target.value) || 0 })
                }
                placeholder="0"
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pay_type">Pay Type</Label>
              <Select
                value={data.pay_type}
                onValueChange={(value) => updateData({ pay_type: value })}
              >
                <SelectTrigger id="pay_type">
                  <SelectValue placeholder="Select pay type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="salary">Salary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay_rate">Pay Rate</Label>
              <Input
                id="pay_rate"
                type="number"
                step="0.01"
                value={data.pay_rate.toString()}
                onChange={(e) =>
                  updateData({ pay_rate: parseFloat(e.target.value) || 0 })
                }
                placeholder="0.00"
              />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <Label>Work Schedule</Label>
            <div className="grid grid-cols-3 gap-4">
              <div></div>
              <Label className="text-center">Start Time</Label>
              <Label className="text-center">End Time</Label>
            </div>
            {Object.entries(data.schedule).map(([day, times]) => (
              <div key={day} className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor={`${day}-start`} className="text-right">
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </Label>
                <Input
                  id={`${day}-start`}
                  type="time"
                  value={times.start_time}
                  onChange={(e) =>
                    handleTimeChange(day, "start_time", e.target.value)
                  }
                />
                <Input
                  id={`${day}-end`}
                  type="time"
                  value={times.end_time}
                  onChange={(e) =>
                    handleTimeChange(day, "end_time", e.target.value)
                  }
                />
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  const saveEmployeeData = async (employeeData: Partial<OnboardingData>) => {
    const { data, error } = await supabase
      .from("employees")
      .insert({
        name: employeeData.first_name,
        last_name: employeeData.last_name,
        department: employeeData.department,
        role: employeeData.role,
        contact_info: employeeData.work_email,
        position: employeeData.position,
        rank: employeeData.employee_number,
        pay_type: employeeData.pay_type,
        pay_rate: employeeData.pay_rate,
        hire_date: employeeData.hire_date,
        birthday: employeeData.birthday,
        promotion_date: employeeData.promotion_date,
        phone_number: employeeData.phone_number,
        street_address: employeeData.street_address,
        city: employeeData.city,
        state: employeeData.state,
        zip: employeeData.zip,
      })
      .select();

    if (error) {
      //console.("Error saving employee data:", error);
      throw error;
    }

    return data[0];
  };

  const saveScheduleData = async (
    employeeId: number,
    employeeName: string,
    scheduleData: OnboardingData["schedule"]
  ) => {
    const daysOfWeek = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    for (const day of daysOfWeek) {
      const times = scheduleData[
        day.toLowerCase() as keyof typeof scheduleData
      ] || { start_time: null, end_time: null };

      // First, try to select the existing record
      const { data: existingRecord, error: selectError } = await supabase
        .from("reference_schedules")
        .select("*")
        .eq("employee_id", employeeId)
        .eq("day_of_week", day)
        .single();

      if (selectError && selectError.code !== "PGRST116") {
        console.error(
          `Error checking existing record for ${day}:`,
          selectError
        );
        throw selectError;
      }

      const formattedTimes = {
        start_time: times.start_time ? `${times.start_time}:00` : null,
        end_time: times.end_time ? `${times.end_time}:00` : null,
      };

      let error;
      if (existingRecord) {
        // If record exists, update it
        const { error: updateError } = await supabase
          .from("reference_schedules")
          .update({
            start_time: formattedTimes.start_time,
            end_time: formattedTimes.end_time,
            name: employeeName,
          })
          .eq("id", existingRecord.id);
        error = updateError;
      } else {
        // If record doesn't exist, insert a new one
        const { error: insertError } = await supabase
          .from("reference_schedules")
          .insert({
            employee_id: employeeId,
            day_of_week: day,
            start_time: formattedTimes.start_time,
            end_time: formattedTimes.end_time,
            name: employeeName,
          });
        error = insertError;
      }

      if (error) {
        //console.(`Error updating/inserting schedule for ${day}:`, error);
        throw error;
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Save employee data
      const employeeData = {
        name: data.first_name,
        last_name: data.last_name,
        department: data.department,
        role: data.role,
        contact_info: data.work_email,
        rank: data.employee_number,
        pay_type: data.pay_type,
        pay_rate: data.pay_rate,
        hire_date: data.hire_date,
        birthday: data.birthday,
        promotion_date: data.promotion_date,
        phone_number: data.phone_number,
        street_address: data.street_address,
        city: data.city,
        state: data.state,
        zip: data.zip,
      };

      const { data: newEmployee, error: employeeError } = await supabase
        .from("employees")
        .insert([employeeData])
        .select();

      if (employeeError) {
        //console.("Error inserting employee:", employeeError);
        toast.error("Failed to add employee");
        return;
      }

      if (!newEmployee || newEmployee.length === 0) {
        //console.("No employee data returned after insertion");
        toast.error("Failed to add employee");
        return;
      }

      // Save schedule data
      const scheduleData = Object.entries(data.schedule).map(
        ([day, times]) => ({
          employee_id: newEmployee[0].employee_id,
          day_of_week: day.charAt(0).toUpperCase() + day.slice(1),
          start_time: times.start_time ? `${times.start_time}:00` : null,
          end_time: times.end_time ? `${times.end_time}:00` : null,
          name: newEmployee[0].name,
        })
      );

      const { error: scheduleError } = await supabase
        .from("reference_schedules")
        .insert(scheduleData);

      if (scheduleError) {
        //console.("Error inserting schedule:", scheduleError);
        toast.error("Failed to add employee schedule");
        return;
      }

      // console.log("Onboarding completed successfully");
      toast.success("Employee onboarded with their working schedule!");

      // Reset form or navigate to a success page
      setData(initialData);
      setStep(1);
    } catch (error) {
      //console.("Error during onboarding:", error);
      toast.error("An unexpected error occurred during onboarding");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-card rounded-lg shadow-lg">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`w-1/4 h-2 rounded-full ${
                i <= step ? "bg-primary" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Step {step} of 4
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {renderStep()}

        <div className="mt-8 flex justify-between">
          {step > 1 && (
            <Button type="button" variant="outline" onClick={handlePrev}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
          )}
          {step < 4 ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={!isStepComplete()}
              className="ml-auto"
            >
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={!isStepComplete()}
              className="ml-auto"
            >
              Complete Onboarding <Check className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default OnboardingWizard;
