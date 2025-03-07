import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import DOMPurify from "isomorphic-dompurify";
import { UseFormSetValue } from "react-hook-form";
import type { FormData } from "../app/TGR/dros/training/ppthandgun/page";

interface Manufacturer {
  value: string;
  label: string;
}

interface MakeSelectProps {
  setValue: UseFormSetValue<FormData>;
  value: string;
  makes: Manufacturer[];
  isLoadingHandguns: boolean;
}

const MakeSelect = ({
  setValue,
  value,
  makes = [],
  isLoadingHandguns,
}: MakeSelectProps) => {
  // Query for all makes and filter out empty values
  const { data: filteredMakes = [] } = useQuery({
    queryKey: ["makes", makes],
    queryFn: () => {
      if (!makes) return [];
      return makes.sort((a, b) => a.label.localeCompare(b.label));
    },
    enabled: !!makes && !isLoadingHandguns,
  });

  if (isLoadingHandguns) {
    return (
      <Select disabled>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Loading makes..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select
      value={value}
      onValueChange={(newValue) => {
        setValue("make", newValue, { shouldValidate: true });
        setValue("model", "", { shouldValidate: true }); // Reset model when make changes
      }}
      disabled={isLoadingHandguns}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select Make" />
      </SelectTrigger>
      <SelectContent>
        <Command>
          <CommandInput placeholder="Search makes..." className="h-9" />
          <CommandEmpty>No makes found.</CommandEmpty>
          <CommandGroup>
            <ScrollArea className="h-[300px]">
              {filteredMakes.map((make) => (
                <CommandItem
                  key={make.value}
                  onSelect={() => {
                    setValue("make", make.value, { shouldValidate: true });
                    setValue("model", "", { shouldValidate: true });
                  }}
                >
                  {DOMPurify.sanitize(make.label)}
                </CommandItem>
              ))}
            </ScrollArea>
          </CommandGroup>
        </Command>
      </SelectContent>
    </Select>
  );
};

export default MakeSelect;
