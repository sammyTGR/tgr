"use client";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect, OptionType } from "@/components/ui/multi-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "@radix-ui/react-icons";
import { useRole } from "@/context/RoleContext"; // Import useRole
import { supabase } from '@/utils/supabase/client';

const lanesOptions: OptionType[] = [
  { value: "No Problems", label: "No Problems" },
  { label: "Main Range", value: "Main Range" },
  ...Array.from({ length: 15 }, (_, i) => ({ value: `Lane ${i + 1}`, label: `Lane ${i + 1}` })),
  { label: "Back Range", value: "Back Range" },
  ...["A", "B", "C", "D", "E"].map(lane => ({ value: `Lane ${lane}`, label: `Lane ${lane}` }))
];

export default function Component() {
  const { role } = useRole();
  const [selectedProblems, setSelectedProblems] = useState<string[]>([]);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [lanes, setLanes] = useState<string | null>(null);
  const [description, setDescription] = useState<string>("");

  const handleDateSelect = (day: Date | undefined) => {
    setDate(day || undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date || !lanes) {
      alert("Please fill out all required fields.");
      return;
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (!session) {
        alert("Unauthorized");
        return;
      }

      const data = {
        date_of_walk: date,
        lanes,
        lanes_with_problems: selectedProblems.join(", "),
        description,
        role
      };

      const response = await fetch('/api/submitRangeWalkReport', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}` // Pass the access token to the server
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to submit the report.');
      }

      alert('Report submitted successfully.');
      // Reset form
      setDate(undefined);
      setLanes(null);
      setSelectedProblems([]);
      setDescription("");
    } catch (error) {
      console.error(error);
      alert('There was an error submitting the report.');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto my-24">
      <CardHeader>
        <CardTitle>Range Walk Report</CardTitle>
        <CardDescription>Please fill out the form to report any issues from your range walk.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="date">Date Of Range Walk</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-1 h-4 w-4 -translate-x-1" />
                  {date ? date.toDateString() : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={handleDateSelect} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lanes">Lanes</Label>
            <Select onValueChange={setLanes}>
              <SelectTrigger>
                <SelectValue placeholder="Select lanes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Lanes (Main & Back Range)</SelectItem>
                <SelectItem value="1-15">Lanes 1-15</SelectItem>
                <SelectItem value="a-e">Lanes A-E</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="problems">Lanes With Problems</Label>
            <MultiSelect
              options={lanesOptions}
              selected={selectedProblems}
              onChange={setSelectedProblems}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Describe The Problems</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter a description" />
          </div>
        </CardContent>
        <CardFooter className="justify-between space-x-2">
          <Button variant="ghost" type="button" onClick={() => {
            setDate(undefined);
            setLanes(null);
            setSelectedProblems([]);
            setDescription("");
          }}>Cancel</Button>
          <Button type="submit">Submit</Button>
        </CardFooter>
      </form>
    </Card>
  );
}
