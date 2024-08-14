import { useState } from "react";
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

interface PopoverFormProps {
  onSubmit: (id: string, updates: Partial<ClassScheduleData>) => void;
  buttonText: string;
  placeholder: string;
  initialData?: ClassScheduleData;
  setClassSchedules: React.Dispatch<React.SetStateAction<ClassScheduleData[]>>; // Add this prop
}

interface ClassScheduleData {
  id: number;
  title: string;
  description: string; // Change this line to match the ClassSchedule interface
  start_time: string;
  end_time: string;
}

export const AddClassPopover: React.FC<PopoverFormProps> = ({
  onSubmit,
  buttonText,
  setClassSchedules, // Destructure the prop
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const handleSubmit = async () => {
    // console.log("Submitting form...");

    const timeZone = "America/Los_Angeles";
    const startTimeZoned = formatTZ(
      toZonedTime(
        new Date(`${selectedDate?.toISOString().split("T")[0]}T${startTime}`),
        timeZone
      ),
      "yyyy-MM-dd HH:mm:ss"
    );
    const endTimeZoned = formatTZ(
      toZonedTime(
        new Date(`${selectedDate?.toISOString().split("T")[0]}T${endTime}`),
        timeZone
      ),
      "yyyy-MM-dd HH:mm:ss"
    );

    const classData = {
      title,
      description,
      start_time: startTimeZoned,
      end_time: endTimeZoned,
    };

    await onSubmit("", classData);

    resetForm();
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStartTime("");
    setEndTime("");
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="linkHover1">{buttonText}</Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="p-4">
        <div>
          <Label>Class Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter class title"
          />
          <div className="mt-2">
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
                <Button variant="outline" className="w-full">
                  {selectedDate
                    ? selectedDate.toLocaleDateString()
                    : "Select Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="center">
                <Calendar
                  selected={selectedDate}
                  onDayClick={(date: Date) => setSelectedDate(date)}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="mt-2">
            <Label>Start Time</Label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="mt-2">
            <Label>End Time</Label>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>

          <Button variant="linkHover1" className="mt-4" onClick={handleSubmit}>
            Submit
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
