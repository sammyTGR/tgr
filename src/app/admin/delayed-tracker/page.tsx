"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollBar } from "@/components/ui/scroll-area";
import { ScrollArea } from "@/components/ui/scroll-area";
import classNames from "classnames";
import styles from "./tracker.module.css";
const formSchema = z.object({
  drosNumber: z.string().min(1, "DROS Number is required"),
  firstName: z.string().min(1, "First Name is required"),
  lastName: z.string().min(1, "Last Name is required"),
  transactionDate: z.date(),
  earliestPickupDate: z.date(),
  earliestPickupTime: z.string(),
  latestPickupDate: z.date(),
  latestPickupTime: z.string(),
  phoneNumber: z.string().min(1, "Phone Number is required"),
  status: z.string().min(1, "Status is required"),
  wasCalled: z.boolean(),
  callOutcome: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const statusOptions = [
  "Delayed",
  "Approved",
  "Approved After Delay",
  "Undetermined",
  "Denied",
  "Rejected",
];

const callOutcomeOptions = [
  "Left VM Explaining Not To Come In Until Informed",
  "Spoke With Customer & Explained Delay",
  "Couldn't Leave VM",
  "Line Disconnected",
  "Updated About Status Change To Undetermined",
];

export default function DrosStatusPage() {
  const queryClient = useQueryClient();

  // Fetch DROS status entries
  const { data: drosEntries, isLoading } = useQuery({
    queryKey: ["dros-status"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dros_status")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Get current user's email
  const { data: currentUser = "Unknown" } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user?.email || "Unknown";
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      drosNumber: "",
      firstName: "",
      lastName: "",
      transactionDate: new Date(),
      earliestPickupDate: new Date(),
      earliestPickupTime: "",
      latestPickupDate: new Date(),
      latestPickupTime: "",
      phoneNumber: "",
      status: "",
      wasCalled: false,
      callOutcome: "",
    },
  });

  // Create new DROS status entry
  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Extract first name from metadata
      const fullName = user?.user_metadata?.name || "";
      const firstName = fullName.split(" ")[0];
      const createdBy = firstName || user?.email || "Unknown";

      const { error } = await supabase.from("dros_status").insert([
        {
          dros_number: formData.drosNumber,
          first_name: formData.firstName,
          last_name: formData.lastName,
          transaction_date: formData.transactionDate.toISOString(),
          earliest_pickup_date: formData.earliestPickupDate.toISOString(),
          earliest_pickup_time: formData.earliestPickupTime,
          latest_pickup_date: formData.latestPickupDate.toISOString(),
          latest_pickup_time: formData.latestPickupTime,
          phone_number: formData.phoneNumber,
          status: formData.status,
          was_called: formData.wasCalled,
          call_outcome: formData.callOutcome || null,
          created_by: createdBy,
        },
      ]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dros-status"] });
      form.reset();
      toast.success("DROS status entry created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create DROS status entry");
    },
  });

  // Update DROS status entry
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      formData,
    }: {
      id: number;
      formData: FormData;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Extract first name from metadata
      const fullName = user?.user_metadata?.name || "";
      const firstName = fullName.split(" ")[0];
      const updatedBy = firstName || user?.email || "Unknown";

      const { error } = await supabase
        .from("dros_status")
        .update({
          dros_number: formData.drosNumber,
          first_name: formData.firstName,
          last_name: formData.lastName,
          transaction_date: formData.transactionDate.toISOString(),
          earliest_pickup_date: formData.earliestPickupDate.toISOString(),
          earliest_pickup_time: formData.earliestPickupTime,
          latest_pickup_date: formData.latestPickupDate.toISOString(),
          latest_pickup_time: formData.latestPickupTime,
          phone_number: formData.phoneNumber,
          status: formData.status,
          was_called: formData.wasCalled,
          call_outcome: formData.callOutcome || null,
          updated_at: new Date().toISOString(),
          updated_by: updatedBy,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dros-status"] });
      toast.success("DROS status entry updated successfully");
    },
    onError: (error) => {
      console.error("Update error:", error);
      toast.error("Failed to update DROS status entry");
    },
  });

  // Delete DROS status entry
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from("dros_status")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dros-status"] });
      toast.success("DROS status entry deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete DROS status entry");
    },
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  return (
    <div
      className={`ml-4 mt-4 relative max-w-[calc(100vw-20rem)] md:w-[calc(100vw-10rem)] lg:w-[calc(100vw-10rem)] overflow-hidden flex-1 transition-all duration-300`}
    >
      <Card
        className={`relative max-w-[calc(100vw-20rem)] md:w-[calc(100vw-10rem)] lg:w-[calc(100vw-10rem)] h-full overflow-hidden flex-1 transition-all duration-300`}
      >
        <CardHeader>
          <CardTitle>DROS Status Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
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
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="transactionDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Transaction Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
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
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="earliestPickupDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Earliest Pickup Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
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
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="earliestPickupTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Earliest Pickup Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="latestPickupDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Latest Pickup Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
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
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="latestPickupTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latest Pickup Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="wasCalled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Customer Called</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {form.watch("wasCalled") && (
                  <FormField
                    control={form.control}
                    name="callOutcome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Call Outcome</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select call outcome" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {callOutcomeOptions.map((outcome) => (
                              <SelectItem key={outcome} value={outcome}>
                                {outcome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="flex justify-start mt-6 space-x-4">
                <Button variant="gooeyLeft" type="submit">
                  Save Entry
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    form.reset({
                      drosNumber: "",
                      firstName: "",
                      lastName: "",
                      transactionDate: new Date(),
                      earliestPickupDate: new Date(),
                      earliestPickupTime: "",
                      latestPickupDate: new Date(),
                      latestPickupTime: "",
                      phoneNumber: "",
                      status: "",
                      wasCalled: false,
                      callOutcome: "",
                    });
                  }}
                >
                  New Entry
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card
        className={`mt-4 relative max-w-[calc(100vw-20rem)] md:w-[calc(100vw-10rem)] lg:w-[calc(100vw-10rem)] h-full overflow-hidden flex-1 transition-all duration-300`}
      >
        <CardHeader>
          <CardTitle>DROS Status Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden">
            <ScrollArea
              className={classNames(
                styles.noScroll,
                "overflow-hidden relative"
              )}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>DROS Number</TableHead>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Transaction Date</TableHead>
                    <TableHead>Pickup Window</TableHead>
                    <TableHead>Estimated Pickup</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Called</TableHead>
                    <TableHead>Call Outcome</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Updated By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drosEntries?.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.dros_number}</TableCell>
                      <TableCell>
                        {entry.first_name} {entry.last_name}
                      </TableCell>
                      <TableCell>
                        {format(new Date(entry.transaction_date), "PPP")}
                      </TableCell>
                      <TableCell>
                        {format(new Date(entry.earliest_pickup_date), "PPP")}{" "}
                        {format(
                          new Date(`2000-01-01T${entry.earliest_pickup_time}`),
                          "hh:mm a"
                        )}{" "}
                        - {format(new Date(entry.latest_pickup_date), "PPP")}{" "}
                        {format(
                          new Date(`2000-01-01T${entry.latest_pickup_time}`),
                          "hh:mm a"
                        )}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const earliestDate = new Date(
                            entry.earliest_pickup_date
                          );
                          const estimatedDate = new Date(earliestDate);
                          estimatedDate.setDate(estimatedDate.getDate() + 30);
                          return `${format(estimatedDate, "PPP")} ${format(new Date(`2000-01-01T${entry.earliest_pickup_time}`), "hh:mm a")}`;
                        })()}
                      </TableCell>
                      <TableCell>{entry.phone_number}</TableCell>
                      <TableCell>{entry.status}</TableCell>
                      <TableCell>{entry.was_called ? "Yes" : "No"}</TableCell>
                      <TableCell>{entry.call_outcome || "-"}</TableCell>
                      <TableCell>
                        {entry.updated_at
                          ? format(new Date(entry.updated_at), "PPp")
                          : format(new Date(entry.created_at), "PPp")}
                      </TableCell>
                      <TableCell>
                        {entry.updated_by || entry.created_by || "Unknown"}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <DotsHorizontalIcon className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <DropdownMenuItem
                                    onSelect={(e) => {
                                      e.preventDefault();
                                      form.reset({
                                        drosNumber: entry.dros_number,
                                        firstName: entry.first_name,
                                        lastName: entry.last_name,
                                        transactionDate: new Date(
                                          entry.transaction_date
                                        ),
                                        earliestPickupDate: new Date(
                                          entry.earliest_pickup_date
                                        ),
                                        earliestPickupTime:
                                          entry.earliest_pickup_time,
                                        latestPickupDate: new Date(
                                          entry.latest_pickup_date
                                        ),
                                        latestPickupTime:
                                          entry.latest_pickup_time,
                                        phoneNumber: entry.phone_number,
                                        status: entry.status,
                                        wasCalled: entry.was_called,
                                        callOutcome: entry.call_outcome || "",
                                      });
                                    }}
                                  >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit DROS Status</DialogTitle>
                                  </DialogHeader>
                                  <Form {...form}>
                                    <form
                                      onSubmit={form.handleSubmit((data) =>
                                        updateMutation.mutate({
                                          id: entry.id,
                                          formData: data,
                                        })
                                      )}
                                      className="space-y-4"
                                    >
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                          control={form.control}
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
                                          control={form.control}
                                          name="firstName"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>First Name</FormLabel>
                                              <FormControl>
                                                <Input {...field} />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />

                                        <FormField
                                          control={form.control}
                                          name="lastName"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Last Name</FormLabel>
                                              <FormControl>
                                                <Input {...field} />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />

                                        <FormField
                                          control={form.control}
                                          name="transactionDate"
                                          render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                              <FormLabel>
                                                Transaction Date
                                              </FormLabel>
                                              <Popover>
                                                <PopoverTrigger asChild>
                                                  <FormControl>
                                                    <Button
                                                      variant={"outline"}
                                                      className={cn(
                                                        "w-full pl-3 text-left font-normal",
                                                        !field.value &&
                                                          "text-muted-foreground"
                                                      )}
                                                    >
                                                      {field.value ? (
                                                        format(
                                                          field.value,
                                                          "PPP"
                                                        )
                                                      ) : (
                                                        <span>Pick a date</span>
                                                      )}
                                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                  </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                  className="w-auto p-0"
                                                  align="start"
                                                >
                                                  <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                      date > new Date() ||
                                                      date <
                                                        new Date("1900-01-01")
                                                    }
                                                    initialFocus
                                                  />
                                                </PopoverContent>
                                              </Popover>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />

                                        <FormField
                                          control={form.control}
                                          name="earliestPickupDate"
                                          render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                              <FormLabel>
                                                Earliest Pickup Date
                                              </FormLabel>
                                              <Popover>
                                                <PopoverTrigger asChild>
                                                  <FormControl>
                                                    <Button
                                                      variant={"outline"}
                                                      className={cn(
                                                        "w-full pl-3 text-left font-normal",
                                                        !field.value &&
                                                          "text-muted-foreground"
                                                      )}
                                                    >
                                                      {field.value ? (
                                                        format(
                                                          field.value,
                                                          "PPP"
                                                        )
                                                      ) : (
                                                        <span>Pick a date</span>
                                                      )}
                                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                  </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                  className="w-auto p-0"
                                                  align="start"
                                                >
                                                  <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                      date <
                                                      new Date("1900-01-01")
                                                    }
                                                    initialFocus
                                                  />
                                                </PopoverContent>
                                              </Popover>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />

                                        <FormField
                                          control={form.control}
                                          name="earliestPickupTime"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>
                                                Earliest Pickup Time
                                              </FormLabel>
                                              <FormControl>
                                                <Input type="time" {...field} />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />

                                        <FormField
                                          control={form.control}
                                          name="latestPickupDate"
                                          render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                              <FormLabel>
                                                Latest Pickup Date
                                              </FormLabel>
                                              <Popover>
                                                <PopoverTrigger asChild>
                                                  <FormControl>
                                                    <Button
                                                      variant={"outline"}
                                                      className={cn(
                                                        "w-full pl-3 text-left font-normal",
                                                        !field.value &&
                                                          "text-muted-foreground"
                                                      )}
                                                    >
                                                      {field.value ? (
                                                        format(
                                                          field.value,
                                                          "PPP"
                                                        )
                                                      ) : (
                                                        <span>Pick a date</span>
                                                      )}
                                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                  </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                  className="w-auto p-0"
                                                  align="start"
                                                >
                                                  <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                      date <
                                                      new Date("1900-01-01")
                                                    }
                                                    initialFocus
                                                  />
                                                </PopoverContent>
                                              </Popover>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />

                                        <FormField
                                          control={form.control}
                                          name="latestPickupTime"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>
                                                Latest Pickup Time
                                              </FormLabel>
                                              <FormControl>
                                                <Input type="time" {...field} />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />

                                        <FormField
                                          control={form.control}
                                          name="phoneNumber"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>
                                                Phone Number
                                              </FormLabel>
                                              <FormControl>
                                                <Input {...field} />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />

                                        <FormField
                                          control={form.control}
                                          name="status"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Status</FormLabel>
                                              <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                              >
                                                <FormControl>
                                                  <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                  </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                  {statusOptions.map(
                                                    (status) => (
                                                      <SelectItem
                                                        key={status}
                                                        value={status}
                                                      >
                                                        {status}
                                                      </SelectItem>
                                                    )
                                                  )}
                                                </SelectContent>
                                              </Select>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />

                                        <FormField
                                          control={form.control}
                                          name="wasCalled"
                                          render={({ field }) => (
                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                              <FormControl>
                                                <Checkbox
                                                  checked={field.value}
                                                  onCheckedChange={
                                                    field.onChange
                                                  }
                                                />
                                              </FormControl>
                                              <div className="space-y-1 leading-none">
                                                <FormLabel>
                                                  Customer Called
                                                </FormLabel>
                                              </div>
                                            </FormItem>
                                          )}
                                        />

                                        {form.watch("wasCalled") && (
                                          <FormField
                                            control={form.control}
                                            name="callOutcome"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel>
                                                  Call Outcome
                                                </FormLabel>
                                                <Select
                                                  onValueChange={field.onChange}
                                                  defaultValue={field.value}
                                                >
                                                  <FormControl>
                                                    <SelectTrigger>
                                                      <SelectValue placeholder="Select call outcome" />
                                                    </SelectTrigger>
                                                  </FormControl>
                                                  <SelectContent>
                                                    {callOutcomeOptions.map(
                                                      (outcome) => (
                                                        <SelectItem
                                                          key={outcome}
                                                          value={outcome}
                                                        >
                                                          {outcome}
                                                        </SelectItem>
                                                      )
                                                    )}
                                                  </SelectContent>
                                                </Select>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                        )}
                                      </div>

                                      <Button type="submit">Update</Button>
                                    </form>
                                  </Form>
                                </DialogContent>
                              </Dialog>
                              <DropdownMenuItem
                                onClick={() => deleteMutation.mutate(entry.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
