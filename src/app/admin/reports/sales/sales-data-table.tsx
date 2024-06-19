// src/app/admin/reports/sales/sales-data-table.tsx
import React, { useEffect, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";
import { DataTable } from "./data-table";
import { SalesTableToolbar } from "./sales-table-toolbar";
import { salesColumns } from "./columns";
import { toast } from "sonner";
import { supabase } from "@/utils/supabase/client";

interface SalesData {
  id: number;
  Lanid: string;
  Invoice: number;
  Sku: string;
  Desc: string;
  SoldPrice: number;
  SoldQty: number;
  Cost: number;
  Acct: number;
  Date: string;
  Disc: number;
  Type: string;
  Spiff: number;
  Last: string;
  LastName: string;
  Legacy: string;
  Stloc: number;
  Cat: number;
  Sub: number;
  Mfg: string;
  CustType: string;
  category_label: string;
  subcategory_label: string;
  status: string;
  total_gross: number; // new column
  total_net: number; // new column
}

const SalesDataTable = () => {
  const [sales, setSales] = useState<SalesData[]>([]);
  const [totalDROS, setTotalDROS] = useState<number>(0);
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
      const response = await fetch("/api/fetch-sales-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pageIndex, pageSize, filters, sorting }),
      });

      const { data, count, error } = await response.json();

      if (error) {
        console.error("Error fetching sales data:", error);
        toast.error("Failed to fetch sales data.");
      } else {
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

  const fetchTotalDROS = async (filters: any[]) => {
    try {
      const response = await fetch("/api/calculate-total-dros", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filters }),
      });

      const { totalDROS, error } = await response.json();

      if (error) {
        console.error("Error fetching total DROS:", error);
      } else {
        setTotalDROS(totalDROS);
      }
    } catch (error) {
      console.error("Failed to fetch total DROS:", error);
    }
  };

  useEffect(() => {
    fetchSalesData(pageIndex, pageSize, filters, sorting);
    fetchTotalDROS(filters);
  }, [pageIndex, pageSize, filters, sorting]);

  const onUpdate = async (id: number, updates: Partial<SalesData>) => {
    const { error } = await supabase
      .from("sales_data")
      .update(updates)
      .eq("id", id);

    if (error) {
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
    columns: salesColumns(onUpdate),
    pageCount,
    state: {
      pagination: { pageIndex, pageSize },
      columnFilters: filters,
      sorting,
    },
    onPaginationChange: (updater) => {
      const newPaginationState =
        typeof updater === "function"
          ? updater({ pageIndex, pageSize })
          : updater;
      setPageIndex(newPaginationState.pageIndex);
      setPageSize(newPaginationState.pageSize);
    },
    onSortingChange: handleSortingChange,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true,
  });

  return (
    <div>
      {/* <SalesTableToolbar
        table={table}
        totalDROS={totalDROS}
        onFilterChange={handleFilterChange}
      /> */}
      <DataTable table={table} />
    </div>
  );
};

export default SalesDataTable;
