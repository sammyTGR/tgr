'use client';

import { useState, useEffect } from 'react';
import { Cross2Icon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FirearmTableToolbarProps<TData> {
  table: Table<TData>;
}

export function FirearmTableToolbar<TData>({ table }: FirearmTableToolbarProps<TData>) {
  const [manufacturerFilter, setManufacturerFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Check if any filter is applied
  const isFiltered =
    manufacturerFilter.length > 0 || modelFilter.length > 0 || typeFilter.length > 0;

  // Sync local state with table state
  useEffect(() => {
    const columnFilters = table.getState().columnFilters;
    columnFilters.forEach((filter) => {
      if (filter.id === 'manufacturer') setManufacturerFilter(filter.value as string);
      if (filter.id === 'model') setModelFilter(filter.value as string);
      if (filter.id === 'type') setTypeFilter(filter.value as string);
    });
  }, [table]);

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2 p-1">
        <Select
          value={typeFilter}
          onValueChange={(value) => {
            setTypeFilter(value);
            table.getColumn('type')?.setFilterValue(value === 'all' ? '' : value);
          }}
        >
          <SelectTrigger className="h-8 w-[150px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="rifle">Rifle</SelectItem>
            <SelectItem value="handgun">Handgun</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Filter by manufacturer..."
          value={manufacturerFilter}
          onChange={(event) => {
            setManufacturerFilter(event.target.value);
            table.getColumn('manufacturer')?.setFilterValue(event.target.value);
          }}
          className="h-8 w-[150px] lg:w-[250px]"
        />

        <Input
          placeholder="Filter by model..."
          value={modelFilter}
          onChange={(event) => {
            setModelFilter(event.target.value);
            table.getColumn('model')?.setFilterValue(event.target.value);
          }}
          className="h-8 w-[150px] lg:w-[250px]"
        />

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              table.resetColumnFilters();
              setManufacturerFilter('');
              setModelFilter('');
              setTypeFilter('');
            }}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
