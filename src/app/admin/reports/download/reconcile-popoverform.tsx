import { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimesheetReport } from "./TimesheetTable";

interface ReconcileDialogFormProps {
  row: TimesheetReport;
  availableSickTime: number;
  onReconcile: (hours: number) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const ReconcileDialogForm: FC<ReconcileDialogFormProps> = ({
  row,
  availableSickTime,
  onReconcile,
  onClose,
  isOpen,
}) => {
  const [hoursToReconcile, setHoursToReconcile] = useState("");

  const handleReconcile = () => {
    const hours = parseFloat(hoursToReconcile);
    if (!isNaN(hours) && hours > 0 && hours <= availableSickTime) {
      onReconcile(hours);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reconcile Hours</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="scheduled" className="text-right">
              Scheduled
            </Label>
            <Input
              id="scheduled"
              value={row.scheduled_hours.toString()}
              readOnly
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="total" className="text-right">
              Total
            </Label>
            <Input
              id="total"
              value={(row.calculated_total_hours || 0).toString()}
              readOnly
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="difference" className="text-right">
              Difference
            </Label>
            <Input
              id="difference"
              value={(
                row.scheduled_hours -
                (parseFloat(row.calculated_total_hours || "0") || 0)
              ).toFixed(2)}
              readOnly
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="available" className="text-right">
              Available Sick Time
            </Label>
            <Input
              id="available"
              value={availableSickTime.toFixed(2)}
              readOnly
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reconcile" className="text-right">
              Hours to Reconcile
            </Label>
            <Input
              id="reconcile"
              value={hoursToReconcile}
              onChange={(e) => setHoursToReconcile(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleReconcile}>Confirm Reconciliation</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
