import { FC, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TimesheetReport } from './TimesheetTable';

interface ReconcileDialogFormProps {
  row: TimesheetReport;
  onReconcile: (row: TimesheetReport, hours: number) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const ReconcileDialogForm: FC<ReconcileDialogFormProps> = ({
  row,
  onReconcile,
  onClose,
  isOpen,
}) => {
  const [difference, setDifference] = useState('00:00');
  const [hoursToReconcile, setHoursToReconcile] = useState('0.00');
  const [canReconcile, setCanReconcile] = useState(false);

  useEffect(() => {
    const scheduledMinutes = (row.scheduled_hours ?? 0) * 60;
    const [workedHours, workedMinutes] = (row.calculated_total_hours || '00:00')
      .split(':')
      .map(Number);
    const totalWorkedMinutes = workedHours * 60 + workedMinutes;

    const diffMinutes = scheduledMinutes - totalWorkedMinutes;
    const diffHours = Math.floor(diffMinutes / 60);
    const remainingMinutes = diffMinutes % 60;

    const formattedDiff = `${diffHours
      .toString()
      .padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}`;
    const diffInHours = (diffMinutes / 60).toFixed(2);

    setDifference(formattedDiff);
    setHoursToReconcile(diffInHours);
    setCanReconcile(diffMinutes > 0 && (row.available_sick_time ?? 0) > 0);
  }, [row]);

  const handleReconcile = () => {
    const hours = parseFloat(hoursToReconcile);
    if (
      canReconcile &&
      hours > 0 &&
      row.available_sick_time !== null &&
      hours <= row.available_sick_time
    ) {
      onReconcile(row, hours);
      onClose();
    } else {
      // console.log("Cannot reconcile:", { canReconcile, hours, row });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reconcile Hours</DialogTitle>
          <DialogDescription>
            Adjust the hours to reconcile the difference between scheduled and worked hours.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="scheduled" className="text-right">
              Scheduled
            </Label>
            <Input
              id="scheduled"
              value={row.scheduled_hours?.toFixed(2) || 'N/A'}
              readOnly
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="total" className="text-right">
              Total Worked
            </Label>
            <Input
              id="total"
              value={row.calculated_total_hours || '00:00'}
              readOnly
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="difference" className="text-right">
              Difference
            </Label>
            <Input id="difference" value={difference} readOnly className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="available" className="text-right">
              Available Sick Time
            </Label>
            <Input
              id="available"
              value={row.available_sick_time?.toFixed(2) || 'N/A'}
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
          <Button onClick={handleReconcile} disabled={!canReconcile}>
            Confirm Reconciliation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
