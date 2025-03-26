"use client";
import { useEffect, useState } from "react";
import {
  CardTitle,
  CardDescription,
  CardHeader,
  CardContent,
  CardFooter,
  Card,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  SelectValue,
  SelectTrigger,
  SelectItem,
  SelectContent,
  Select,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabase/client";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";
import { useSidebar } from "@/components/ui/sidebar";

type Employee = {
  name: string;
  // other properties...
};

const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;

const schema = z.object({
  employee: z.string().nonempty({ message: "Employee name is required" }),
  dros_status: z.string().nonempty({ message: "DROS status is required" }),
  dros_number: z.string().min(2, { message: "DROS Number is required" }),
  invoice_number: z.string().min(2, { message: "Invoice Number is required" }),
  serial_number: z.string().min(2, { message: "Serial Number is required" }),
  start_trans: z
    .string()
    .nonempty({ message: "Start Transaction status is required" }),
  details: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function PointsComponent() {
  const { state } = useSidebar();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [drosStatus, setDrosStatus] = useState<string[]>([]);
  const [startTrans, setStartTrans] = useState<string[]>([]);
  const [userUuid, setUserUuid] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error.message);
        toast.error("Error fetching user. Please log in again.");
        router.push("/sign-in");
        return;
      }
      if (user) {
        setUserUuid(user.id);
      } else {
        toast.error("No active user found. Please log in.");
        router.push("/sign-in");
      }
    };

    fetchUser();
  }, [router]);

  useEffect(() => {
    if (userUuid) {
      const fetchUserData = async () => {
        const { data, error } = await supabase
          .from("employees")
          .select("name")
          .eq("user_uuid", userUuid)
          .single();
        if (error) {
          console.error("Error fetching user data:", error.message);
        } else if (data) {
          setUserName(data.name);
        }
      };

      fetchUserData();
    }
  }, [userUuid]);

  useEffect(() => {
    const fetchEmployees = async () => {
      const { data, error } = await supabase.from("employees").select("name");
      if (error) console.error("Error fetching employees:", error);
      else setEmployees(data);
    };

    const fetchDrosStatus = async () => {
      try {
        const response = await fetch("/api/dros-status");
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        setDrosStatus(data);
      } catch (error) {
        console.error("Error fetching DROS status:", error);
      }
    };

    const fetchStartTrans = async () => {
      try {
        const response = await fetch("/api/start-trans");
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        setStartTrans(data);
      } catch (error) {
        console.error("Error fetching Start Transaction status:", error);
      }
    };

    fetchEmployees();
    fetchDrosStatus();
    fetchStartTrans();
  }, []);

  const onSubmit = async (data: FormData) => {
    if (!userUuid) {
      toast.error("User is not authenticated.");
      return;
    }

    const submissionData = {
      ...data,
      user_uuid: userUuid,
    };

    const { error } = await supabase.from("points").insert(submissionData);
    if (error) {
      console.error("Error submitting points request:", error);
      toast.error("There was an error submitting your request.");
    } else {
      toast.success("Your points request has been submitted.");
      reset();
    }
  };

  return (
    <div
      className={`flex flex-col items-center space-y-4 p-4 ${state === "collapsed" ? "w-[calc(100vw-70rem)] mt-12 ml-24" : "w-[calc(100vw-70rem)] mt-12 ml-24"} transition-all duration-300`}
    >
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Submitted Points Tracker</CardTitle>
          <CardDescription>
            Fill out the form only AFTER the firearm has been delivered. You
            cannot submit for points if the firearm has not been delivered.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee">Transaction Started By:</Label>
                <Controller
                  name="employee"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem key={employee.name} value={employee.name}>
                            {employee.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.employee && (
                  <p className="text-red-500">{errors.employee.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="dros_status">DROS Status</Label>
                <Controller
                  name="dros_status"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Was The Firearm Delivered?" />
                      </SelectTrigger>
                      <SelectContent>
                        {drosStatus.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.dros_status && (
                  <p className="text-red-500">{errors.dros_status.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dros_number">DROS Number</Label>
                <Input
                  id="dros_number"
                  placeholder="Enter DROS Number With '-'"
                  {...register("dros_number")}
                />
                {errors.dros_number && (
                  <p className="text-red-500">{errors.dros_number.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice_number">AIM Invoice #</Label>
                <Input
                  id="invoice_number"
                  placeholder="Enter AIM Sales Invoice Number"
                  {...register("invoice_number")}
                />
                {errors.invoice_number && (
                  <p className="text-red-500">
                    {errors.invoice_number.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="serial_number">Serial #</Label>
                <Input
                  id="serial_number"
                  placeholder="Enter Serial Number"
                  {...register("serial_number")}
                />
                {errors.serial_number && (
                  <p className="text-red-500">{errors.serial_number.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_trans">Did You Start The Sale?</Label>
                <Controller
                  name="start_trans"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Did You Sell The Firearm?" />
                      </SelectTrigger>
                      <SelectContent>
                        {startTrans.map((trans) => (
                          <SelectItem key={trans} value={trans}>
                            {trans}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.start_trans && (
                  <p className="text-red-500">{errors.start_trans.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="details">Request Details</Label>
              <Textarea
                id="details"
                placeholder="Enter request details"
                rows={4}
                {...register("details")}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ringHover" className="ml-auto" type="submit">
              Submit Request
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
