"use client";
import React, { useState, useEffect } from "react";
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
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import { useRole } from "@/context/RoleContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";

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

interface RangewalkFormProps {
  onSubmitSuccess: () => void;
  onClose: () => void;
}

const RangewalkForm: React.FC<RangewalkFormProps> = ({
  onSubmitSuccess,
  onClose,
}) => {
  const { role } = useRole();
  const [selectedProblems, setSelectedProblems] = useState<string[]>([]);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [lanes, setLanes] = useState<string | null>(null);
  const [description, setDescription] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError) {
        console.error("Error fetching user:", userError.message);
        return;
      }

      const user = userData.user;
      setUserId(user.id);

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError) {
        console.error("Error fetching session:", sessionError.message);
        return;
      }
      setAccessToken(sessionData.session?.access_token || "");

      const { data: userDetails, error: detailsError } = await supabase
        .from("employees")
        .select("name")
        .eq("user_uuid", user.id)
        .single();

      if (detailsError) {
        console.error("Error fetching user details:", detailsError.message);
        return;
      }

      setUserName(userDetails?.name || user.email);
    };

    fetchUser();
  }, []);

  const handleDateSelect = (day: Date | undefined) => {
    setDate(day || undefined);
  };

  const submitRangeWalkMutation = useMutation({
    mutationFn: async (formData: any) => {
      const response = await fetch("/api/submitRangeWalkReport", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to submit the report.");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Range Walk Report Submitted!");
      onSubmitSuccess();
      onClose();
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["rangeWalkData"] });
      // Reset form
      setDate(undefined);
      setLanes(null);
      setSelectedProblems([]);
      setDescription("");
    },
    onError: (error) => {
      console.error(error);
      toast.error("There was an error submitting the report.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!date || !lanes) {
      toast.error("Please fill out all required fields.");
      return;
    }

    const formData = {
      user_uuid: userId,
      date_of_walk: date,
      lanes,
      lanes_with_problems: selectedProblems.join(", "),
      description,
      role,
    };

    submitRangeWalkMutation.mutate(formData);
  };

  return (
    <RoleBasedWrapper
      allowedRoles={["user", "auditor", "admin", "super admin"]}
    >
      <CardHeader>
        <CardTitle>Range Walk Report</CardTitle>
        <CardDescription>
          Please fill out the form to report any issues from your range walk.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="date">Date Of Range Walk</Label>
            <Popover open={open} onOpenChange={setOpen}>
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
            <Label htmlFor="lanes">Lanes That Were Checked</Label>
            <Select onValueChange={setLanes}>
              <SelectTrigger>
                <SelectValue placeholder="Select lanes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  All Lanes (Main & Back Range)
                </SelectItem>
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
              setLanes(null);
              setSelectedProblems([]);
              setDescription("");
            }}
          >
            Cancel
          </Button>
          <Button variant="gooeyLeft" type="submit">
            Submit
          </Button>
        </CardFooter>
      </form>
    </RoleBasedWrapper>
  );
};

export default RangewalkForm;
