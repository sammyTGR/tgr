// src/app/TGR/employees/TermEmployeeDialog.tsx

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Employee } from "./types";

interface TermEmployeeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  onTerm: (employeeId: number, termDate: string) => Promise<void>;
}

export function TermEmployeeDialog({
  isOpen,
  onClose,
  employee,
  onTerm,
}: TermEmployeeDialogProps) {
  const [termDate, setTermDate] = useState("");

  const handleTerm = async () => {
    if (!termDate) {
      alert("Please select a termination date.");
      return;
    }

    try {
      await onTerm(employee.employee_id, termDate);
      onClose();
    } catch (error) {
      console.error("Error terming employee:", error);
      alert("Failed to term employee. Please try again.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Term Employee: {employee.name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="term-date" className="text-right">
              Termination Date
            </Label>
            <Input
              id="term-date"
              type="date"
              value={termDate}
              onChange={(e) => setTermDate(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleTerm}>Confirm Termination</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
