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
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
  customername: z.string().min(6, { message: "First and Last Name Reequired" }),
  email: z.string().email(),
  phone: z
    .string()
    .min(1, { message: "Phone number is required" })
    .regex(phoneRegex, {
      message: "Phone number must be in xxx-xxx-xxxx format",
    }),
  manufacturer: z.string().min(2, { message: "Manufacturer is required" }),
  item: z.string().min(4, { message: "Item is required" }),
  details: z.string(),
});

type FormData = z.infer<typeof schema>;

export default function Component() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customerTypes, setCustomerTypes] = useState([]);
  const [inquiryTypes, setInquiryTypes] = useState([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      const { data, error } = await supabase.from("employees").select("name");
      if (error) console.error("Error fetching employees:", error);
      else setEmployees(data);
    };

    const fetchCustomerTypes = async () => {
      const response = await fetch("/api/customer-types");
      const data = await response.json();
      setCustomerTypes(data);
    };

    const fetchInquiryTypes = async () => {
      const response = await fetch("/api/inquiry-types");
      const data = await response.json();
      setInquiryTypes(data);
    };

    fetchEmployees();
    fetchCustomerTypes();
    fetchInquiryTypes();
  }, []);

  return (
    <div className="flex justify-center mt-36">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Special Order Request</CardTitle>
          <CardDescription>
            Fill out the form to submit a special order request.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee">Employee Name</Label>
              <Select>
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-type">Customer Type</Label>
              <Select>
                <SelectTrigger id="customer-type">
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
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inquiry-type">Inquiry Type</Label>
              <Select>
                <SelectTrigger id="inquiry-type">
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="customername">Customer Name</Label>
              <Input id="customername" placeholder="Enter customer name" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" placeholder="Enter phone number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" placeholder="Enter email" type="email" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input id="manufacturer" placeholder="Enter manufacturer" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item">Item/Model</Label>
              <Input id="item" placeholder="Enter item/model" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="details">Request Details</Label>
            <Textarea
              id="details"
              placeholder="Enter request details"
              rows={4}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="ml-auto" type="submit">
            Submit Request
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
