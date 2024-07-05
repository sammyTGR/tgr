// src/app/TGR/rentals/checklist/data-table-row-actions.tsx

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
import { supabase } from "@/utils/supabase/client";
import { FirearmsMaintenanceData } from "./columns";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VerificationForm } from "./verification-form";

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
  const [openVerification, setOpenVerification] = useState(false);

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

  const handleVerificationComplete = () => {
    setOpenVerification(false);
    // Call a function to update the checked status in the main data
    onStatusChange(task.id, task.status);
  };

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
          <DropdownMenuItem onSelect={() => setOpenVerification(true)}>
            Verify Firearm
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onSelect={() => handleStatusChange("Repaired")}>
                Repaired
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => handleStatusChange("Under Repair")}
              >
                Under Repair
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => handleStatusChange("Maintenance Completed")}
              >
                Maintenance Completed
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => handleStatusChange("Had To Send Out")}
              >
                Had To Send Out
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => handleStatusChange("Waiting For Parts")}
              >
                Waiting For Parts
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleStatusChange(null)}>
                Clear Status
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={openVerification} onOpenChange={setOpenVerification}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Firearm</DialogTitle>
            <DialogDescription>
              Please verify the firearm details.
            </DialogDescription>
          </DialogHeader>
          <VerificationForm
            firearmId={task.id}
            userUuid={userUuid}
            verificationDate={new Date().toISOString().split('T')[0]}
            verificationTime={new Date().getHours() < 12 ? 'morning' : 'evening'}
            onVerificationComplete={handleVerificationComplete}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
