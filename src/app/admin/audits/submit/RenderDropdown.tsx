import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";
import { CheckIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

export type OptionType = {
  label: string;
  value: string;
};

type RenderDropdownProps = {
  field: any;
  options: OptionType[];
  placeholder: string;
};

export const RenderDropdown: React.FC<RenderDropdownProps> = ({
  field,
  options,
  placeholder,
}) => {
  const [searchText, setSearchText] = useState("");

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full">
          {field.value
            ? options.find((option) => option.value === field.value)?.label ||
              placeholder
            : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder={`Search ${placeholder}...`}
            onInput={(e) => setSearchText(e.currentTarget.value)}
          />
          <CommandList>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => {
                    field.onChange(option.value);
                    setSearchText("");
                  }}
                  className={cn(
                    "flex items-center px-3 py-2 cursor-pointer",
                    "hover:bg-gray-800",
                    field.value === option.value
                      ? "font-semibold text-white"
                      : "text-gray-400"
                  )}
                >
                  {option.label}
                  <CheckIcon
                    className={cn(
                      "mr-auto",
                      field.value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))
            ) : (
              <CommandEmpty>No results found.</CommandEmpty>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
