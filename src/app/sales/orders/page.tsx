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
import { createClient } from "@supabase/supabase-js";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner"; // Import toast from Sonner
import { useRouter } from "next/navigation"; // Import Next.js router

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Employee = {
  name: string;
  // other properties...
};

const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;

const schema = z.object({
  employee: z.string().nonempty({ message: "Employee name is required" }),
  customer_type: z.string().nonempty({ message: "Customer type is required" }),
  inquiry_type: z.string().nonempty({ message: "Inquiry type is required" }),
  customer_name: z.string().min(6, { message: "First and Last Name Required" }),
  email: z.string().email(),
  phone: z.string().regex(phoneRegex, {
    message: "Phone number must be in xxx-xxx-xxxx format",
  }),
  manufacturer: z.string().min(2, { message: "Manufacturer is required" }),
  item: z.string().min(4, { message: "Item is required" }),
  details: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function Component() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customerTypes, setCustomerTypes] = useState<string[]>([]);
  const [inquiryTypes, setInquiryTypes] = useState<string[]>([]);
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
    const fetchSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) {
        console.error("Error fetching session:", error.message);
        toast.error("Error fetching session. Please log in again.");
        router.push("/sign-in"); // Redirect to login page if no session
        return;
      }
      if (session) {
        setUserUuid(session.user.id);
      } else {
        toast.error("No active session found. Please log in.");
        router.push("/sign-in"); // Redirect to login page if no active session
      }
    };

    fetchSession();
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

    const fetchCustomerTypes = async () => {
      try {
        const response = await fetch("/api/customer-types");
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        setCustomerTypes(data);
      } catch (error) {
        console.error("Error fetching customer types:", error);
      }
    };

    const fetchInquiryTypes = async () => {
      try {
        const response = await fetch("/api/inquiry-types");
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        setInquiryTypes(data);
      } catch (error) {
        console.error("Error fetching inquiry types:", error);
      }
    };

    fetchEmployees();
    fetchCustomerTypes();
    fetchInquiryTypes();
  }, []);

  const onSubmit = async (data: FormData) => {
    if (!userUuid) {
      toast.error("User is not authenticated.");
      return;
    }

    const submissionData = {
      ...data,
      user_uuid: userUuid, // Capture user_uuid from the authenticated user
    };

    const { error } = await supabase.from("orders").insert(submissionData);
    if (error) {
      console.error("Error submitting order:", error);
      toast.error("There was an error submitting your request.");
    } else {
      toast.success("Your order request has been submitted.");
      reset();
    }
  };

  return (
    <div className="flex justify-center mt-36">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Special Orders & Requests</CardTitle>
          <CardDescription>
            Fill out the form to submit a request for special orders, get added
            to a waitlist, and more.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee">Employee Name</Label>
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
                <Label htmlFor="customer_type">Customer Type</Label>
                <Controller
                  name="customer_type"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer type" />
                      </SelectTrigger>
                      <SelectContent>
                        {customerTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.customer_type && (
                  <p className="text-red-500">{errors.customer_type.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inquiry_type">Inquiry Type</Label>
                <Controller
                  name="inquiry_type"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select inquiry type" />
                      </SelectTrigger>
                      <SelectContent>
                        {inquiryTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.inquiry_type && (
                  <p className="text-red-500">{errors.inquiry_type.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="customername">Customer Name</Label>
                <Input
                  id="customer_name"
                  placeholder="Enter customer name"
                  {...register("customer_name")}
                />
                {errors.customer_name && (
                  <p className="text-red-500">{errors.customer_name.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="Enter phone number"
                  {...register("phone")}
                />
                {errors.phone && (
                  <p className="text-red-500">{errors.phone.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="Enter email"
                  type="email"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-red-500">{errors.email.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manufacturer">
                  Manufacturer | Class Name | Etc.
                </Label>
                <Input
                  id="manufacturer"
                  placeholder="S&W | CCW Class | etc."
                  {...register("manufacturer")}
                />
                {errors.manufacturer && (
                  <p className="text-red-500">{errors.manufacturer.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="item">Item | Model | Class</Label>
                <Input
                  id="item"
                  placeholder="M&P 2.0 | 16 HR CCW Class | etc."
                  {...register("item")}
                />
                {errors.item && (
                  <p className="text-red-500">{errors.item.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="details">Request Details</Label>
              <Textarea
                id="details"
                placeholder="FDE | Initial 16 HR Class | etc."
                rows={4}
                {...register("details")}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="ml-auto" type="submit">
              Submit Request
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
