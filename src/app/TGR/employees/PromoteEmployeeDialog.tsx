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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Employee, PromotionData } from "./types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/utils/supabase/client";

interface PromoteEmployeeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  onPromote: (promotionData: PromotionData) => Promise<void>;
}

export function PromoteEmployeeDialog({
  isOpen,
  onClose,
  employee,
  onPromote,
}: PromoteEmployeeDialogProps) {
  const [promotionDate, setPromotionDate] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newPayType, setNewPayType] = useState(employee.pay_type);
  const [newPayRate, setNewPayRate] = useState(
    employee.pay_rate?.toString() || ""
  );
  const queryClient = useQueryClient();

  const promoteMutation = useMutation({
    mutationFn: async (promotionData: PromotionData) => {
      const updateData: Partial<Employee> = {
        pay_type: promotionData.newPayType,
        pay_rate: promotionData.newPayRate,
        promotion_date: promotionData.promotionDate,
      };

      if (promotionData.newRole) {
        updateData.role = promotionData.newRole;
      }

      const { data, error } = await supabase
        .from("employees")
        .update(updateData)
        .eq("employee_id", employee.employee_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        ["employees"],
        (oldData: Employee[] | undefined) => {
          if (!oldData) return [data];
          return oldData.map((emp) =>
            emp.employee_id === data.employee_id ? data : emp
          );
        }
      );
      onPromote(data);
      toast.success("Employee Promoted", {
        description: `${employee.name} has been successfully promoted.`,
      });
      onClose();
    },
    onError: (error) => {
      console.error("Error promoting employee:", error);
      toast.error("Promotion Failed", {
        description:
          "There was an error promoting the employee. Please try again.",
      });
    },
  });

  const handlePromote = () => {
    if (!promotionDate || !newPayType || !newPayRate) {
      toast.error("Invalid Input", {
        description: "Please fill in all required fields.",
      });
      return;
    }

    promoteMutation.mutate({
      newRole: newRole || "",
      newPayType,
      newPayRate: parseFloat(newPayRate),
      promotionDate,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Promote Employee: {employee.name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="promotion-date" className="text-right">
              Promotion Date*
            </Label>
            <Input
              id="promotion-date"
              type="date"
              value={promotionDate}
              onChange={(e) => setPromotionDate(e.target.value)}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="new-role" className="text-right">
              New Role
            </Label>
            <Input
              id="new-role"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="col-span-3"
              placeholder="Optional"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="new-pay-type" className="text-right">
              New Pay Type*
            </Label>
            <Select
              onValueChange={setNewPayType}
              defaultValue={newPayType || ""}
              required
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select pay type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="salary">Salary</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="new-pay-rate" className="text-right">
              New Pay Rate*
            </Label>
            <Input
              id="new-pay-rate"
              type="number"
              value={newPayRate}
              onChange={(e) => setNewPayRate(e.target.value)}
              className="col-span-3"
              required
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handlePromote} disabled={promoteMutation.isPending}>
            {promoteMutation.isPending ? "Promoting..." : "Confirm Promotion"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
