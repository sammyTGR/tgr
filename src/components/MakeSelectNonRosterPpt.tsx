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
import type { FormData } from "../app/TGR/dros/training/officerppthandgun/page";

interface MakeSelectProps {
  setValue: UseFormSetValue<FormData>;
  value: string;
  handgunData: Record<string, any>;
  isLoadingHandguns: boolean;
}

const MakeSelectNonRosterPpt = ({
  setValue,
  value,
  handgunData,
  isLoadingHandguns,
}: MakeSelectProps) => {
  // Query for all makes and filter out empty values
  const { data: makes = [] } = useQuery({
    queryKey: ["makes"],
    queryFn: () =>
      handgunData
        ? Object.keys(handgunData)
            .filter((make) => make && make.trim() !== "") // Filter out empty or whitespace-only values
            .sort((a, b) => a.localeCompare(b)) // Sort alphabetically
        : [],
    enabled: !!handgunData,
  });

  return (
    <Select
      value={value}
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
          {makes.map((make) => (
            <SelectItem key={make} value={make}>
              {DOMPurify.sanitize(make)}
            </SelectItem>
          ))}
        </ScrollArea>
      </SelectContent>
    </Select>
  );
};

export default MakeSelectNonRosterPpt;
