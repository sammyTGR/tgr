import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, CheckIcon } from "lucide-react";

interface ShiftFilterProps {
  onSelect: (selectedShifts: string[]) => void;
}

const shiftOptions = [
  { label: "Morning Shift", value: "morning", shortLabel: "Morning" },
  { label: "Mid Shift", value: "mid", shortLabel: "Mid" },
  { label: "Closing Shift", value: "closing", shortLabel: "Closing" },
];

export const ShiftFilter: React.FC<ShiftFilterProps> = ({ onSelect }) => {
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);

  const handleSelect = (value: string) => {
    const updatedShifts = selectedShifts.includes(value)
      ? selectedShifts.filter(shift => shift !== value)
      : [...selectedShifts, value];
    setSelectedShifts(updatedShifts);
    onSelect(updatedShifts);
  };

  const clearFilter = () => {
    setSelectedShifts([]);
    onSelect([]);
  };

  const getButtonText = () => {
    if (selectedShifts.length === 0) return "Filter by Shift";
    if (selectedShifts.length === 1) {
      return shiftOptions.find(option => option.value === selectedShifts[0])?.label || "Filter by Shift";
    }
    return selectedShifts
      .map(shift => shiftOptions.find(option => option.value === shift)?.shortLabel)
      .filter(Boolean)
      .join(", ");
  };

  return (
    <div className="flex items-center space-x-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            {getButtonText()} <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {shiftOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onSelect={() => handleSelect(option.value)}
            >
              <div className="flex items-center">
                {selectedShifts.includes(option.value) && (
                  <CheckIcon className="mr-2 h-4 w-4" />
                )}
                <span>{option.label}</span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {selectedShifts.length > 0 && (
        <Button variant="linkHover2" onClick={clearFilter}>
          Clear Filter
        </Button>
      )}
    </div>
  );
};