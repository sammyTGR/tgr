"use client";
import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect, OptionType } from "@/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon } from "@radix-ui/react-icons";
import { useRole } from "@/context/RoleContext"; // Import useRole
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner"; // Import toast from Sonner

const lanesOptions: OptionType[] = [
  { value: "No Problems", label: "No Problems" },
  { label: "Main Range", value: "Main Range" },
  ...Array.from({ length: 15 }, (_, i) => ({
    value: `Lane ${i + 1}`,
    label: `Lane ${i + 1}`,
  })),
  { label: "Back Range", value: "Back Range" },
  ...["A", "B", "C", "D", "E"].map((lane) => ({
    value: `Lane ${lane}`,
    label: `Lane ${lane}`,
  })),
];

export default function Component() {
  const { role } = useRole();
  const [selectedProblems, setSelectedProblems] = useState<string[]>([]);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [description, setDescription] = useState<string>("");

  const handleDateSelect = (day: Date | undefined) => {
    setDate(day || undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date || !description) {
      toast.error("Please fill out all required fields.");
      return;
    }

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        toast.error("Unauthorized");
        return;
      }

      const data = {
        date_of_repair: date,
        lanes_repaired: selectedProblems.join(", "),
        description,
        role,
      };

      // The Supabase client will automatically handle the authorization
      const response = await fetch("/api/submitRangeRepairs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to submit the report.");
      }

      toast.success("Repair Report Submitted Successfully.");
      // Reset form
      setDate(undefined);
      setSelectedProblems([]);
      setDescription("");
    } catch (error) {
      console.error(error);
      toast.error("There was an error submitting the report.");
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto my-24">
      <CardHeader>
        <CardTitle>Range Repair Report</CardTitle>
        <CardDescription>
          Please fill out the form to report EVERY action taken during your
          range repair.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="date">Date Of Range Repairs</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-1 h-4 w-4 -translate-x-1" />
                  {date ? date.toDateString() : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="problems">Repaired Lanes</Label>
            <MultiSelect
              options={lanesOptions}
              selected={selectedProblems}
              onChange={setSelectedProblems}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Describe The Problems</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a description"
            />
          </div>
        </CardContent>
        <CardFooter className="justify-between space-x-2">
          <Button
            variant="ghost"
            type="button"
            onClick={() => {
              setDate(undefined);
              setSelectedProblems([]);
              setDescription("");
            }}
          >
            Cancel
          </Button>
          <Button variant="gooeyRight" type="submit">
            Submit
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
