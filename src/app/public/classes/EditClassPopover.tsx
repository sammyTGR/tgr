// EditClassPopover.tsx
import { useState, useEffect } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toZonedTime, format as formatTZ } from "date-fns-tz";
import { Calendar } from "@/components/ui/calendar";
import { parseISO } from "date-fns";

interface ClassSchedule {
  id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
}

interface EditClassPopoverProps {
  classData: ClassSchedule;
  onSubmit: (updatedClass: ClassSchedule) => void;
  onClose: () => void;
}

export const EditClassPopover: React.FC<EditClassPopoverProps> = ({
  classData,
  onSubmit,
  onClose,
}) => {
  const [title, setTitle] = useState(classData.title);
  const [description, setDescription] = useState(classData.description);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    const startDate = parseISO(classData.start_time);
    const endDate = parseISO(classData.end_time);

    setSelectedDate(startDate);
    setStartTime(formatTZ(startDate, "HH:mm"));
    setEndTime(formatTZ(endDate, "HH:mm"));
  }, [classData]);

  const handleSubmit = async () => {
    if (!selectedDate) {
      console.error("No date selected");
      return;
    }

    const timeZone = "America/Los_Angeles";
    const startTimeZoned = formatTZ(
      toZonedTime(
        new Date(`${selectedDate.toISOString().split("T")[0]}T${startTime}`),
        timeZone
      ),
      "yyyy-MM-dd'T'HH:mm:ssXXX"
    );
    const endTimeZoned = formatTZ(
      toZonedTime(
        new Date(`${selectedDate.toISOString().split("T")[0]}T${endTime}`),
        timeZone
      ),
      "yyyy-MM-dd'T'HH:mm:ssXXX"
    );

    const updatedClassData: ClassSchedule = {
      ...classData,
      title,
      description,
      start_time: startTimeZoned,
      end_time: endTimeZoned,
    };

    await onSubmit(updatedClassData);
    onClose();
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Edit</Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="p-4 w-80">
        <div className="space-y-4">
          <div>
            <Label>Class Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter class title"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter class description"
            />
          </div>
          <div>
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  {selectedDate
                    ? formatTZ(selectedDate, "MMMM d, yyyy")
                    : "Select Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label>Start Time</Label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div>
            <Label>End Time</Label>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Update</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
