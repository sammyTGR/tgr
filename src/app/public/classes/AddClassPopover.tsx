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
import { toast } from "sonner";

interface PopoverFormProps {
  onSubmit: (id: string, updates: Partial<ClassScheduleData>) => Promise<void>;
  buttonText: string;
  placeholder: string;
  initialData?: ClassScheduleData;
}

interface ClassScheduleData {
  id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  price?: number;
  stripe_product_id?: string;
  stripe_price_id?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export const AddClassPopover: React.FC<PopoverFormProps> = ({
  onSubmit,
  buttonText,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [price, setPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const validateForm = () => {
    if (!name.trim()) {
      toast.error("Please enter a class name");
      return false;
    }
    if (!description.trim()) {
      toast.error("Please enter a class description");
      return false;
    }
    if (!selectedDate) {
      toast.error("Please select a date");
      return false;
    }
    if (!startTime) {
      toast.error("Please enter a start time");
      return false;
    }
    if (!endTime) {
      toast.error("Please enter an end time");
      return false;
    }
    if (!price || parseFloat(price) <= 0) {
      toast.error("Please enter a valid price");
      return false;
    }
    if (
      new Date(`${selectedDate.toDateString()} ${endTime}`) <=
      new Date(`${selectedDate.toDateString()} ${startTime}`)
    ) {
      toast.error("End time must be after start time");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || isLoading) return;

    setIsLoading(true);

    try {
      const timeZone = "America/Los_Angeles";
      const startTimeZoned = formatTZ(
        toZonedTime(
          new Date(`${selectedDate!.toISOString().split("T")[0]}T${startTime}`),
          timeZone
        ),
        "yyyy-MM-dd'T'HH:mm:ssXXX",
        { timeZone }
      );
      const endTimeZoned = formatTZ(
        toZonedTime(
          new Date(`${selectedDate!.toISOString().split("T")[0]}T${endTime}`),
          timeZone
        ),
        "yyyy-MM-dd'T'HH:mm:ssXXX",
        { timeZone }
      );

      const newClass = {
        name: name.trim(),
        title: name.trim(),
        description: description.trim(),
        price: parseFloat(parseFloat(price).toFixed(2)),
        start_time: startTimeZoned,
        end_time: endTimeZoned,
      };

      const response = await fetch("/api/create-stripe-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newClass),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || "Failed to create class");
      }

      await onSubmit("", responseData.classData);

      toast.success("Class added successfully");
      resetForm();
      setIsOpen(false);
    } catch (error) {
      console.error("Detailed error creating class:", error);
      toast.error(
        `Failed to create class: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setStartTime("");
    setEndTime("");
    setSelectedDate(undefined);
    setPrice("");
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="linkHover1">{buttonText}</Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="p-4 w-80">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Class Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter class name"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
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
                    ? selectedDate.toLocaleDateString()
                    : "Select Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label htmlFor="startTime">Start Time</Label>
            <Input
              id="startTime"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="endTime">End Time</Label>
            <Input
              id="endTime"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="price">Price ($)</Label>
            <Input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Enter class price"
              step="0.01"
            />
          </div>
          <Button
            variant="linkHover1"
            className="w-full"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Adding Class..." : "Submit"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
