import React, { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
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
import type { FormData } from "../app/TGR/dros/training/ppthandgun/page"; // Update this path

interface MakeSelectProps {
  setValue: UseFormSetValue<FormData>;
  value: string;
  handgunData: Record<string, any>;
  isLoadingHandguns: boolean;
}

const MakeSelect = ({
  setValue,
  value,
  handgunData,
  isLoadingHandguns,
}: MakeSelectProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const { data: makes = [] } = useQuery({
    queryKey: ["makes"],
    queryFn: () => (handgunData ? Object.keys(handgunData) : []),
    enabled: !!handgunData,
  });

  const rowVirtualizer = useVirtualizer({
    count: makes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
    overscan: 5,
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
        <ScrollArea className="h-[300px] overflow-auto" ref={parentRef}>
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const make = makes[virtualRow.index];
              return (
                <SelectItem
                  key={virtualRow.key}
                  value={make}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {DOMPurify.sanitize(make)}
                </SelectItem>
              );
            })}
          </div>
        </ScrollArea>
      </SelectContent>
    </Select>
  );
};

export default MakeSelect;
