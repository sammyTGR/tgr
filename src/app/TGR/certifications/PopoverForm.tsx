"use client";

import { useState, useEffect } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { CertificationData } from "./types"; // Ensure this import exists

interface PopoverFormProps {
  onSubmit: (id: string, updates: Partial<CertificationData>) => void;
  buttonText: string;
  placeholder: string;
  employees: { employee_id: number; name: string }[];
  formType: "addCertificate" | "editCertificate"; // Adjusted to allow both types
  initialData?: CertificationData; // Optional for editing
}

export const PopoverForm: React.FC<PopoverFormProps> = ({
  onSubmit,
  buttonText,
  placeholder,
  employees,
  formType,
  initialData,
}) => {
  const [name, setName] = useState(initialData?.name || "");
  const [certificate, setCertificate] = useState(
    initialData?.certificate || ""
  );
  const [number, setNumber] = useState<number | null>(
    initialData?.number || null
  );
  const [expiration, setExpiration] = useState(initialData?.expiration || "");
  const [employeeId, setEmployeeId] = useState<number | null>(
    initialData
      ? employees.find((emp) => emp.name === initialData.name)?.employee_id ||
          null
      : null
  );

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setCertificate(initialData.certificate || "");
      setNumber(initialData.number ?? null); // Handle null as expected
      setExpiration(initialData.expiration || "");
      setEmployeeId(
        employees.find((emp) => emp.name === initialData.name)?.employee_id ||
          null
      );
    }
  }, [initialData, employees]); // Also depend on employees

  const handleSubmit = () => {
    if (
      (formType === "addCertificate" &&
        employeeId &&
        certificate &&
        number &&
        expiration) ||
      (formType === "editCertificate" && initialData?.id)
    ) {
      // Only find selectedEmployee when adding a certificate
      const selectedEmployee =
        formType === "addCertificate"
          ? employees.find((emp) => emp.employee_id === employeeId)
          : null;

      const updates: Partial<CertificationData> = {
        // Use selectedEmployee's name when adding, otherwise keep the initial name during editing
        name:
          formType === "addCertificate"
            ? selectedEmployee?.name || ""
            : initialData?.name || "",
        certificate,
        number: number ?? undefined, // Convert null to undefined
        expiration,
        status:
          formType === "addCertificate" ? "active" : initialData?.status || "",
      };

      if (formType === "addCertificate") {
        onSubmit("", updates); // For adding a certificate, id will be generated on the backend
        toast.success(`Added a new certificate for ${selectedEmployee?.name}!`);
      } else if (formType === "editCertificate" && initialData?.id) {
        onSubmit(initialData.id, updates); // For editing, pass the existing ID
        toast.success(`Updated certificate for ${initialData.name}!`);
      }
    }
    resetForm();
  };

  const resetForm = () => {
    setName("");
    setCertificate("");
    setNumber(null);
    setExpiration("");
    setEmployeeId(null);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost">{buttonText}</Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="p-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {placeholder}
          </label>
          {formType === "addCertificate" && (
            <div>
              <Label>Employee</Label>
              <Select
                onValueChange={(value) => setEmployeeId(Number(value))}
                value={employeeId?.toString() || ""}
              >
                <SelectTrigger>
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
          )}
          <div className="mt-2">
            <Label>Certificate</Label>
            <Input
              value={certificate}
              onChange={(e) => setCertificate(e.target.value)}
              placeholder="Certificate Name"
            />
          </div>
          <div className="mt-2">
            <Label>Number</Label>
            <Input
              type="number"
              value={number || ""}
              onChange={(e) => setNumber(Number(e.target.value))}
              placeholder="Certificate Number"
            />
          </div>
          <div className="mt-2">
            <Label>Expiration Date</Label>
            <Input
              type="date"
              value={expiration}
              onChange={(e) => setExpiration(e.target.value)}
            />
          </div>
          <Button variant="gooeyLeft" className="mt-2" onClick={handleSubmit}>
            Submit
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
