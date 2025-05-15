// src/components/TimeOffRequestComponent.tsx
'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { TextGenerateEffect } from '@/components/ui/text-generate-effect';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const TimeOffRequestComponent = ({ employeeName }: { employeeName: string }) => {
  const [timeOffReasons, setTimeOffReasons] = useState<{ id: number; reason: string }[]>([]);
  const [timeOffData, setTimeOffData] = useState({ reason: '', other_reason: '' });
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [showOtherTextarea, setShowOtherTextarea] = useState(false);

  useEffect(() => {
    fetchTimeOffReasons();
  }, []);

  const fetchTimeOffReasons = async () => {
    try {
      const response = await fetch('/api/time_off_reasons');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const otherExists = data.some((reason: { reason: string }) => reason.reason === 'Other');
      if (!otherExists) {
        data.push({ id: data.length + 1, reason: 'Other' });
      }
      setTimeOffReasons(data);
    } catch (error: any) {
      console.error('Failed to fetch time off reasons:', error.message);
    }
  };

  const handleReasonChange = (value: string) => {
    setTimeOffData({ ...timeOffData, reason: value });
    setShowOtherTextarea(value === 'Other');
  };

  const handleSelectDates = (dates: Date[] | undefined) => {
    setSelectedDates(dates || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDates.length < 1) {
      toast.error('Please select at least one date.');
      return;
    }
    const start_date = format(
      new Date(Math.min(...selectedDates.map((date) => date.getTime()))),
      'yyyy-MM-dd'
    );
    const end_date = format(
      new Date(Math.max(...selectedDates.map((date) => date.getTime()))),
      'yyyy-MM-dd'
    );
    const payload = { ...timeOffData, start_date, end_date, employee_name: employeeName };
    try {
      const response = await fetch('/api/time_off', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setTimeOffData({ reason: '', other_reason: '' });
      setSelectedDates([]);
      setShowOtherTextarea(false);
      toast('Your Request Has Been Submitted', {
        position: 'bottom-right',
        action: {
          label: 'Noice!',
          onClick: () => {},
        },
      });
    } catch (error: any) {
      console.error('Failed to submit time off request:', error.message);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-8 md:py-12">
      <h1 className="text-2xl font-bold mb-4">
        <TextGenerateEffect words="Submit Time Off Requests" />
      </h1>
      <div className="w-full space-y-4">
        <form onSubmit={handleSubmit} className="mt-8">
          <div className="flex flex-col space-y-4 max-w-2xl">
            <div className="flex flex-col border border-gray-200 dark:border-gray-800 rounded-lg max-w-lg mx-auto">
              <Calendar mode="multiple" selected={selectedDates} onSelect={handleSelectDates} />
            </div>
            <label className="text-lg font-medium flex justify-center text-center">
              Select Dates By Clicking On All Dates You&apos;ll Be Out
            </label>
            <Select value={timeOffData.reason} onValueChange={handleReasonChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select Reason" />
              </SelectTrigger>
              <SelectContent>
                {timeOffReasons.map((reason) => (
                  <SelectItem key={reason.id} value={reason.reason}>
                    {reason.reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {showOtherTextarea && (
              <Textarea
                placeholder="Please specify your reason"
                value={timeOffData.other_reason}
                onChange={(e) => setTimeOffData({ ...timeOffData, other_reason: e.target.value })}
                className="textarea"
              />
            )}
            <Button type="submit" variant="gooeyRight">
              Submit Request
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TimeOffRequestComponent;
