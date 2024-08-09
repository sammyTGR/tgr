import React, { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { CheckIcon } from "@radix-ui/react-icons"; // Import the CheckIcon

interface FacetedFilterProps {
  columnId: string;
  title: string;
  options: { label: string; value: string }[];
  onSelect: (selectedValues: string[]) => void;
}

export const DataTableFacetedFilter: React.FC<FacetedFilterProps> = ({
  columnId,
  title,
  options,
  onSelect,
}) => {
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  const handleSelect = (value: string) => {
    let updatedValues: string[];
    if (selectedValues.includes(value)) {
      updatedValues = selectedValues.filter((v) => v !== value);
    } else {
      updatedValues = [...selectedValues, value];
    }
    setSelectedValues(updatedValues);
    onSelect(updatedValues);  // Pass the array of selected values directly
  };

  const clearFilter = () => {
    setSelectedValues([]);
    onSelect([]);  // Clear the filter
  };

  return (
    <div className="flex items-center space-x-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            {title} <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {options.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onSelect={() => handleSelect(option.value)}
            >
              <div className="flex items-center">
                {selectedValues.includes(option.value) && (
                  <CheckIcon className="mr-2" />
                )}
                <span>{option.label}</span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="ghost"
        onClick={clearFilter}
        style={{
          opacity: selectedValues.length > 0 ? 1 : 0,
          pointerEvents: selectedValues.length > 0 ? "auto" : "none",
        }}
      >
        Clear Filter
      </Button>
    </div>
  );
};

