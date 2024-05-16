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
import { CalendarIcon, CheckIcon } from "@radix-ui/react-icons";
import { DataTableFacetedFilter } from "@/components/ui/faceted-filter";
import { cn } from "@/lib/cn";
import { CustomCalendar } from "@/components/ui/calendar";
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import supabase, {createClerkSupabaseClient} from '../../../../supabase/lib/supabaseClient';
import { Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandShortcut, CommandSeparator } from "@/components/ui/command";

type OptionType = {
  label: string;
  value: string;
};

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

interface DataRow {
  salesreps?: string;
  audit_type?: string;
  error_location?: string;
  error_details?: string;
}
const SupportMenu = dynamic(() => import('@/components/ui/SupportMenu'), { ssr: false });

const SupaAudits = () => {
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

  const updateOptions = (data: DataRow[]) => {
    const salesRepSet = new Set<OptionType>();
    const auditTypeSet = new Set<OptionType>();
    const errorLocationSet = new Set<OptionType>();
    const errorDetailsSet = new Set<OptionType>();

    data.forEach(row => {
      if (row.salesreps) {
        salesRepSet.add({ value: row.salesreps.trim(), label: row.salesreps.trim() });
      }
      if (row.audit_type) {
        auditTypeSet.add({ value: row.audit_type.trim(), label: row.audit_type.trim() });
      }
      if (row.error_location) {
        errorLocationSet.add({ value: row.error_location.trim(), label: row.error_location.trim() });
      }
      if (row.error_details) {
        errorDetailsSet.add({ value: row.error_details.trim(), label: row.error_details.trim() });
      }
    });

    setSalesRepOptions(Array.from(salesRepSet));
    setAuditTypeOptions(Array.from(auditTypeSet));
    setErrorLocationOptions(Array.from(errorLocationSet));
    setErrorDetailsOptions(Array.from(errorDetailsSet));
  };
  useEffect(() => {
    const fetchOptions = async () => {
      const { data, error } = await supabase.from('Auditlists').select('*');
      if (error) {
        console.error('Failed to fetch options:', error.message);
      } else if (data) {
        updateOptions(data);
      }
    };
  
    fetchOptions();
  
    const subscription = supabase
      .channel('custom-all-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Auditlists' }, payload => {
        if (payload.new) {
          updateOptions([payload.new]);
        }
      })
      .subscribe();
  
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []); 
  
  interface AuditRecord {
    dros_number: string;
    salesreps: string;
    audit_type: string;
    trans_date: string;
    audit_date: string | null;
    error_location: string;
    error_details: string;
    error_notes: string;
    dros_cancel: string | null; // Ensure this allows both string and null
  }

  const submitFormData = async (formData: FormData) => {
    let isFirstAudit = true; // Use this flag to check if we're processing the first record
  
    const records = formData.audits.flatMap((audit, index) => {
      const auditType = Array.isArray(audit.auditType) ? audit.auditType : [audit.auditType];
      const errorLocation = Array.isArray(audit.errorLocation) ? audit.errorLocation : [audit.errorLocation];
      const errorDetails = Array.isArray(audit.errorDetails) ? audit.errorDetails : [audit.errorDetails];
  
      return (audit.errorNotes || '').split('\n').map(note => {
        const record: AuditRecord = {
          dros_number: formData.drosNumber,
          salesreps: formData.salesRep,
          audit_type: auditType.join(', '),
          trans_date: format(formData.transDate, "yyyy-MM-dd"),
          audit_date: formData.auditDate ? format(formData.auditDate, "yyyy-MM-dd") : null,
          error_location: errorLocation.join(', '),
          error_details: errorDetails.join(', '),
          error_notes: note.trim(),
          dros_cancel: isFirstAudit && formData.drosCancel ? "Yes" : null
        };
  
        isFirstAudit = false; // After processing the first audit, set this to false
        return record;
      });
    });
  

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

useEffect(() => {
  const handleClick = (event: any) => {
    // console.log("Direct DOM click detected");
  };

  const elements = document.querySelectorAll('[data-command-item]');
  elements.forEach(element => element.addEventListener('click', handleClick));

  return () => {
    elements.forEach(element => element.removeEventListener('click', handleClick));
  };
}, []);

  // Replace the existing implementation of dropdowns with the new combobox pattern
  type RenderDropdownProps = {
    field: any;
    options: OptionType[];
    placeholder: string;
  };
  
  const RenderDropdown: React.FC<RenderDropdownProps> = ({ field, options, placeholder }) => {
    const [searchText, setSearchText] = useState('');
  
    // Filter options based on search text
    const filteredOptions = options.filter(option =>
      option.label.toLowerCase().includes(searchText.toLowerCase())
    );
  
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full">
            {field.value ? options.find(option => option.value === field.value)?.label || placeholder : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput 
              placeholder={`Search ${placeholder}...`}
              onInput={e => setSearchText(e.currentTarget.value)}
            />
            <CommandList>
              {filteredOptions.length > 0 ? (
                filteredOptions.map(option => (
                  <CommandItem key={option.value} onSelect={() => {
                    field.onChange(option.value);
                    setSearchText(''); // Clear search text after selection
                  }}
                  className={cn(
                    "flex items-center px-3 py-2 cursor-pointer",
                    "hover:bg-gray-800", // Darker background on hover for dark mode
                    field.value === option.value ? "font-semibold text-white" : "text-gray-400"
                  )}
                  >
                    {option.label}
                    <CheckIcon className={cn("mr-auto", field.value === option.value ? "opacity-100" : "opacity-0")} />
                  </CommandItem>
                ))
              ) : (
                <CommandEmpty>No results found.</CommandEmpty>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
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
        {/* Dropdown For Sales Reps */}
        <FormField
            control={control}
            name="salesRep"
            render={({ field }) => (
              <FormItem className="flex flex-col mb-4 w-full">
                <FormLabel>Sales Rep</FormLabel>
                <RenderDropdown 
                  field={field} 
                  options={salesRepOptions} 
                  placeholder="Select A Sales Rep"
                />
                <FormDescription>Who Dun Messed Up</FormDescription>
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

          {/* Dropdown For Audit Type, Error Location and Error Details */}
          {fields.map((field, index) => (
            <div key={field.id}>
              <div className="flex flex-row md:flex-row md:space-x-4 mb-4">
                <Controller
                  name={`audits.${index}.auditType`}
                  control={control}
                  render={({ field }) => (
                    <FormItem className="flex flex-col mb-4 w-full">
                      <FormLabel>Audit Type</FormLabel>
                      <RenderDropdown 
                          field={field} 
                          options={auditTypeOptions} 
                          placeholder="Select Audit Type"
                        />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Controller
                  name={`audits.${index}.errorLocation`}
                  control={control}
                  render={({ field }) => (
                    <FormItem className="flex flex-col mb-4 w-full">
                      <FormLabel>Error Location</FormLabel>
                      <RenderDropdown 
                          field={field} 
                          options={errorLocationOptions} 
                          placeholder="Where Was The Error"
                        />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Controller
                  name={`audits.${index}.errorDetails`}
                  control={control}
                  render={({ field }) => (
                    <FormItem className="flex flex-col mb-4 w-full">
                      <FormLabel>Error Details</FormLabel>
                      <RenderDropdown 
                          field={field} 
                          options={errorDetailsOptions} 
                          placeholder="Select The Details"
                        />
                      <FormMessage />
                    </FormItem>
                  )}
                />
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

export default SupaAudits;