import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isValidDate, formatDateForInput } from "../utils/dateValidation";

interface DateInputProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  className?: string;
}

export function DateInput({
  id,
  name,
  label,
  value,
  onChange,
  error,
  className,
}: DateInputProps) {
  const [localError, setLocalError] = useState<string>("");

  useEffect(() => {
    if (value && !isValidDate(value)) {
      setLocalError("Please enter a valid date");
    } else {
      setLocalError("");
    }
  }, [value]);

  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        type="date"
        id={id}
        name={name}
        value={formatDateForInput(value)}
        onChange={onChange}
        className={localError || error ? "border-red-500" : ""}
        max={new Date().toISOString().split("T")[0]} // Prevents future dates
      />
      {(localError || error) && (
        <p className="text-sm text-red-500 mt-1">{localError || error}</p>
      )}
    </div>
  );
}
