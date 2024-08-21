"use client";

import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { CustomCalendar } from "@/components/ui/calendar";

interface AuditData {
  id: string;
  dros_number: string;
  sales_rep: string;
  trans_date: string;
  audit_date: string;
  dros_cancel: boolean;
  audit_type: string;
  error_location: string;
  error_details: string;
  error_notes?: string;
  label?: string;
}

interface PopoverFormProps {
  onSubmit: (formData: FormData) => void;
  buttonText: string;
  placeholder: string;
  salesRepOptions: { value: string; label: string }[];
  auditTypeOptions: { value: string; label: string }[];
  errorLocationOptions: { value: string; label: string }[];
  errorDetailsOptions: { value: string; label: string }[];
  audit?: AuditData;
}

interface FormData {
  drosNumber: string;
  salesRep: string;
  transDate: Date;
  auditDate: Date;
  drosCancel: boolean;
  audits: Array<{
    auditType: string;
    errorLocation: string;
    errorDetails: string;
    errorNotes: string;
  }>;
}

export const PopoverForm: React.FC<PopoverFormProps> = ({
  onSubmit,
  buttonText,
  placeholder,
  salesRepOptions,
  auditTypeOptions,
  errorLocationOptions,
  errorDetailsOptions,
  audit,
}) => {
  const [formData, setFormData] = useState<FormData>(() => {
    if (audit) {
      return {
        drosNumber: audit.dros_number || "",
        salesRep: audit.sales_rep || "",
        transDate: new Date(audit.trans_date),
        auditDate: new Date(audit.audit_date),
        drosCancel: audit.dros_cancel || false,
        audits: [
          {
            auditType: audit.audit_type || "",
            errorLocation: audit.error_location || "",
            errorDetails: audit.error_details || "",
            errorNotes: audit.error_notes || "",
          },
        ],
      };
    }
    return {
      drosNumber: "",
      salesRep: "",
      transDate: new Date(),
      auditDate: new Date(),
      drosCancel: false,
      audits: [
        { auditType: "", errorLocation: "", errorDetails: "", errorNotes: "" },
      ],
    };
  });

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData((prev: FormData) => ({ ...prev, [field]: value }));
  };

  const handleAuditChange = (
    index: number,
    field: keyof FormData["audits"][0],
    value: any
  ) => {
    const newAudits = [...formData.audits];
    newAudits[index] = { ...newAudits[index], [field]: value };
    setFormData((prev: FormData) => ({ ...prev, audits: newAudits }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
    toast.success("Audit submitted successfully!");
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="linkHover2">{buttonText}</Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="space-y-4">
          <Label>{placeholder}</Label>
          <div className="space-y-2">
            <Label>DROS Number</Label>
            <Input
              value={formData.drosNumber}
              onChange={(e) => handleChange("drosNumber", e.target.value)}
              placeholder="Enter DROS Number"
            />
          </div>
          <div className="space-y-2">
            <Label>Sales Rep</Label>
            <Select onValueChange={(value) => handleChange("salesRep", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Sales Rep" />
              </SelectTrigger>
              <SelectContent>
                {salesRepOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Transaction Date</Label>
            <CustomCalendar
              selectedDate={formData.transDate}
              onDateChange={(date) => handleChange("transDate", date)}
              disabledDays={(date) =>
                date > new Date() || date < new Date("1900-01-01")
              }
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={formData.drosCancel}
              onCheckedChange={(checked) => handleChange("drosCancel", checked)}
            />
            <Label>Cancelled DROS</Label>
          </div>
          {formData.audits.map((audit, index) => (
            <div key={index} className="space-y-2">
              <Label>Audit Type</Label>
              <Select
                onValueChange={(value) =>
                  handleAuditChange(index, "auditType", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Audit Type" />
                </SelectTrigger>
                <SelectContent>
                  {auditTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label>Error Location</Label>
              <Select
                onValueChange={(value) =>
                  handleAuditChange(index, "errorLocation", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Error Location" />
                </SelectTrigger>
                <SelectContent>
                  {errorLocationOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label>Error Details</Label>
              <Select
                onValueChange={(value) =>
                  handleAuditChange(index, "errorDetails", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Error Details" />
                </SelectTrigger>
                <SelectContent>
                  {errorDetailsOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label>Error Notes</Label>
              <Input
                value={audit.errorNotes}
                onChange={(e) =>
                  handleAuditChange(index, "errorNotes", e.target.value)
                }
                placeholder="Enter Error Notes"
              />
            </div>
          ))}
          <Button onClick={handleSubmit}>Submit</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
