"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
} from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Select } from "@radix-ui/react-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { CalendarIcon, CheckIcon } from "@radix-ui/react-icons";
import { DataTableFacetedFilter } from "@/components/ui/faceted-filter";
import { cn } from "@/lib/cn";
import { CustomCalendarAudit } from "@/components/ui/calendar";
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "../../../../utils/supabase/client";
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "@/components/ui/command";
import { toast } from "sonner"; // Import toast from Sonner
import { useRouter } from "next/navigation"; // Use the router for redirects
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import { Calendar } from "@/components/ui/calendar";
import { ChevronDown } from "lucide-react";
type OptionType = {
  label: string;
  value: string;
};

const formSchema = z.object({
  drosNumber: z.string().nonempty("Gotsta Put A Numba"),
  salesRep: z.string().nonempty("Sales Rep is required"),
  transDate: z.date(),
  auditDate: z.date(),
  drosCancel: z.boolean(),
  audits: z.array(
    z.object({
      auditType: z.string().nonempty("Audit type is required."),
      errorLocation: z.string().nonempty("Error location is required."),
      errorDetails: z.string().nonempty("Error details are required."),
      errorNotes: z.string().optional(),
    })
  ),
});

type FormData = z.infer<typeof formSchema>;

interface DataRow {
  salesreps?: string;
  audit_type?: string;
  error_location?: string;
  error_details?: string;
}

interface SubmitAuditsProps {
  onAuditSubmitted?: () => void;
}

const SupportMenu = dynamic(() => import("@/components/ui/SupportNavMenu"), {
  ssr: false,
});

