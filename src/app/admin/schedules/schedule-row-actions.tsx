"use client";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { supabase } from "@/utils/supabase/client";
import { ScheduleData } from "./data-schema";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";


interface ScheduleRowActionsProps<TData> {
  row: Row<TData>;
  fetchReferenceSchedules: () => void; // Function to refresh schedules after update
}

export function ScheduleRowActions<TData>({
  row,
  fetchReferenceSchedules,
}: ScheduleRowActionsProps<TData>) {
  const schedule = row.original as ScheduleData;
  const [startTime, setStartTime] = useState(schedule.start_time || "");
  const [endTime, setEndTime] = useState(schedule.end_time || "");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error.message);
        return;
      }
      
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('employees')
          .select('role')
          .eq('user_uuid', user.id)
          .single();
  
        if (profileError) {
          console.error("Error fetching profile:", profileError.message);
          return;
        }
  
        console.log("Role from profiles table:", profile?.role);
        
        const isSuperAdmin = profile?.role?.toLowerCase().trim() === 'super admin';
        setIsSuperAdmin(isSuperAdmin);
        console.log("Is super admin (after lowercase and trim):", isSuperAdmin);
      }
    };
  
    checkUserRole();
  }, []);

  const handleUpdate = async (field: string, value: any) => {
    // console.log(`Updating ${field} to ${value} for schedule ID ${schedule.id}`);
    const { error } = await supabase
      .from("reference_schedules")
      .update({ [field]: value })
      .eq("id", schedule.id);

    if (error) {
      console.error(`Error updating ${field}:`, error);
    } else {
      // console.log(`Successfully updated ${field} to ${value} for schedule ID ${schedule.id}`);
      fetchReferenceSchedules(); // Refresh the data
    }
  };

  const applyChanges = async () => {
    // console.log(`Applying changes for schedule ID ${schedule.id}: Start Time = ${startTime}, End Time = ${endTime}`);
    await handleUpdate("start_time", startTime || null);
    await handleUpdate("end_time", endTime || null);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[240px] p-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Start Time
          </label>
          <Input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>
        <div className="mt-2">
          <label className="block text-sm font-medium text-gray-700">
            End Time
          </label>
          <Input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
        <DropdownMenuSeparator className="my-2" />
        <DropdownMenuItem
          onClick={() => {
            setStartTime("");
            handleUpdate("start_time", null);
          }}
        >
          Remove Start Time
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            setEndTime("");
            handleUpdate("end_time", null);
          }}
        >
          Remove End Time
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-2" />
        <DropdownMenuItem onClick={applyChanges}>Apply</DropdownMenuItem>
        {isSuperAdmin && (
        <DropdownMenuItem
          onClick={async () => {
            const confirmed = confirm(
              "Are you sure you want to delete this schedule?"
            );
            if (confirmed) {
              const { error } = await supabase
                .from("reference_schedules")
                .delete()
                .eq("id", schedule.id);
              if (error) {
                console.error("Error deleting schedule:", error);
              } else {
                fetchReferenceSchedules();
              }
            }
          }}
        >
          Delete
        </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
