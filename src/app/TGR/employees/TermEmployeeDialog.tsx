// src/app/TGR/employees/TermEmployeeDialog.tsx

"use client";

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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
  const queryClient = useQueryClient();

  const termMutation = useMutation({
    mutationFn: () => onTerm(employee.employee_id, termDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee Terminated", {
        description: `${employee.name} has been successfully terminated.`,
      });
      onClose();
    },
    onError: (error) => {
      console.error("Error terminating employee:", error);
      toast.error("Termination Failed", {
        description:
          "There was an error terminating the employee. Please try again.",
      });
    },
  });

  const handleTerm = () => {
    if (!termDate) {
      toast.error("Invalid Date", {
        description: "Please select a termination date.",
      });
      return;
    }

    termMutation.mutate();
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
          <Button onClick={handleTerm} disabled={termMutation.isPending}>
            {termMutation.isPending ? "Terminating..." : "Confirm Termination"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
