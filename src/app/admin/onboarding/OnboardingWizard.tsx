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
import { useMutation } from "@tanstack/react-query";

type OnboardingData = {
  name: string;
  last_name: string;
  contact_info: string;
  phone_number: string;
  street_address: string;
  city: string;
  state: string;
  zip: string;
  birthday: string;
  hire_date: string;
  // promotion_date: string | null;
  department: string;
  role: string;
  position: string | null;
  rank: number;
  pay_type: string;
  pay_rate: number;
  schedule: {
    [day: string]: { start_time: string; end_time: string };
  };
};

const initialData: OnboardingData = {
  name: "",
  last_name: "",
  contact_info: "",
  phone_number: "",
  street_address: "",
  city: "",
  state: "",
  zip: "",
  birthday: "",
  hire_date: "",
  // promotion_date: null,
  department: "",
  role: "",
  position: null,
  rank: 0,
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
          data.name.trim() !== "" &&
          data.last_name.trim() !== "" &&
          data.contact_info.trim() !== "" &&
          data.birthday.trim() !== "" &&
          data.hire_date.trim() !== ""
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
                value={data.name}
                onChange={(e) => updateData({ name: e.target.value })}
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
              <Label htmlFor="contact_info">Work Email</Label>
              <Input
                id="contact_info"
                value={data.contact_info}
                onChange={(e) => updateData({ contact_info: e.target.value })}
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
              <Label htmlFor="birthday" className="flex items-center gap-1">
                Birthday <span className="text-destructive">*</span>
              </Label>
              <Input
                id="birthday"
                type="date"
                value={data.birthday}
                onChange={(e) => updateData({ birthday: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hire_date" className="flex items-center gap-1">
                Hire Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="hire_date"
                type="date"
                value={data.hire_date}
                onChange={(e) => updateData({ hire_date: e.target.value })}
              />
            </div>
            {/* <div className="space-y-2">
              <Label htmlFor="promotion_date">Promotion Date</Label>
              <Input
                id="promotion_date"
                type="date"
                value={data.promotion_date || ""}
                onChange={(e) =>
                  updateData({ promotion_date: e.target.value || null })
                }
              />
            </div> */}
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
              <Label htmlFor="rank">Employee Number</Label>
              <Input
                id="rank"
                type="number"
                value={data.rank.toString()}
                onChange={(e) =>
                  updateData({ rank: parseInt(e.target.value) || 0 })
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

  const employeeMutation = useMutation({
    mutationFn: async (employeeData: Partial<OnboardingData>) => {
      const sanitizedData = {
        name: employeeData.name,
        last_name: employeeData.last_name,
        department: employeeData.department,
        role: employeeData.role,
        contact_info: employeeData.contact_info,
        rank: employeeData.rank,
        pay_type: employeeData.pay_type,
        pay_rate: employeeData.pay_rate,
        hire_date: employeeData.hire_date || null,
        birthday: employeeData.birthday || null,
        phone_number: employeeData.phone_number,
        street_address: employeeData.street_address,
        city: employeeData.city,
        state: employeeData.state,
        zip: employeeData.zip,
      };

      const { data, error } = await supabase
        .from("employees")
        .insert(sanitizedData)
        .select();

      if (error) {
        throw error;
      }
      return data[0];
    },
    onError: (error) => {
      console.error("Error inserting employee:", error);
      toast.error(
        "Failed to add employee. Please ensure all required fields are filled correctly."
      );
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: async ({
      employeeId,
      scheduleData,
    }: {
      employeeId: number;
      scheduleData: OnboardingData["schedule"];
    }) => {
      const scheduleEntries = Object.entries(scheduleData).map(
        ([day, times]) => ({
          employee_id: employeeId,
          day_of_week: day.charAt(0).toUpperCase() + day.slice(1),
          start_time: times.start_time ? `${times.start_time}:00` : null,
          end_time: times.end_time ? `${times.end_time}:00` : null,
          name: `${data.name} ${data.last_name}`,
        })
      );

      const { error } = await supabase
        .from("reference_schedules")
        .insert(scheduleEntries);

      if (error) throw error;
    },
    onError: (error) => {
      console.error("Error inserting schedule:", error);
      toast.error("Failed to add employee schedule");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const employee = await employeeMutation.mutateAsync(data);

      if (employee) {
        await scheduleMutation.mutateAsync({
          employeeId: employee.id,
          scheduleData: data.schedule,
        });

        toast.success("Employee onboarded with their working schedule!");
        setData(initialData);
        setStep(1);
      }
    } catch (error) {
      // Error handling is managed by the mutation callbacks
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
