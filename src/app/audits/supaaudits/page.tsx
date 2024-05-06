// pages/NewAudits.tsx the test page for DROSAudits
"use client"
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import dynamic from 'next/dynamic';
import { useEffect, useState } from "react";
import { Controller, FormProvider, useFieldArray, useForm } from 'react-hook-form';
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Select } from "@radix-ui/react-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { CalendarIcon } from "@radix-ui/react-icons";
import { DataTableFacetedFilter } from "@/components/ui/faceted-filter";
import { cn } from "@/lib/cn";
import { CustomCalendar } from "@/components/ui/calendar";
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from '@supabase/supabase-js';

const formSchema = z.object({
  drosNumber: z.string(),
  salesRep: z.string(),
  transDate: z.date(),
  auditDate: z.date().optional(),
  drosCancel: z.boolean(),
  audits: z.array(z.object({
    auditType: z.array(z.string()).min(1, "Audit type must have at least one entry."),
    errorLocation: z.array(z.string()).min(1, "Error location must have at least one entry."),
    errorDetails: z.array(z.string()).min(1, "Error details must have at least one entry."),
    errorNotes: z.string().optional(),
  })),
});

type FormData = z.infer<typeof formSchema>;
type OptionType = {
  label: string;
  value: string;
};
type SheetRowData = [string, string, string, string];
type DataItem = string[]; // If `data` is an array of arrays of strings
type Data = DataItem[];
type DataRow = string[]; // or more specific type reflecting your data structure
type SheetRow = string[];
const SupportMenu = dynamic(() => import('@/components/ui/SupportMenu'), { ssr: false });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const NewAudits = () => {
  const [salesRepOptions, setSalesRepOptions] = useState<OptionType[]>([]);
  const [auditTypeOptions, setAuditTypeOptions] = useState<OptionType[]>([]);
  const [errorLocationOptions, setErrorLocationOptions] = useState<OptionType[]>([]);
  const [errorDetailsOptions, setErrorDetailsOptions] = useState<OptionType[]>([]);
  const [resetKey, setResetKey] = useState(0);

  const methods = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'all',
    defaultValues: {
      drosNumber: '',
      salesRep: '',
      transDate: new Date(),
      auditDate: new Date(),
      drosCancel: false,
      audits: [{ auditType: [], errorLocation: [], errorDetails: [], errorNotes: "" }],
    },
  });

  const { control, reset, formState: { errors } } = methods;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "audits"
  });

  useEffect(() => {
    const fetchOptions = async () => {
        const { data, error } = await supabase
            .from('Auditlists')
            .select('salesreps, audit_type, error_location, error_details');

        if (error) {
            console.error('Failed to fetch options:', error.message);
            return;
        }

        if (data) {  // Adding a check to ensure data is not null
            const salesRepSet = new Set<OptionType>();
            const auditTypeSet = new Set<OptionType>();
            const errorLocationSet = new Set<OptionType>();
            const errorDetailsSet = new Set<OptionType>();

            data.forEach(row => {
                salesRepSet.add({ value: row.salesreps, label: row.salesreps });
                auditTypeSet.add({ value: row.audit_type, label: row.audit_type });
                errorLocationSet.add({ value: row.error_location, label: row.error_location });
                errorDetailsSet.add({ value: row.error_details, label: row.error_details });
            });

            setSalesRepOptions(Array.from(salesRepSet));
            setAuditTypeOptions(Array.from(auditTypeSet));
            setErrorLocationOptions(Array.from(errorLocationSet));
            setErrorDetailsOptions(Array.from(errorDetailsSet));
        } else {
            console.log("No data returned from Supabase.");
        }
    };

    fetchOptions();
}, []);


  const submitFormData = async (formData: FormData) => {
    // Construct records to insert into Supabase
    const records = formData.audits.flatMap((audit, index) => {
        const notesLines = (audit.errorNotes || '').split('\n').map(note => ({
          // omit 'audit_id', it will be auto-generated
            dros_number: formData.drosNumber,
            salesreps: formData.salesRep,
            audit_type: audit.auditType.join(', '),
            trans_date: format(formData.transDate, "yyyy-MM-dd"),
            audit_date: formData.auditDate ? format(formData.auditDate, "yyyy-MM-dd") : null,
            error_location: audit.errorLocation.join(', '),
            error_details: audit.errorDetails.join(', '),
            error_notes: note.trim(),
            dros_cancel: index === 0 && formData.drosCancel ? "Yes" : null,
        }));
        return notesLines;
    });

    // console.log("Submitting to Supabase:", JSON.stringify(records, null, 2)); //shows the full submission

    try {
        const { data, error } = await supabase
            .from('Auditsinput')
            .insert(records);

            if (error) {
              console.error("Detailed API error:", error);
              throw new Error(`Failed to append data: ${error.message || JSON.stringify(error)}`);
          }

        alert("Audit Submitted Successfully!");
        reset(); // Reset form fields after successful submission
        setResetKey((prevKey) => prevKey + 1);
    } catch (error: any) {
        console.error("Error during form submission:", error);
        alert(`An error occurred during form submission: ${error.message || 'Check server logs for more details.'}`);
    }
};
  
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();  // Prevent the default form submission behavior
    const formData = methods.getValues();  // Get the form data using react-hook-form
    await submitFormData(formData);  // Now call submitFormData with the form data
};
  
  return (
    <FormProvider {...methods}>
    <main>
      <header>
        <div className="flex flow-row items-center justify-center max w-full mb-55">
        <SupportMenu />
        </div>
      </header>
      <div className="flex flex-row item-center justify-center mx-auto w-full max-w-[2250px] mt-48">
      <form onSubmit={handleSubmit}>
      <FormField
            control={control}
            name="drosCancel"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md mb-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Cancelled DROS</FormLabel>
                  <FormDescription>
                    Only Select When DROS Was Cancelled
                  </FormDescription>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex flex-col md:flex-row md:space-x-4 mb-4">
        <FormField name="drosNumber" control={control} render={({ field }) => (
          <FormItem className="flex flex-col mb-4 w-full">
            <FormLabel>DROS | Acquisition #</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter The 'Dash'" />
            </FormControl>
            <FormDescription>Enter DROS | Acquisition | Invoice #</FormDescription>
          </FormItem>
        )} />
        <FormField
            control={control}
            name="salesRep"
            render={({ field: { onChange, value } }) => (
              <FormItem className="flex flex-col mb-4 w-full">
                <FormLabel>Sales Rep</FormLabel>
                <Select 
                key={resetKey} // resetKey changes to force re-render
                onValueChange={onChange} 
                defaultValue={value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select A Sales Rep" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {salesRepOptions.filter(option => option.value !== "").map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Who Dun Messed Up
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField control={control} name="transDate" render={({ field }) => (
            <FormItem className="flex flex-col mb-4">
              <FormLabel>Transaction Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className={cn("w-[240px] pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                    {field.value ? format(field.value, "PPP") : <span>Select A Date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CustomCalendar
                    selectedDate={field.value}
                    onDateChange={(date) => {
                      field.onChange(date);
                    }}
                    disabledDays={(date) => date > new Date() || date < new Date("1900-01-01")}
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>The Transaction (Purchase) Date</FormDescription>
            </FormItem>
          )} />

          <FormField control={control} name="auditDate" render={({ field }) => (
            <FormItem className="flex flex-col mb-4">
              <FormLabel>Audit Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className={cn("w-[240px] pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                    {field.value ? format(field.value, "PPP") : <span>Select Date Of Audit</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CustomCalendar
                    selectedDate={field.value}
                    onDateChange={(date) => {
                      field.onChange(date);
                    }}
                    disabledDays={(date) => date > new Date() || date < new Date("1900-01-01")}
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>Only Select If Different From Today</FormDescription>
            </FormItem>
          )} />
          </div>

        {fields.map((field, index) => (
          <div key={field.id}>
            <div className="flex flex-row md:flex-row md:space-x-4 mb-4">
            <Controller name={`audits.${index}.auditType`} control={control} render={({ field: { onChange, value } }) => (
              <DataTableFacetedFilter
              options={auditTypeOptions}
              title="Audit Type"
              selectedValues={Array.isArray(value) ? value : [...value]}
              onSelectionChange={onChange}
                />
            )} />
            <Controller name={`audits.${index}.errorLocation`} control={control} render={({ field: { onChange, value } }) => (
              <DataTableFacetedFilter
              options={errorLocationOptions}
              title="Error Location"
              selectedValues={Array.isArray(value) ? value : [...value]}
              onSelectionChange={onChange}
                />
            )} />
            <Controller name={`audits.${index}.errorDetails`} control={control} render={({ field: { onChange, value } }) => (
              <DataTableFacetedFilter
              options={errorDetailsOptions}
              title="Error Details"
              selectedValues={Array.isArray(value) ? value : [...value]}
              onSelectionChange={onChange} 
                />
            )} />
            </div>
            <FormField name={`audits.${index}.errorNotes`} control={control} render={({ field }) => {
                // console.log(`Error Notes for audit ${index}:`, field.value); // Ensure this logs correct values
                return (
                    <Textarea
                        {...field}
                        placeholder="Error Notes"
                        onChange={e => {
                            field.onChange(e); // Ensure the change handler is correctly invoked
                            // console.log(`Updated Error Notes for audit ${index}:`, e.target.value);
                        }}
                    />
                );
            }} />

        <div className="flex justify-between mb-4 mt-4">
            <Button onClick={() => remove(index)}>Remove</Button>
            </div>
          </div>
        ))}
        <div className="flex justify-between mb-4 mt-4">
        <Button type="button" 
          onClick={() => append({
          auditType: [],
          errorLocation: [],
          errorDetails: [],
          errorNotes: ''
        })}>
          Add Another Audit
        </Button>
        <Button type="submit">Submit</Button>
        </div>
      </form>
      </div>
    </main>
    </FormProvider>
  );
};

export default NewAudits;