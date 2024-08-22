"use client";

import { useEffect, useState } from "react";
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
import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { supabase } from "@/utils/supabase/client";
import { Task } from '../review/data-schema';

interface PopoverFormProps {
  onSubmit: (formData: SubmitFormData) => void;
  audit?: Task;
  placeholder?: string;
}

interface FormData {
  audits_id: string | null;
  drosNumber: string;
  salesRep: string;
  transDate: Date;
  auditDate: Date;
  drosCancel: boolean;
  auditType: string;
  errorLocation: string;
  errorDetails: string;
  errorNotes: string;
}

export type SubmitFormData = Omit<FormData, 'transDate' | 'auditDate' | 'drosCancel'> & {
  transDate: string;
  auditDate: string;
  drosCancel: string;
};

type OptionType = {
  label: string;
  value: string;
};

export const PopoverForm: React.FC<PopoverFormProps> = ({
  onSubmit,
  audit,
  placeholder,
}) => {
  const [formData, setFormData] = useState<FormData>(() => ({
    audits_id: audit?.audits_id || audit?.id || null,
    drosNumber: audit?.dros_number || "",
    salesRep: audit?.salesreps || "",
    transDate: audit?.trans_date ? new Date(audit.trans_date) : new Date(),
    auditDate: audit?.audit_date ? new Date(audit.audit_date) : new Date(),
    drosCancel: audit?.dros_cancel === "Yes",
    auditType: audit?.audit_type || "",
    errorLocation: audit?.error_location || "",
    errorDetails: audit?.error_details || "",
    errorNotes: audit?.error_notes || "",
  }));

  const [salesRepOptions, setSalesRepOptions] = useState<OptionType[]>([]);
  const [auditTypeOptions, setAuditTypeOptions] = useState<OptionType[]>([]);
  const [errorLocationOptions, setErrorLocationOptions] = useState<OptionType[]>([]);
  const [errorDetailsOptions, setErrorDetailsOptions] = useState<OptionType[]>([]);

  useEffect(() => {
    const fetchOptions = async () => {
      const { data, error } = await supabase.from("Auditlists").select("*");
      if (error) {
        console.error("Error fetching options:", error);
        toast.error("Failed to fetch dropdown options");
      } else if (data) {
        const options: {
          salesRep: Set<string>;
          auditType: Set<string>;
          errorLocation: Set<string>;
          errorDetails: Set<string>;
        } = data.reduce(
          (acc, item) => {
            if (item.salesreps) acc.salesRep.add(item.salesreps);
            if (item.audit_type) acc.auditType.add(item.audit_type);
            if (item.error_location) acc.errorLocation.add(item.error_location);
            if (item.error_details) acc.errorDetails.add(item.error_details);
            return acc;
          },
          {
            salesRep: new Set<string>(),
            auditType: new Set<string>(),
            errorLocation: new Set<string>(),
            errorDetails: new Set<string>(),
          }
        );

        setSalesRepOptions(Array.from(options.salesRep).map((item) => ({ label: item, value: item })));
        setAuditTypeOptions(Array.from(options.auditType).map((item) => ({ label: item, value: item })));
        setErrorLocationOptions(Array.from(options.errorLocation).map((item) => ({ label: item, value: item })));
        setErrorDetailsOptions(Array.from(options.errorDetails).map((item) => ({ label: item, value: item })));
      }
    };

    fetchOptions();
  }, []);

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    const submitData: SubmitFormData = {
      audits_id: formData.audits_id,
      drosNumber: formData.drosNumber,
      salesRep: formData.salesRep,
      transDate: format(formData.transDate, 'yyyy-MM-dd'),
      auditDate: format(formData.auditDate, 'yyyy-MM-dd'),
      drosCancel: formData.drosCancel ? "Yes" : "",
      auditType: formData.auditType,
      errorLocation: formData.errorLocation,
      errorDetails: formData.errorDetails,
      errorNotes: formData.errorNotes,
    };
    onSubmit(submitData);
    toast.success("Audit submitted successfully!");
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="linkHover2">{placeholder}</Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="space-y-4">
          <Label>{placeholder}</Label>
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={formData.drosCancel}
              onCheckedChange={(checked) => handleChange("drosCancel", checked)}
            />
            <Label>Cancelled DROS</Label>
          </div>

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
            <Select value={formData.salesRep} onValueChange={(value) => handleChange("salesRep", value)}>
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
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full pl-3 text-left font-normal"
                >
                  {formData.transDate ? (
                    format(formData.transDate, "M/dd/yyyy")
                  ) : (
                    <span>Pick a date</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CustomCalendar
                  selectedDate={formData.transDate}
                  onDateChange={(date) => handleChange("transDate", date)}
                  disabledDays={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                />
              </PopoverContent>
            </Popover>
          </div>
          {/* <div className="space-y-2">
            <Label>Audit Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full pl-3 text-left font-normal"
                >
                  {formData.auditDate ? (
                    format(formData.auditDate, "M/dd/yyyy")
                  ) : (
                    <span>Pick a date</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CustomCalendar
                  selectedDate={formData.auditDate}
                  onDateChange={(date) => handleChange("auditDate", date)}
                  disabledDays={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                />
              </PopoverContent>
            </Popover>
          </div> */}
          <div className="space-y-2">
            <Label>Audit Type</Label>
            <Select value={formData.auditType} onValueChange={(value) => handleChange("auditType", value)}>
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
          </div>
          <div className="space-y-2">
            <Label>Error Location</Label>
            <Select value={formData.errorLocation} onValueChange={(value) => handleChange("errorLocation", value)}>
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
          </div>
          <div className="space-y-2">
            <Label>Error Details</Label>
            <Select value={formData.errorDetails} onValueChange={(value) => handleChange("errorDetails", value)}>
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
          </div>
          <div className="space-y-2">
            <Label>Error Notes</Label>
            <Input
              value={formData.errorNotes}
              onChange={(e) => handleChange("errorNotes", e.target.value)}
              placeholder="Enter Error Notes"
            />
          </div>
          <Button onClick={handleSubmit}>Submit</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};