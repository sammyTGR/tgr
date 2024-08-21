"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
} from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { CalendarIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { CustomCalendar } from "@/components/ui/calendar";
import { supabase } from "@/utils/supabase/client";
import { RenderDropdown, OptionType } from "./RenderDropdown";
import { PopoverForm } from "./PopoverForm";

const formSchema = z.object({
  drosNumber: z.string().min(1, "DROS Number is required"),
  salesRep: z.string().min(1, "Sales Rep is required"),
  transDate: z.date(),
  auditDate: z.date(),
  drosCancel: z.boolean(),
  audits: z.array(
    z.object({
      auditType: z.string().min(1, "Audit Type is required"),
      errorLocation: z.string().min(1, "Error Location is required"),
      errorDetails: z.string().min(1, "Error Details are required"),
      errorNotes: z.string().optional(),
    })
  ),
});

type FormData = z.infer<typeof formSchema>;

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
}

interface EditAuditFormProps {
  audit: AuditData;
  onClose: () => void;
}

export function EditAuditForm({ audit, onClose }: EditAuditFormProps) {
  const [salesRepOptions, setSalesRepOptions] = useState<OptionType[]>([]);
  const [auditTypeOptions, setAuditTypeOptions] = useState<OptionType[]>([]);
  const [errorLocationOptions, setErrorLocationOptions] = useState<
    OptionType[]
  >([]);
  const [errorDetailsOptions, setErrorDetailsOptions] = useState<OptionType[]>(
    []
  );

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    const { data, error } = await supabase.from("Auditsinput").select("*");
    if (error) {
      console.error("Error fetching options:", error);
      return;
    }
    updateOptions(data);
  };

  const updateOptions = (data: AuditData[]) => {
    const salesRepSet = new Set<string>();
    const auditTypeSet = new Set<string>();
    const errorLocationSet = new Set<string>();
    const errorDetailsSet = new Set<string>();

    data.forEach((row) => {
      if (row.sales_rep) salesRepSet.add(row.sales_rep);
      if (row.audit_type) auditTypeSet.add(row.audit_type);
      if (row.error_location) errorLocationSet.add(row.error_location);
      if (row.error_details) errorDetailsSet.add(row.error_details);
    });

    setSalesRepOptions(
      Array.from(salesRepSet).map((value) => ({ value, label: value }))
    );
    setAuditTypeOptions(
      Array.from(auditTypeSet).map((value) => ({ value, label: value }))
    );
    setErrorLocationOptions(
      Array.from(errorLocationSet).map((value) => ({ value, label: value }))
    );
    setErrorDetailsOptions(
      Array.from(errorDetailsSet).map((value) => ({ value, label: value }))
    );
  };
  const methods = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      drosNumber: audit.dros_number,
      salesRep: audit.sales_rep,
      transDate: new Date(audit.trans_date),
      auditDate: new Date(audit.audit_date),
      drosCancel: audit.dros_cancel,
      audits: [
        {
          auditType: audit.audit_type,
          errorLocation: audit.error_location,
          errorDetails: audit.error_details,
          errorNotes: audit.error_notes || "",
        },
      ],
    },
  });

  const { control, handleSubmit } = methods;
  const onSubmit = async (formData: FormData) => {
    try {
      const { error } = await supabase
        .from("Auditsinput")
        .update({
          dros_number: formData.drosNumber,
          sales_rep: formData.salesRep,
          trans_date: formData.transDate.toISOString(),
          audit_date: formData.auditDate.toISOString(),
          dros_cancel: formData.drosCancel,
          audit_type: formData.audits[0].auditType,
          error_location: formData.audits[0].errorLocation,
          error_details: formData.audits[0].errorDetails,
          error_notes: formData.audits[0].errorNotes,
        })
        .eq("id", audit.id);

      if (error) throw error;
      onClose();
    } catch (error) {
      console.error("Error updating audit:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField
        control={control}
        name="drosNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>DROS Number</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {/* Add similar FormField components for other fields */}
      <Button type="submit">Update Audit</Button>
    </form>
  );
}

export default EditAuditForm;
