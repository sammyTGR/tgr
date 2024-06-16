"use client";
import { useState } from "react";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { rangeWalkDataSchema, RangeWalkData } from "./data-schema";
import { supabase } from "@/utils/supabase/client";

interface DataTableRowActionsProps {
  row: Row<RangeWalkData>;
  userRole: string;
  userUuid: string; // New prop
  onStatusChange: (id: number, status: string | null) => void;
  onNotesChange: (id: number, notes: string, userName: string) => void;
}

export function DataTableRowActions({
  row,
  userRole,
  userUuid,
  onStatusChange,
  onNotesChange,
}: DataTableRowActionsProps) {
  const task = rangeWalkDataSchema.parse(row.original);
  const [open, setOpen] = useState(false);
  const [repairNotes, setRepairNotes] = useState(task.repair_notes || "");

  const handleStatusChange = async (status: string | null) => {
    const { error } = await supabase
      .from("range_walk_reports")
      .update({ status })
      .eq("id", task.id);

    if (error) {
      console.error("Error updating status:", error.message);
    } else {
      onStatusChange(task.id, status);
    }
  };

  const handleSaveNotes = async () => {
    const { data: userData, error: userError } = await supabase
      .from("employees")
      .select("name")
      .eq("user_uuid", userUuid)
      .single();

    if (userError) {
      console.error("Error fetching user name:", userError.message);
      return;
    }

    const userName = userData?.name || "Unknown";

    const { error } = await supabase
      .from("range_walk_reports")
      .update({ repair_notes: repairNotes, repair_notes_user: userName })
      .eq("id", task.id);

    if (error) {
      console.error("Error saving repair notes:", error.message);
    } else {
      onNotesChange(task.id, repairNotes, userName);
      setOpen(false);
    }
  };

  const canEditNotes = ["admin", "super admin"].includes(userRole) || userUuid === task.user_uuid;

  return (
    <>
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
        <DropdownMenuContent align="end" className="w-[160px]">
          {canEditNotes && (
            <DropdownMenuItem onSelect={() => setOpen(true)}>
              Enter Repair Notes
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onSelect={() => handleStatusChange("Repaired")}>
                Repaired
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleStatusChange("Under Repair")}>
                Under Repair
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleStatusChange(null)}>
                Clear Status
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Repair Notes</DialogTitle>
            <DialogDescription>
              Please enter the details of the repair.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter repair notes..."
            value={repairNotes}
            onChange={(e) => setRepairNotes(e.target.value)}
          />
          <DialogFooter>
            <Button onClick={handleSaveNotes}>Save</Button>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
