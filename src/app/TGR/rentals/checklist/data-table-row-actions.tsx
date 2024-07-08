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
  onNotesChange: (id: number, notes: string) => void;
  onVerificationComplete: () => void;
  onDeleteFirearm: (id: number) => void; // Add this prop
}

export function DataTableRowActions({
  row,
  userRole,
  userUuid,
  onNotesChange,
  onVerificationComplete,
  onDeleteFirearm, // Add this prop
}: DataTableRowActionsProps) {
  const task = row.original;
  const [openVerification, setOpenVerification] = useState(false);

  const handleSetGunsmithStatus = async (status: string) => {
    try {
      if (status === "With Gunsmith") {
        await supabase.from("firearm_verifications").insert({
          firearm_id: task.id,
          verified_by: userUuid,
          verification_date: new Date().toISOString().split("T")[0],
          verification_time: "NA",
          serial_verified: false,
          condition_verified: false,
          magazine_attached: false,
          notes: status,
        });
        onNotesChange(task.id, status);
      } else if (status === "Returned From Gunsmith") {
        await supabase
          .from("firearm_verifications")
          .update({ notes: null })
          .eq("firearm_id", task.id)
          .eq("notes", "With Gunsmith");
        onNotesChange(task.id, "");
      }
      onVerificationComplete();
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error setting gunsmith status:", error.message);
      } else {
        console.error("An unknown error occurred.");
      }
    }
  };

  const handleDeleteFirearm = async () => {
    try {
      await supabase
        .from("firearms_maintenance")
        .delete()
        .eq("id", task.id);

      onDeleteFirearm(task.id); // Call the parent handler
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error deleting firearm:", error.message);
      } else {
        console.error("An unknown error occurred.");
      }
    }
  };

  const handleVerificationComplete = (notes: string) => {
    setOpenVerification(false);
    onNotesChange(task.id, notes); // Update the notes
    onVerificationComplete();
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
            <DropdownMenuSubTrigger>Gunsmithing</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem
                onSelect={() => handleSetGunsmithStatus("With Gunsmith")}
              >
                With Gunsmith
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() =>
                  handleSetGunsmithStatus("Returned From Gunsmith")
                }
              >
                Returned From Gunsmith
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          {["admin", "super admin"].includes(userRole) && (
            <DropdownMenuItem onSelect={handleDeleteFirearm}>
              Delete Firearm
            </DropdownMenuItem>
          )}
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
            verificationDate={new Date().toISOString().split("T")[0]}
            verificationTime={
              new Date().getHours() < 14 ? "morning" : "evening"
            }
            onVerificationComplete={handleVerificationComplete}
            isWithGunsmith={task.notes === "With Gunsmith"} // Pass this prop to VerificationForm
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="linkHover2">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