export default function SubmitAudits({ onAuditSubmitted }: SubmitAuditsProps) {
  const [salesRepOptions, setSalesRepOptions] = useState<OptionType[]>([]);
  const [auditTypeOptions, setAuditTypeOptions] = useState<OptionType[]>([]);
  const [errorLocationOptions, setErrorLocationOptions] = useState<
    OptionType[]
  >([]);
  const [errorDetailsOptions, setErrorDetailsOptions] = useState<OptionType[]>(
    []
  );
  const [resetKey, setResetKey] = useState(0);

  const methods = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "all",
    defaultValues: {
      drosNumber: "",
      salesRep: "",
      transDate: new Date(),
      auditDate: new Date(),
      drosCancel: false,
      audits: [
        { auditType: "", errorLocation: "", errorDetails: "", errorNotes: "" },
      ],
    },
  });

  const {
    control,
    reset,
    formState: { errors },
  } = methods;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "audits",
  });

  const updateOptions = (newData: DataRow[]) => {
    setSalesRepOptions((prevOptions) => {
      // Create a map of existing options by value to prevent duplicates
      const optionsMap = new Map(prevOptions.map((opt) => [opt.value, opt]));

      // Add new options, overwriting any existing ones with the same value
      newData
        .filter((row) => row.salesreps)
        .forEach((row) => {
          const value = row.salesreps!.trim();
          optionsMap.set(value, { value, label: value });
        });

      // Convert map back to array
      return Array.from(optionsMap.values());
    });

    setAuditTypeOptions((prevOptions) => {
      const optionsMap = new Map(prevOptions.map((opt) => [opt.value, opt]));

      newData
        .filter((row) => row.audit_type)
        .forEach((row) => {
          const value = row.audit_type!.trim();
          optionsMap.set(value, { value, label: value });
        });

      return Array.from(optionsMap.values());
    });

    setErrorLocationOptions((prevOptions) => {
      const optionsMap = new Map(prevOptions.map((opt) => [opt.value, opt]));

      newData
        .filter((row) => row.error_location)
        .forEach((row) => {
          const value = row.error_location!.trim();
          optionsMap.set(value, { value, label: value });
        });

      return Array.from(optionsMap.values());
    });

    setErrorDetailsOptions((prevOptions) => {
      const optionsMap = new Map(prevOptions.map((opt) => [opt.value, opt]));

      newData
        .filter((row) => row.error_details)
        .forEach((row) => {
          const value = row.error_details!.trim();
          optionsMap.set(value, { value, label: value });
        });

      return Array.from(optionsMap.values());
    });
  };
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const { data, error } = await supabase.from("Auditlists").select("*");

        if (error) {
          console.error("Failed to fetch options:", error.message);
          toast.error("Failed to load dropdown options");
          return;
        }

        if (data && data.length > 0) {
          // console.log("Fetched options:", data.length);
          updateOptions(data);
        } else {
          console.warn("No data found in Auditlists table");
        }
      } catch (err) {
        console.error("Error in fetchOptions:", err);
        toast.error("An error occurred while loading options");
      }
    };

    // Initial fetch
    fetchOptions();

    // Set up realtime subscription
    const channel = supabase
      .channel("custom-all-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Auditlists" },
        (payload) => {
          // console.log("Received realtime update:", payload);
          if (payload.new) {
            // Merge new data with existing options
            updateOptions([payload.new as DataRow]);
          }
        }
      )
      .subscribe((status) => {
        // console.log("Subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
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
    let isFirstAudit = true;

    const records = formData.audits.flatMap((audit, index) => {
      const auditType = Array.isArray(audit.auditType)
        ? audit.auditType
        : [audit.auditType];
      const errorLocation = Array.isArray(audit.errorLocation)
        ? audit.errorLocation
        : [audit.errorLocation];
      const errorDetails = Array.isArray(audit.errorDetails)
        ? audit.errorDetails
        : [audit.errorDetails];

      // Create dates in local time
      const now = new Date();
      const auditDate = now;

      // Format dates in ISO format for PostgreSQL
      const transDateStr = format(formData.transDate, "yyyy-MM-dd");
      const auditDateStr = format(now, "yyyy-MM-dd");

      return (audit.errorNotes || "").split("\n").map((note) => {
        const record: AuditRecord = {
          dros_number: formData.drosNumber,
          salesreps: formData.salesRep,
          audit_type: auditType.join(", "),
          trans_date: transDateStr,
          audit_date: auditDateStr,
          error_location: errorLocation.join(", "),
          error_details: errorDetails.join(", "),
          error_notes: note.trim(),
          dros_cancel: isFirstAudit && formData.drosCancel ? "Yes" : "",
        };

        isFirstAudit = false;
        return record;
      });
    });

    try {
      const { data, error } = await supabase
        .from("Auditsinput")
        .insert(records);

      if (error) {
        throw new Error(
          `Failed to append data: ${error.message || JSON.stringify(error)}`
        );
      }

      toast.success("Audit Submitted Successfully!");
      reset();
      setResetKey((prevKey) => prevKey + 1);
      if (onAuditSubmitted) {
        onAuditSubmitted();
      }
    } catch (error: any) {
      toast.error(
        `An error occurred during form submission: ${
          error.message || "Check server logs for more details."
        }`
      );
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent the default form submission behavior
    const isValid = await methods.trigger(); // Validate the form
    if (!isValid) {
      toast.error("Please correct the errors in the form before submitting.");
      return;
    }
    const formData = methods.getValues(); // Get the form data using react-hook-form
    await submitFormData(formData); // Now call submitFormData with the form data
  };

  useEffect(() => {
    const handleClick = (event: any) => {
      // console.log("Direct DOM click detected");
    };

    const elements = document.querySelectorAll("[data-command-item]");
    elements.forEach((element) =>
      element.addEventListener("click", handleClick)
    );

    return () => {
      elements.forEach((element) =>
        element.removeEventListener("click", handleClick)
      );
    };
  }, []);

  // Replace the existing implementation of dropdowns with the new combobox pattern
  type RenderDropdownProps = {
    field: any;
    options: OptionType[];
    placeholder: string;
  };

  const RenderDropdown: React.FC<RenderDropdownProps> = ({
    field,
    options,
    placeholder,
  }) => {
    const [searchText, setSearchText] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    // Filter options based on search text
    const filteredOptions = options.filter((option) =>
      option.label.toLowerCase().includes(searchText.toLowerCase())
    );

    // Sort options alphabetically to maintain consistent order
    const sortedOptions = [...filteredOptions].sort((a, b) =>
      a.label.localeCompare(b.label)
    );

    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            {field.value
              ? options.find((option) => option.value === field.value)?.label ||
                placeholder
              : placeholder}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput
              placeholder={`Search ${placeholder}...`}
              value={searchText}
              onValueChange={setSearchText}
            />
            <CommandList>
              {sortedOptions.length > 0 ? (
                sortedOptions.map((option) => (
                  <CommandItem
                    key={`${option.value}-${option.label}`}
                    onSelect={() => {
                      field.onChange(option.value);
                      setSearchText("");
                      setIsOpen(false);
                    }}
                    className={cn(
                      "flex items-center px-3 py-2 cursor-pointer",
                      "hover:bg-gray-800",
                      field.value === option.value
                        ? "font-semibold text-white"
                        : "text-gray-400"
                    )}
                  >
                    {option.label}
                    {field.value === option.value && (
                      <CheckIcon className="ml-auto h-4 w-4" />
                    )}
                  </CommandItem>
                ))
              ) : (
                <CommandEmpty>
                  {searchText ? "No results found." : "No options available."}
                </CommandEmpty>
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
        <div className="flex flex-col items-center justify-center mx-auto w-full max-w-6xl">
          <form onSubmit={handleSubmit}>
            <div className="grid p-2 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader>
                  <CardTitle>DROS Cancellation</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={control}
                    name="drosCancel"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md">
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>DROS | Invoice Number</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    name="drosNumber"
                    control={control}
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>DROS | Invoice | FSC</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter The 'Dash'" />
                        </FormControl>
                        <FormDescription>
                          This Can Be For Any Form
                        </FormDescription>
                        <FormMessage>{errors.drosNumber?.message}</FormMessage>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sales Rep</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={control}
                    name="salesRep"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Select The Sales Rep</FormLabel>
                        <RenderDropdown
                          field={field}
                          options={salesRepOptions}
                          placeholder="Select A Sales Rep"
                        />
                        <FormDescription>Who Dun Messed Up</FormDescription>
                        <FormMessage>{errors.salesRep?.message}</FormMessage>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Transaction Date</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={control}
                    name="transDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Transaction Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Select A Date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() ||
                                date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          The Transaction (Purchase) Date
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* <Card>
                <CardHeader>
                  <CardTitle>Audit Date</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={control}
                    name="auditDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Audit Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Select A Date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CustomCalendarAudit
                              selectedDate={field.value}
                              onDateChange={(date) => {
                                field.onChange(date);
                              }}
                              disabledDays={(date) =>
                                date > new Date() ||
                                date < new Date("1900-01-01")
                              }
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          Date The Audit Was Performed
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card> */}
            </div>

            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid p-2 gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Transaction Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Controller
                      name={`audits.${index}.auditType`}
                      control={control}
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Select The Type Of Transaction</FormLabel>
                          <RenderDropdown
                            field={field}
                            options={auditTypeOptions}
                            placeholder="Select Transaction Type"
                          />
                          <FormMessage>
                            {errors.audits?.[index]?.auditType?.message}
                          </FormMessage>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Audit Location</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Controller
                      name={`audits.${index}.errorLocation`}
                      control={control}
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Where Was The Error</FormLabel>
                          <RenderDropdown
                            field={field}
                            options={errorLocationOptions}
                            placeholder="Where Was The Error"
                          />
                          <FormMessage>
                            {errors.audits?.[index]?.errorLocation?.message}
                          </FormMessage>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Audit Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Controller
                      name={`audits.${index}.errorDetails`}
                      control={control}
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Category Of The Error</FormLabel>
                          <RenderDropdown
                            field={field}
                            options={errorDetailsOptions}
                            placeholder="Select The Category"
                          />
                          <FormMessage>
                            {errors.audits?.[index]?.errorDetails?.message}
                          </FormMessage>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card className="md:col-span-2 lg:col-span-3">
                  <CardHeader>
                    <CardTitle>Auditing Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      name={`audits.${index}.errorNotes`}
                      control={control}
                      render={({ field }) => (
                        <Textarea
                          {...field}
                          placeholder="Details On What Was Audited"
                        />
                      )}
                    />
                  </CardContent>
                </Card>

                <div className="md:col-span-2 lg:col-span-3 flex justify-end">
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() =>
                        append({
                          auditType: "",
                          errorLocation: "",
                          errorDetails: "",
                          errorNotes: "",
                        })
                      }
                    >
                      Add Another Audit
                    </Button>
                    <Button variant="destructive" onClick={() => remove(index)}>
                      Remove Audit
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {/* Single Submit button outside the map */}
            <div className="flex justify-start mt-6">
              <Button variant="gooeyLeft" type="submit">
                Submit Audit
              </Button>
            </div>
          </form>
        </div>
      </main>
    </FormProvider>
  );
}
