import React, { useEffect, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  ColumnDef,
} from "@tanstack/react-table";
import { supabase } from "@/utils/supabase/client";
import { DataTable } from "./data-table";
import { SalesTableToolbar } from "./sales-table-toolbar";
import { salesColumns } from "./columns";

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
}

const SalesDataTable = () => {
  const [sales, setSales] = useState<SalesData[]>([]);
  const [totalDROS, setTotalDROS] = useState<number>(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [pageCount, setPageCount] = useState(0);

  const fetchSalesData = async (pageIndex: number, pageSize: number) => {
    const { data, error, count } = await supabase
      .from("sales_data")
      .select("*", { count: 'exact' }) // Include the exact count of rows
      .range(pageIndex * pageSize, (pageIndex + 1) * pageSize - 1);

    if (error) {
      console.error("Error fetching sales data:", error);
    } else {
      setSales(data);
      if (count) {
        setPageCount(Math.ceil(count / pageSize));
      }
    }
  };

  const fetchTotalDROS = async () => {
    const { data, error } = await supabase.rpc("calculate_total_dros");
    if (error) {
      console.error("Error fetching total DROS:", error);
    } else {
      setTotalDROS(data[0].total_dros);
    }
  };

  useEffect(() => {
    fetchSalesData(pageIndex, pageSize);
    fetchTotalDROS();
  }, [pageIndex, pageSize]);

  const onUpdate = (id: number, updates: Partial<SalesData>) => {
    setSales((currentSales) =>
      currentSales.map((sale) =>
        sale.id === id ? { ...sale, ...updates } : sale
      )
    );
  };

  const table = useReactTable({
    data: sales,
    columns: salesColumns(onUpdate),
    pageCount,
    state: { pagination: { pageIndex, pageSize } },
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
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true, // Enable manual pagination
  });

  return (
    <div>
      <SalesTableToolbar table={table} totalDROS={totalDROS} />
      <DataTable table={table} />
    </div>
  );
};

export default SalesDataTable;
