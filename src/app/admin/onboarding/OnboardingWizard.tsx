"use client";

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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

const OnboardingWizard = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: formData } = useQuery({
    queryKey: ["onboardingForm"],
    queryFn: () => initialData,
    initialData: initialData,
  });

  const { data: currentStep } = useQuery({
    queryKey: ["onboardingStep"],
    queryFn: () => 1,
    initialData: 1,
  });

  const { data: showCompletionDialog = false } = useQuery({
    queryKey: ["completionDialog"],
    queryFn: () => false,
    initialData: false,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("onboarding_references")
        .select("option_value")
        .eq("field_name", "department")
        .order("display_order");
      return data?.map((d) => d.option_value) || [];
    },
  });

  const { data: positions = [] } = useQuery({
    queryKey: ["positions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("onboarding_references")
        .select("option_value")
        .eq("field_name", "position")
        .order("display_order");
      return data?.map((p) => p.option_value) || [];
    },
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("onboarding_references")
        .select("option_value")
        .eq("field_name", "role")
        .order("display_order");
      return data?.map((r) => r.option_value) || [];
    },
  });

  const referenceData = {
    departments,
    positions,
    roles,
  };

  const updateData = (fields: Partial<OnboardingData>) => {
    queryClient.setQueryData(["onboardingForm"], (old: OnboardingData) => ({
      ...old,
      ...fields,
    }));
  };

  const handleNext = () => {
    queryClient.setQueryData(["onboardingStep"], (prev: number) =>
      Math.min(prev + 1, 4)
    );
  };
  const handlePrev = () => {
    queryClient.setQueryData(["onboardingStep"], (prev: number) =>
      Math.max(prev - 1, 1)
    );
  };

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
    updateData({
      schedule: {
        ...formData.schedule,
        [day]: { ...formData.schedule[day], [field]: value },
      },
    });
  };

  const isStepComplete = () => {
    switch (currentStep) {
      case 1:
        return (
          formData.name.trim() !== "" &&
          formData.last_name.trim() !== "" &&
          formData.contact_info.trim() !== "" &&
          formData.birthday.trim() !== "" &&
          formData.hire_date.trim() !== ""
        );
      case 2:
        return formData.department !== "" && formData.role !== "";
      case 3:
        return formData.pay_type !== "" && formData.pay_rate > 0;
      case 4:
        return Object.values(formData.schedule).some(
          (day) => day.start_time && day.end_time
        );
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.name}
                onChange={(e) => updateData({ name: e.target.value })}
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => updateData({ last_name: e.target.value })}
                placeholder="Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_info">Work Email</Label>
              <Input
                id="contact_info"
                value={formData.contact_info}
                onChange={(e) => updateData({ contact_info: e.target.value })}
                placeholder="john.doe@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                value={formData.phone_number}
                onChange={handlePhoneChange}
                placeholder="xxx-xxx-xxxx"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="street_address">Street Address</Label>
              <Input
                id="street_address"
                value={formData.street_address}
                onChange={(e) => updateData({ street_address: e.target.value })}
                placeholder="123 Main St"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => updateData({ city: e.target.value })}
                placeholder="Anytown"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => updateData({ state: e.target.value })}
                placeholder="CA"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">ZIP Code</Label>
              <Input
                id="zip"
                value={formData.zip}
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
                value={formData.birthday}
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
                value={formData.hire_date}
                onChange={(e) => updateData({ hire_date: e.target.value })}
              />
            </div>
            {/* <div className="space-y-2">
              <Label htmlFor="promotion_date">Promotion Date</Label>
              <Input
                id="promotion_date"
                type="date"
                value={formData.promotion_date || ""}
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
                value={formData.department}
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
                value={formData.position || ""}
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
                value={formData.role}
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
                value={formData.rank.toString()}
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
                value={formData.pay_type}
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
                value={formData.pay_rate.toString()}
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
            {Object.entries(formData.schedule).map(([day, times]) => (
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
        .select("employee_id")
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: async ({
      employeeId,
      scheduleData,
      employeeName,
    }: {
      employeeId: number;
      scheduleData: OnboardingData["schedule"];
      employeeName: string;
    }) => {
      const scheduleEntries = Object.entries(scheduleData)
        .filter(([_, times]) => times.start_time || times.end_time)
        .map(([day, times]) => ({
          employee_id: employeeId,
          day_of_week: day.charAt(0).toUpperCase() + day.slice(1),
          start_time: times.start_time ? `${times.start_time}:00` : null,
          end_time: times.end_time ? `${times.end_time}:00` : null,
          name: employeeName,
        }));

      if (scheduleEntries.length === 0) {
        return; // No schedules to insert
      }

      const { data, error } = await supabase
        .from("reference_schedules")
        .insert(scheduleEntries)
        .select();

      if (error) {
        console.error("Schedule insertion error:", error);
        throw error;
      }

      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const employee = await employeeMutation.mutateAsync(formData);

      if (!employee || !employee.employee_id) {
        throw new Error("Employee creation failed: missing employee_id");
      }

      const employeeName = `${formData.name} ${formData.last_name}`;
      await scheduleMutation.mutateAsync({
        employeeId: employee.employee_id,
        scheduleData: formData.schedule,
        employeeName,
      });

      toast.success("Employee onboarded successfully!");
      queryClient.setQueryData(["completionDialog"], true);
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to complete onboarding process"
      );
    }
  };

  const CompletionDialog = () => (
    <AlertDialog open={showCompletionDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Employee Successfully Onboarded</AlertDialogTitle>
          <AlertDialogDescription>
            Would you like to add another employee or manage existing staff?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={() => {
              queryClient.setQueryData(["onboardingForm"], initialData);
              queryClient.setQueryData(["onboardingStep"], 1);
              queryClient.setQueryData(["completionDialog"], false);
            }}
          >
            Add Another Employee
          </AlertDialogAction>
          <AlertDialogAction onClick={() => router.push("/TGR/employees")}>
            Manage Staff
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 bg-card rounded-lg shadow-lg">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`w-1/4 h-2 rounded-full ${
                i <= currentStep ? "bg-primary" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Step {currentStep} of 4
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {renderStep()}

        <div className="mt-8 flex justify-between">
          {currentStep > 1 && (
            <Button type="button" variant="outline" onClick={handlePrev}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
          )}
          {currentStep < 4 ? (
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
      <CompletionDialog />
    </div>
  );
};

export default OnboardingWizard;
