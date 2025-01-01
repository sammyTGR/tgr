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
import type { FormData } from "../app/TGR/dros/training/officerhandgun/page";

interface MakeSelectProps {
  setValue: UseFormSetValue<FormData>;
  value: string;
  handgunData: string[];
  isLoadingHandguns: boolean;
}

const MakeSelectNonRoster = ({
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
          {handgunData.map((make) => (
            <SelectItem key={make} value={make}>
              {DOMPurify.sanitize(make)}
            </SelectItem>
          ))}
        </ScrollArea>
      </SelectContent>
    </Select>
  );
};

export default MakeSelectNonRoster;
