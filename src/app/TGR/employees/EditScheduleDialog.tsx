import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EditScheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: number;
  employeeName: string;
  fetchWeeklySchedule: (employeeId: number) => Promise<WeeklySchedule>;
  onUpdateSchedule: (schedules: WeeklySchedule) => Promise<void>;
}

interface WeeklySchedule {
  [day: string]: { start_time: string | null; end_time: string | null };
}

export function EditScheduleDialog({
  isOpen,
  onClose,
  employeeId,
  employeeName,
  fetchWeeklySchedule,
  onUpdateSchedule,
}: EditScheduleDialogProps) {
  const [schedules, setSchedules] = useState<WeeklySchedule>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSchedule();
    }
  }, [isOpen]);

  const loadSchedule = async () => {
    const weeklySchedule = await fetchWeeklySchedule(employeeId);
    const formattedSchedule: WeeklySchedule = {};
    for (const [day, times] of Object.entries(weeklySchedule)) {
      formattedSchedule[day] = {
        start_time: times.start_time ? times.start_time.slice(0, 5) : '',
        end_time: times.end_time ? times.end_time.slice(0, 5) : '',
      };
    }
    setSchedules(formattedSchedule);
  };

  const handleTimeChange = (day: string, field: 'start_time' | 'end_time', value: string) => {
    setSchedules((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const parsedSchedules: WeeklySchedule = {};
      for (const [day, times] of Object.entries(schedules)) {
        parsedSchedules[day] = {
          start_time: times.start_time ? `${times.start_time}:00` : null,
          end_time: times.end_time ? `${times.end_time}:00` : null,
        };
      }
      await onUpdateSchedule(parsedSchedules);
      onClose();
    } catch (error) {
      console.error('Error updating schedule:', error);
      // console.log(
      //   `Failed to update schedule: ${
      //     error instanceof Error ? error.message : "Unknown error"
      //   }`
      // );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-2">
        <DialogHeader>
          <DialogTitle>Edit Schedule for {employeeName}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {Object.entries(schedules).map(([day, times]) => (
            <div key={day} className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor={`${day}-start`} className="text-right">
                {day}
              </Label>
              <Input
                id={`${day}-start`}
                type="time"
                value={times.start_time || ''}
                onChange={(e) => handleTimeChange(day, 'start_time', e.target.value)}
              />
              <Input
                id={`${day}-end`}
                type="time"
                value={times.end_time || ''}
                onChange={(e) => handleTimeChange(day, 'end_time', e.target.value)}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-4">
          <Button variant="linkHover2" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="linkHover1" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Update Schedule'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
