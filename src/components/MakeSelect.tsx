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
import { useVirtualizer } from "@tanstack/react-virtual";
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
  const [search, setSearch] = React.useState("");
  const parentRef = React.useRef<HTMLDivElement>(null);

  // Filter and sort makes based on search
  const filteredMakes = React.useMemo(() => {
    if (!makes) return [];
    return makes
      .filter((make) => make.label.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [makes, search]);

  const rowVirtualizer = useVirtualizer({
    count: filteredMakes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35, // Approximate height of each item
    overscan: 5,
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
        setValue("model", "", { shouldValidate: true });
      }}
      disabled={isLoadingHandguns}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select Make" />
      </SelectTrigger>
      <SelectContent>
        <Command>
          <CommandInput
            placeholder="Search makes..."
            className="h-9"
            value={search}
            onValueChange={setSearch}
          />
          <CommandEmpty>No makes found.</CommandEmpty>
          <CommandGroup>
            <div ref={parentRef} className="h-[300px] overflow-auto">
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: "100%",
                  position: "relative",
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                  const make = filteredMakes[virtualItem.index];
                  return (
                    <CommandItem
                      key={virtualItem.key}
                      onSelect={() => {
                        setValue("make", make.value, { shouldValidate: true });
                        setValue("model", "", { shouldValidate: true });
                      }}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: `${virtualItem.size}px`,
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                    >
                      {DOMPurify.sanitize(make.label)}
                    </CommandItem>
                  );
                })}
              </div>
            </div>
          </CommandGroup>
        </Command>
      </SelectContent>
    </Select>
  );
};

export default MakeSelect;
