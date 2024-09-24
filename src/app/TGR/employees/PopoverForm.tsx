import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Employee } from "./types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/utils/supabase/client";

interface EditEmployeeDialogProps {
  employee: Employee;
  onSave: (updatedEmployee: Employee) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface ReferenceData {
  departments: string[];
  positions: string[];
  roles: string[];
}

export function EditEmployeeDialog({
  employee,
  onSave,
  isOpen,
  onClose,
}: EditEmployeeDialogProps) {
  const [editedEmployee, setEditedEmployee] = useState<Employee>(employee);
  const [isLoading, setIsLoading] = useState(false);
  const [referenceData, setReferenceData] = useState<ReferenceData>({
    departments: [],
    positions: [],
    roles: [],
  });

  useEffect(() => {
    setEditedEmployee(employee);
    fetchReferenceData();
  }, [employee]);

  const fetchReferenceData = async () => {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedEmployee((prev) => ({
      ...prev,
      [name]:
        name === "employee_number" || name === "pay_rate"
          ? parseFloat(value) || null
          : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setEditedEmployee((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave(editedEmployee);
    } catch (error) {
      console.error("Error saving employee:", error);
      // Optionally, show an error message to the user
    } finally {
      setIsLoading(false);
      onClose(); // Always close the dialog, whether save was successful or not
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
          <DialogDescription>Edit Staff Details</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">First Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={editedEmployee.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  value={editedEmployee.last_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                name="phone_number"
                value={editedEmployee.phone_number}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="street_address">Street Address</Label>
              <Input
                id="street_address"
                name="street_address"
                value={editedEmployee.street_address}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  value={editedEmployee.city}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  name="state"
                  value={editedEmployee.state}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="zip">Zip</Label>
              <Input
                id="zip"
                name="zip"
                value={editedEmployee.zip}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={editedEmployee.department}
                onValueChange={(value) =>
                  handleSelectChange("department", value)
                }
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
            {/* <div className="grid gap-2">
              <Label htmlFor="position">Position</Label>
              <Select
                value={editedEmployee.position}
                onValueChange={(value) => handleSelectChange("position", value)}
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
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={editedEmployee.role}
                onValueChange={(value) => handleSelectChange("role", value)}
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
            <div className="grid gap-2">
              <Label htmlFor="contact_info">Contact Info</Label>
              <Input
                id="contact_info"
                name="contact_info"
                value={editedEmployee.contact_info || ""}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lanid">LANID</Label>
              <Input
                id="lanid"
                name="lanid"
                value={editedEmployee.lanid || ""}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pay_type">Pay Type</Label>
              <Select
                value={editedEmployee.pay_type || ""}
                onValueChange={(value) => handleSelectChange("pay_type", value)}
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
            {/* <div className="grid gap-2">
              <Label htmlFor="rank">Employee Number</Label>
              <Input
                id="rank"
                name="rank"
                type="number"
                value={editedEmployee.rank?.toString() || ""}
                onChange={handleInputChange}
              />
            </div> */}
            <div className="grid gap-2">
              <Label htmlFor="pay_rate">Pay Rate</Label>
              <Input
                id="pay_rate"
                name="pay_rate"
                type="number"
                step="0.01"
                value={editedEmployee.pay_rate?.toString() || ""}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hire_date">Hire Date</Label>
              <Input
                id="hire_date"
                name="hire_date"
                type="date"
                value={editedEmployee.hire_date || ""}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="birthday">Birthday</Label>
              <Input
                id="birthday"
                name="birthday"
                type="date"
                value={editedEmployee.birthday || ""}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="promotion_date">Promotion Date</Label>
              <Input
                id="promotion_date"
                name="promotion_date"
                type="date"
                value={editedEmployee.promotion_date || ""}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
