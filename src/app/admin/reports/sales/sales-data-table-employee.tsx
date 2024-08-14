// src/app/admin/reports/sales/sales-data-table-employee.tsx
import React, { useEffect, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  SortingState,
} from "@tanstack/react-table";
import { DataTableEmployee } from "./data-table-employee";
import { employeeSalesColumns } from "./columns-employee";
import { toast } from "sonner";

interface SalesData {
  id: number;
  Lanid: string;
  Desc: string;
  Date: string;
  Last: string;
  Mfg: string;
  category_label: string;
  subcategory_label: string;
  total_gross: number;
  total_net: number;
}

interface SalesDataTableEmployeeProps {
  employeeId: number;
}

const SalesDataTableEmployee: React.FC<SalesDataTableEmployeeProps> = ({
  employeeId,
}) => {
  const [sales, setSales] = useState<SalesData[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [pageCount, setPageCount] = useState(0);
  const [filters, setFilters] = useState<any[]>([]);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "Date", desc: true },
  ]);

  const fetchSalesData = async (
    pageIndex: number,
    pageSize: number,
    filters: any[],
    sorting: SortingState
  ) => {
    try {
      const response = await fetch("/api/fetch-employee-sales-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId,
          pageIndex,
          pageSize,
          filters,
          sorting,
        }),
      });

      const { data, count, error } = await response.json();

      if (error) {
        console.error("Error fetching sales data:", error);
        toast.error("Failed to fetch sales data.");
      } else {
        // console.log("Fetched sales data:", data);
        setSales(data);
        if (count !== undefined) {
          setPageCount(Math.ceil(count / pageSize));
        }
      }
    } catch (error) {
      console.error("Failed to fetch sales data:", error);
      toast.error("Failed to fetch sales data.");
    }
  };

  useEffect(() => {
    fetchSalesData(pageIndex, pageSize, filters, sorting);
  }, [employeeId, pageIndex, pageSize, filters, sorting]);

  const onUpdate = async (id: number, updates: Partial<SalesData>) => {
    const response = await fetch(`/api/update-sales-data/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const { error } = await response.json();
      console.error("Error updating sales data:", error);
      toast.error("Failed to update labels.");
    } else {
      setSales((currentSales) =>
        currentSales.map((sale) =>
          sale.id === id ? { ...sale, ...updates } : sale
        )
      );
      toast.success("Labels updated successfully.");
    }
  };

  const handleFilterChange = (newFilters: any[]) => {
    setFilters(newFilters);
  };

  const handleSortingChange = (
    updaterOrValue: SortingState | ((old: SortingState) => SortingState)
  ) => {
    setSorting((old) =>
      typeof updaterOrValue === "function"
        ? updaterOrValue(old)
        : updaterOrValue
    );
  };

  const table = useReactTable({
    data: sales,
    columns: employeeSalesColumns(onUpdate),
    pageCount,
    state: {
      pagination: { pageIndex, pageSize },
      columnFilters: filters,
    },
    onPaginationChange: (updater) => {
      const newPaginationState =
        typeof updater === "function"
          ? updater({ pageIndex, pageSize })
          : updater;
      setPageIndex(newPaginationState.pageIndex);
      setPageSize(newPaginationState.pageSize);
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
  });

  return (
    <div>
      <DataTableEmployee table={table} />
    </div>
  );
};

export default SalesDataTableEmployee;
