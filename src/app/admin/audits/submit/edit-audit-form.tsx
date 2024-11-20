"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
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
import { useMemo } from "react";

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

export interface AuditData {
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
  salesreps?: string;
}

interface EditAuditFormProps {
  audit: AuditData;
  onClose: () => void;
}

// Query keys
const AUDIT_OPTIONS_KEY = ['audit-options'] as const;
const EMPLOYEES_KEY = ['employees'] as const;




export function EditAuditForm({ audit, onClose }: EditAuditFormProps) {
  const queryClient = useQueryClient();

  // Update mutation
  const updateAuditMutation = useMutation({
    mutationFn: async (formData: FormData) => {
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
    },
    onSuccess: () => {
      toast.success("Audit updated successfully");
      queryClient.invalidateQueries({ queryKey: ['audits'] }); // Invalidate audits list
      onClose();
    },
    onError: (error) => {
      toast.error(`Error updating audit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  const { data: options } = useQuery({
    queryKey: AUDIT_OPTIONS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from("Auditsinput").select("*");
      if (error) throw error;
      
      const auditTypeSet = new Set<string>();
      const errorLocationSet = new Set<string>();
      const errorDetailsSet = new Set<string>();

      // Add the existing audit values to ensure they're in the options
      if (audit.audit_type) auditTypeSet.add(audit.audit_type);
      if (audit.error_location) errorLocationSet.add(audit.error_location);
      if (audit.error_details) errorDetailsSet.add(audit.error_details);

      data.forEach((row: AuditData) => {
        if (row.audit_type) auditTypeSet.add(row.audit_type);
        if (row.error_location) errorLocationSet.add(row.error_location);
        if (row.error_details) errorDetailsSet.add(row.error_details);
      });

      return {
        auditTypeOptions: Array.from(auditTypeSet)
          .filter(Boolean)
          .map((value) => ({ value, label: value })),
        errorLocationOptions: Array.from(errorLocationSet)
          .filter(Boolean)
          .map((value) => ({ value, label: value })),
        errorDetailsOptions: Array.from(errorDetailsSet)
          .filter(Boolean)
          .map((value) => ({ value, label: value })),
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  const methods = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      drosNumber: audit.dros_number,
      salesRep: audit.salesreps || audit.sales_rep, // Handle both possible field names
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

    // Fetch employees
    const { data: employees } = useQuery({
      queryKey: EMPLOYEES_KEY,
      queryFn: async () => {
        const { data, error } = await supabase
          .from("employees")
          .select("*")
          .order("lanid", { ascending: true });
  
        if (error) throw error;
        return data || [];
      },
    });
  
    // Convert employees to options format
    const salesRepOptions = useMemo(() => 
      employees?.map(emp => ({
        value: emp.lanid || '',
        label: emp.lanid || '' // Ensure we always have a string
      })).filter(option => option.value && option.label) ?? [], // Filter out any empty values
      [employees]
    );

  const { control } = methods;

  const onSubmit = (formData: FormData) => {
    updateAuditMutation.mutate(formData);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
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

<FormField
          control={control}
          name="salesRep"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sales Rep</FormLabel>
              <FormControl>
                <RenderDropdown
                  field={field}
                  options={salesRepOptions}
                  placeholder="Select Sales Rep"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="transDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Transaction Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CustomCalendar
                    selectedDate={field.value}
                    onDateChange={field.onChange}
                    disabledDays={() => false}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="auditDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Audit Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                <CustomCalendar
                    selectedDate={field.value}
                    onDateChange={field.onChange}
                    disabledDays={() => false}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="drosCancel"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>DROS Cancel</FormLabel>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="audits.0.auditType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Audit Type</FormLabel>
              <FormControl>
                <RenderDropdown
                  field={field}
                  options={options?.auditTypeOptions ?? []}
                  placeholder="Select Audit Type"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="audits.0.errorLocation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Error Location</FormLabel>
              <FormControl>
                <RenderDropdown
                  field={field}
                  options={options?.errorLocationOptions ?? []}
                  placeholder="Select Error Location"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="audits.0.errorDetails"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Error Details</FormLabel>
              <FormControl>
                <RenderDropdown
                  field={field}
                  options={options?.errorDetailsOptions ?? []}
                  placeholder="Select Error Details"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="audits.0.errorNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Update Audit</Button>
        </div>
      </form>
    </FormProvider>
  );
}

export default EditAuditForm;
