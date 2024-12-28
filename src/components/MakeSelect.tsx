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
import DOMPurify from "isomorphic-dompurify";
import { UseFormSetValue } from "react-hook-form";
import type { FormData } from "../app/TGR/dros/training/ppthandgun/page";

interface MakeSelectProps {
  setValue: UseFormSetValue<FormData>;
  value: string;
  makes: string[];
  isLoadingHandguns: boolean;
}

const MakeSelect = ({
  setValue,
  value,
  makes,
  isLoadingHandguns,
}: MakeSelectProps) => {
  // Query for all makes and filter out empty values
  const { data: filteredMakes = [] } = useQuery({
    queryKey: ["makes", makes],
    queryFn: () => {
      if (!makes) return [];

      // Filter and sort makes
      return makes
        .filter((make) => make && make.trim() !== "") // Remove empty or whitespace-only values
        .sort((a, b) => a.localeCompare(b)); // Sort alphabetically
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
      value={value || ""}
      onValueChange={(newValue) => {
        setValue("make", newValue);
        setValue("model", "");
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select Make" />
      </SelectTrigger>
      <SelectContent>
        <ScrollArea className="h-[200px]">
          {filteredMakes.map((make) => (
            <SelectItem key={make} value={make}>
              {DOMPurify.sanitize(make)}
            </SelectItem>
          ))}
        </ScrollArea>
      </SelectContent>
    </Select>
  );
};

export default MakeSelect;
