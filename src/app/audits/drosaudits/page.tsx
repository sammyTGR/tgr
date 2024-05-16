// pages/DROSAudits.tsx the new page for DROSAudits
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
import {createClerkSupabaseClient} from '../../../../supabase/lib/supabaseClient';

const formSchema = z.object({
  drosNumber: z.string(),
  salesRep: z.string(),
  transDate: z.date(),
  auditDate: z.date().optional(),
  drosCancel: z.boolean(),
  audits: z.array(z.object({
    auditType: z.array(z.string()),  // Assuming this is an array
    errorLocation: z.array(z.string()),
    errorDetails: z.array(z.string()),
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

const supabase = createClerkSupabaseClient();

const DROSAudits = () => {
  const [salesRepOptions, setSalesRepOptions] = useState<OptionType[]>([]);  // Use an empty array as initial state
  const [auditTypeOptions, setAuditTypeOptions] = useState<OptionType[]>([]);
  const [errorLocationOptions, setErrorLocationOptions] = useState<OptionType[]>([]);
  const [errorDetailsOptions, setErrorDetailsOptions] = useState<OptionType[]>([]);
  const [resetKey, setResetKey] = useState(0);
  const methods = useForm<FormData>({
    resolver: zodResolver(formSchema),
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
      const response = await fetch('/api/sheetOps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'read',
          sheetName: 'AUDITS',
          range: 'Lists!B2:E',
        }),
      });
      if (!response.ok) {
        console.error('Failed to fetch options:', await response.text());
        return;
      }
      const jsonData = await response.json();
      
      if (jsonData.success && Array.isArray(jsonData.data)) {
        const data = jsonData.data as SheetRowData[]; 
  
        const fetchedSalesRepOptions = data.map((row: SheetRowData) => ({
          value: row[0],
          label: row[0],
        }));
        const fetchedAuditTypeOptions = data.map((row: SheetRowData) => ({
          value: row[1],
          label: row[1],
        }));
        const fetchedErrorLocationOptions = data.map((row: SheetRowData) => ({
          value: row[2],
          label: row[2],
        }));
        const fetchedErrorDetailsOptions = data.map((row: SheetRowData) => ({
          value: row[3],
          label: row[3],
        }));

        setSalesRepOptions(fetchedSalesRepOptions);
        setAuditTypeOptions(fetchedAuditTypeOptions);
        setErrorLocationOptions(fetchedErrorLocationOptions);
        setErrorDetailsOptions(fetchedErrorDetailsOptions);
      }
    };
    fetchOptions();
  }, []);  // Empty array ensures the effect is only run on mount

  const submitFormData = async (formData: FormData) => {
    // Explicitly type the values array as an array of arrays of string or string representations.
    const values: (string | number)[][] = [];

    // Iterate through each audit entry
    formData.audits.forEach((audit, index) => {
        // Handle undefined errorNotes by providing a default empty string
        const notesLines = (audit.errorNotes || '').split('\n');

        // Create a row for each line in errorNotes
        notesLines.forEach(note => {
            values.push([
                formData.drosNumber,                          // Col A: DROS Number
                formData.salesRep,                            // Col B: Sales Rep
                audit.auditType.join(', '),                   // Col C: Audit Type
                format(formData.transDate, "yyyy-MM-dd"),     // Col D: Transaction Date
                formData.auditDate ? format(formData.auditDate, "yyyy-MM-dd") : "", // Col E: Audit Date
                audit.errorLocation.join(', '),               // Col F: Error Location
                audit.errorDetails.join(', '),                // Col G: Error Details
                note.trim(),  // Col H: Error Notes
                index === 0 && formData.drosCancel ? "Yes" : "" // Col I: DROS Cancel (only on the first row if applicable)
            ]);
        });
    });

    console.log("Sending to Google Sheets:", JSON.stringify(values, null, 2));

    try {
        const response = await fetch('/api/sheetOps', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                operation: 'append',
                sheetName: 'AUDITS',
                range: 'Audits!A:I',
                values: values
            }),
        });

        const result = await response.json();
        if (!response.ok) {
            const errorDetails = result.message || result.error || JSON.stringify(result);
            console.error("Detailed API error:", errorDetails);
            throw new Error(`Failed to append data: ${errorDetails}`);
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
                console.log(`Error Notes for audit ${index}:`, field.value); // Ensure this logs correct values
                return (
                    <Textarea
                        {...field}
                        placeholder="Error Notes"
                        onChange={e => {
                            field.onChange(e); // Ensure the change handler is correctly invoked
                            console.log(`Updated Error Notes for audit ${index}:`, e.target.value);
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

export default DROSAudits;