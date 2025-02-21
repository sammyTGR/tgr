import React from "react";
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

interface Manufacturer {
  value: string;
  label: string;
}

interface MakeSelectProps {
  setValue: UseFormSetValue<FormData>;
  value: string;
  handgunData: Manufacturer[];
  isLoadingHandguns: boolean;
}

const MakeSelectNonRosterPpt = ({
  setValue,
  value,
  handgunData,
  isLoadingHandguns,
}: MakeSelectProps) => {
  // console.log("MakeSelect Props:", {
  //   value,
  //   isLoadingHandguns,
  //   handgunDataLength: handgunData?.length,
  //   handgunData,
  // });

  if (isLoadingHandguns) {
    // console.log("Loading state triggered");
    return (
      <Select disabled>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Loading makes..." />
        </SelectTrigger>
      </Select>
    );
  }

  if (!handgunData || handgunData.length === 0) {
    // console.log("No data state triggered", { handgunData });
    return (
      <Select disabled>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="No manufacturers available" />
        </SelectTrigger>
      </Select>
    );
  }

  // console.log("Rendering with data:", handgunData);
  return (
    <Select
      value={value}
      onValueChange={(newValue) => {
        // console.log("Selected new value:", newValue);
        setValue("make", newValue);
        setValue("model", "");
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select Make" />
      </SelectTrigger>
      <SelectContent>
        <ScrollArea className="h-[200px]">
          {handgunData.map((manufacturer) => (
            <SelectItem
              key={manufacturer.value}
              value={manufacturer.value}
              className="px-2 py-1 cursor-pointer hover:bg-accent hover:text-accent-foreground"
            >
              {manufacturer.label}
            </SelectItem>
          ))}
        </ScrollArea>
      </SelectContent>
    </Select>
  );
};

export default MakeSelectNonRosterPpt;
