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
import { UseFormSetValue, FieldValues, Path, PathValue } from "react-hook-form";

interface Manufacturer {
  value: string;
  label: string;
}

interface MakeSelectProps<T extends FieldValues> {
  setValue: UseFormSetValue<T>;
  value: string;
  handgunData: Manufacturer[];
  isLoadingHandguns: boolean;
  makeField: Path<T>;
  modelField: Path<T>;
}

const MakeSelect = <T extends FieldValues>({
  setValue,
  value,
  handgunData,
  isLoadingHandguns,
  makeField,
  modelField,
}: MakeSelectProps<T>) => {
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
        setValue(makeField, newValue as PathValue<T, Path<T>>);
        setValue(modelField, "" as PathValue<T, Path<T>>);
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

export default MakeSelect;
