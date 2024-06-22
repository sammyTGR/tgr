"use client";
import * as React from "react";
import { CheckIcon, PlusCircledIcon } from "@radix-ui/react-icons";
import { Column, Table as TableType } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Cross2Icon } from "@radix-ui/react-icons";
import { statuses } from "./data";

interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>;
  title?: string;
  options: {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
  table: TableType<TData>;
  onFilterChange: (value: string[]) => void;
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
  table,
  onFilterChange,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const facets = column?.getFacetedUniqueValues();
  const selectedValues = new Set(column?.getFilterValue() as string[]);
  const isFiltered = table.getState().columnFilters.length > 0;

  const handleFilterChange = (value: string) => {
    const newSelectedValues = new Set(selectedValues);
    if (newSelectedValues.has(value)) {
      newSelectedValues.delete(value);
    } else {
      newSelectedValues.add(value);
    }
    const filterValues = Array.from(newSelectedValues);

    // Check if "Contacted" is being deselected and handle accordingly
    if (!newSelectedValues.has("contacted") && !newSelectedValues.size) {
      // If no other filters are selected, show all non-contacted orders by default
      onFilterChange(["not_contacted"]);
    } else {
      onFilterChange(filterValues);
    }

    column?.setFilterValue(filterValues.length ? filterValues : undefined);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="Filter By Customer Name..."
            value={
              (table.getColumn("customer_name")?.getFilterValue() as string) ??
              ""
            }
            onChange={(event) =>
              table
                .getColumn("customer_name")
                ?.setFilterValue(event.target.value)
            }
            className="h-8 w-[150px] lg:w-[250px]"
          />
          <Input
            placeholder="Filter By Employee..."
            value={
              (table.getColumn("employee")?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn("employee")?.setFilterValue(event.target.value)
            }
            className="h-8 w-[150px] lg:w-[250px]"
          />
          <Input
            placeholder="Filter By Model..."
            value={(table.getColumn("item")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("item")?.setFilterValue(event.target.value)
            }
            className="h-8 w-[150px] lg:w-[250px]"
          />
          {column && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 border-dashed"
                >
                  <PlusCircledIcon className="mr-2 h-4 w-4" />
                  {title}
                  {selectedValues?.size > 0 && (
                    <>
                      <Separator orientation="vertical" className="mx-2 h-4" />
                      <Badge
                        variant="secondary"
                        className="rounded-sm px-1 font-normal lg:hidden"
                      >
                        {selectedValues.size}
                      </Badge>
                      <div className="hidden space-x-1 lg:flex">
                        {selectedValues.size > 2 ? (
                          <Badge
                            variant="secondary"
                            className="rounded-sm px-1 font-normal"
                          >
                            {selectedValues.size} selected
                          </Badge>
                        ) : (
                          options
                            .filter((option) =>
                              selectedValues.has(option.value)
                            )
                            .map((option) => (
                              <Badge
                                variant="secondary"
                                key={option.value}
                                className="rounded-sm px-1 font-normal"
                              >
                                {option.label}
                              </Badge>
                            ))
                        )}
                      </div>
                    </>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                  <CommandInput placeholder={title} />
                  <CommandList>
                    <CommandGroup>
                      {options.map((option) => {
                        const isSelected = selectedValues.has(option.value);
                        return (
                          <CommandItem
                            key={option.value}
                            onSelect={() => handleFilterChange(option.value)}
                          >
                            <div
                              className={cn(
                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "opacity-50 [&_svg]:invisible"
                              )}
                            >
                              <CheckIcon className={cn("h-4 w-4")} />
                            </div>
                            {option.icon && (
                              <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                            )}
                            <span>{option.label}</span>
                            {facets?.get(option.value) && (
                              <span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs">
                                {facets.get(option.value)}
                              </span>
                            )}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                    {selectedValues.size > 0 && (
                      <>
                        <CommandSeparator />
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => {
                              column?.setFilterValue(undefined);
                              onFilterChange(["not_contacted"]); // Reset to show all non-contacted orders
                            }}
                            className="justify-center text-center"
                          >
                            Clear filters
                          </CommandItem>
                        </CommandGroup>
                      </>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
          {isFiltered && (
            <Button
              variant="ghost"
              onClick={() => {
                table.resetColumnFilters();
                onFilterChange(["not_contacted"]); // Reset to show all non-contacted orders
              }}
              className="h-8 px-2 lg:px-3"
            >
              Reset
              <Cross2Icon className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
