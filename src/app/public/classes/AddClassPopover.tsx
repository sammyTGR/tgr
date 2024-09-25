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
  onSubmit: (id: string, updates: Partial<ClassScheduleData>) => void;
  buttonText: string;
  placeholder: string;
  initialData?: ClassScheduleData;
  // setClassSchedules: React.Dispatch<React.SetStateAction<ClassScheduleData[]>>;
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
  // setClassSchedules,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [price, setPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    if (!title.trim()) {
      toast.error("Please enter a class title");
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
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const timeZone = "America/Los_Angeles";
      const startTimeZoned = formatTZ(
        toZonedTime(
          new Date(`${selectedDate!.toISOString().split("T")[0]}T${startTime}`),
          timeZone
        ),
        "yyyy-MM-dd HH:mm:ss"
      );
      const endTimeZoned = formatTZ(
        toZonedTime(
          new Date(`${selectedDate!.toISOString().split("T")[0]}T${endTime}`),
          timeZone
        ),
        "yyyy-MM-dd HH:mm:ss"
      );

      // Create Stripe product
      const response = await fetch("/api/create-stripe-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: title,
          description,
          price: parseFloat(price),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create Stripe product");
      }

      const { productId, priceId } = await response.json();

      const classData: Partial<ClassScheduleData> = {
        title,
        description,
        start_time: startTimeZoned,
        end_time: endTimeZoned,
        stripe_product_id: productId,
        stripe_price_id: priceId,
        price: parseFloat(price),
      };

      await onSubmit("", classData);

      // Use type assertion here
      // setClassSchedules((prev) => [...prev, classData as ClassScheduleData]);

      toast.success("Class added successfully");
      resetForm();
    } catch (error) {
      console.error("Error creating class:", error);
      toast.error("Failed to create class. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStartTime("");
    setEndTime("");
    setSelectedDate(undefined);
    setPrice("");
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="linkHover1">{buttonText}</Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="p-4 w-80">
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Class Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter class title"
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
