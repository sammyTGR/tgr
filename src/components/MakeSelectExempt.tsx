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
import type { FormData } from "../app/TGR/dros/training/exempthandgun/page";

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

const MakeSelectExempt = ({
  setValue,
  value,
  handgunData,
  isLoadingHandguns,
}: MakeSelectProps) => {
  if (isLoadingHandguns) {
    return (
      <Select disabled>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Loading makes..." />
        </SelectTrigger>
      </Select>
    );
  }

  if (!handgunData || handgunData.length === 0) {
    return (
      <Select disabled>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="No manufacturers available" />
        </SelectTrigger>
      </Select>
    );
  }

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
          {handgunData.map((manufacturer) => (
            <SelectItem
              key={manufacturer.value}
              value={manufacturer.value}
              className="px-2 py-1 cursor-pointer hover:bg-accent hover:text-accent-foreground"
            >
              {DOMPurify.sanitize(manufacturer.label)}
            </SelectItem>
          ))}
        </ScrollArea>
      </SelectContent>
    </Select>
  );
};

export default MakeSelectExempt;
