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
import { CustomCalendar } from "@/components/ui/calendar";
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

  const updateOptions = (data: DataRow[]) => {
    const salesRepSet = new Set<OptionType>();
    const auditTypeSet = new Set<OptionType>();
    const errorLocationSet = new Set<OptionType>();
    const errorDetailsSet = new Set<OptionType>();

    data.forEach((row) => {
      if (row.salesreps) {
        salesRepSet.add({
          value: row.salesreps.trim(),
          label: row.salesreps.trim(),
        });
      }
      if (row.audit_type) {
        auditTypeSet.add({
          value: row.audit_type.trim(),
          label: row.audit_type.trim(),
        });
      }
      if (row.error_location) {
        errorLocationSet.add({
          value: row.error_location.trim(),
          label: row.error_location.trim(),
        });
      }
      if (row.error_details) {
        errorDetailsSet.add({
          value: row.error_details.trim(),
          label: row.error_details.trim(),
        });
      }
    });

    setSalesRepOptions(Array.from(salesRepSet));
    setAuditTypeOptions(Array.from(auditTypeSet));
    setErrorLocationOptions(Array.from(errorLocationSet));
    setErrorDetailsOptions(Array.from(errorDetailsSet));
  };
  useEffect(() => {
    const fetchOptions = async () => {
      const { data, error } = await supabase.from("Auditlists").select("*");
      if (error) {
        //console.("Failed to fetch options:", error.message);
      } else if (data) {
        updateOptions(data);
      }
    };

    fetchOptions();

    const subscription = supabase
      .channel("custom-all-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Auditlists" },
        (payload) => {
          if (payload.new) {
            updateOptions([payload.new]);
          }
        }
      )
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
      const auditType = Array.isArray(audit.auditType)
        ? audit.auditType
        : [audit.auditType];
      const errorLocation = Array.isArray(audit.errorLocation)
        ? audit.errorLocation
        : [audit.errorLocation];
      const errorDetails = Array.isArray(audit.errorDetails)
        ? audit.errorDetails
        : [audit.errorDetails];

      return (audit.errorNotes || "").split("\n").map((note) => {
        const record: AuditRecord = {
          dros_number: formData.drosNumber,
          salesreps: formData.salesRep,
          audit_type: auditType.join(", "),
          trans_date: format(formData.transDate, "yyyy-MM-dd"),
          audit_date: formData.auditDate
            ? format(formData.auditDate, "yyyy-MM-dd")
            : null,
          error_location: errorLocation.join(", "),
          error_details: errorDetails.join(", "),
          error_notes: note.trim(),
          dros_cancel: isFirstAudit && formData.drosCancel ? "Yes" : null,
        };

        isFirstAudit = false; // After processing the first audit, set this to false
        return record;
      });
    });
    try {
      const { data, error } = await supabase
        .from("Auditsinput")
        .insert(records);

      if (error) {
        //console.("Detailed API error:", error);
        throw new Error(
          `Failed to append data: ${error.message || JSON.stringify(error)}`
        );
      }

      toast.success("Audit Submitted Successfully!");
      reset(); // Reset form fields after successful submission
      setResetKey((prevKey) => prevKey + 1);
      if (onAuditSubmitted) {
        onAuditSubmitted();
      }
    } catch (error: any) {
      //console.("Error during form submission:", error);
      toast.success(
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

    // Filter options based on search text
    const filteredOptions = options.filter((option) =>
      option.label.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full">
            {field.value
              ? options.find((option) => option.value === field.value)?.label ||
                placeholder
              : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput
              placeholder={`Search ${placeholder}...`}
              onInput={(e) => setSearchText(e.currentTarget.value)}
            />
            <CommandList>
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      field.onChange(option.value);
                      setSearchText(""); // Clear search text after selection
                    }}
                    className={cn(
                      "flex items-center px-3 py-2 cursor-pointer",
                      "hover:bg-gray-800", // Darker background on hover for dark mode
                      field.value === option.value
                        ? "font-semibold text-white"
                        : "text-gray-400"
                    )}
                  >
                    {option.label}
                    <CheckIcon
                      className={cn(
                        "mr-auto",
                        field.value === option.value
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
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
                            <CustomCalendar
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
                          The Transaction (Purchase) Date
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
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
                  <Button variant="linkHover2" onClick={() => remove(index)}>
                    Remove Audit
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex justify-between mt-4">
              <Button
                variant="linkHover2"
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
              <Button variant="linkHover1" type="submit">
                Submit
              </Button>
            </div>
          </form>
        </div>
      </main>
    </FormProvider>
  );
}