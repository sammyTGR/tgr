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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FirearmsMaintenanceData } from "./columns";
import { supabase } from "@/utils/supabase/client";

interface DataTableRowActionsProps {
  row: Row<FirearmsMaintenanceData>;
  userRole: string;
  userUuid: string;
  onStatusChange: (id: number, status: string | null) => void;
  onNotesChange: (id: number, notes: string) => void;
}

export function DataTableRowActions({
  row,
  userRole,
  userUuid,
  onStatusChange,
  onNotesChange,
}: DataTableRowActionsProps) {
  const task = row.original;
  const [open, setOpen] = useState(false);
  const [maintenanceNotes, setMaintenanceNotes] = useState(task.maintenance_notes || "");

  const handleStatusChange = async (status: string | null) => {
    const { error } = await supabase
      .from("firearms_maintenance")
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
      .from("profiles")
      .select("name")
      .eq("id", userUuid)
      .single();

    if (userError) {
      console.error("Error fetching user name:", userError.message);
      return;
    }

    const userName = userData?.name || "Unknown";

    const { error } = await supabase
      .from("firearms_maintenance")
      .update({ maintenance_notes: maintenanceNotes })
      .eq("id", task.id);

    if (error) {
      console.error("Error saving maintenance notes:", error.message);
    } else {
      onNotesChange(task.id, maintenanceNotes);
      setOpen(false);
    }
  };

  const canEditNotes =
    ["gunsmith", "admin", "super admin"].includes(userRole) ||
    userUuid === task.assigned_to;

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
              Enter Maintenance Notes
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onSelect={() => handleStatusChange("Completed")}>
                Completed
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => handleStatusChange("In Progress")}
              >
                In Progress
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
            <DialogTitle>Enter Maintenance Notes</DialogTitle>
            <DialogDescription>
              Please enter the details of the maintenance.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter maintenance notes..."
            value={maintenanceNotes}
            onChange={(e) => setMaintenanceNotes(e.target.value)}
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
