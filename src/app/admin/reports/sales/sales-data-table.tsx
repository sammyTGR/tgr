import React, { useEffect, useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  ColumnDef,
  Table as ReactTable,
  ColumnFiltersState,
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

const columns: ColumnDef<SalesData>[] = [
  { accessorKey: "Lanid", header: "Lanid" },
  { accessorKey: "Invoice", header: "Invoice" },
  { accessorKey: "Sku", header: "Sku" },
  { accessorKey: "Desc", header: "Description" },
  { accessorKey: "SoldPrice", header: "Sold Price" },
  { accessorKey: "SoldQty", header: "Sold Qty" },
  { accessorKey: "Cost", header: "Cost" },
  { accessorKey: "Acct", header: "Account" },
  { accessorKey: "Date", header: "Date" },
  { accessorKey: "Disc", header: "Discount" },
  { accessorKey: "Type", header: "Type" },
  { accessorKey: "Spiff", header: "Spiff" },
  { accessorKey: "Last", header: "Last" },
  { accessorKey: "LastName", header: "Last Name" },
  { accessorKey: "Legacy", header: "Legacy" },
  { accessorKey: "Stloc", header: "Stloc" },
  { accessorKey: "Cat", header: "Category" },
  { accessorKey: "Sub", header: "Subcategory" },
  { accessorKey: "Mfg", header: "Manufacturer" },
  { accessorKey: "CustType", header: "Customer Type" },
  { accessorKey: "category_label", header: "Category Label" },
  { accessorKey: "subcategory_label", header: "Subcategory Label" },
];

const SalesDataTable = () => {
  const [sales, setSales] = useState<SalesData[]>([]);
  const [totalDROS, setTotalDROS] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("sales_data")
        .select("*")
        .limit(10000); // Fetching 10000 rows to handle large dataset
      if (error) {
        console.error("Error fetching sales data:", error);
      } else {
        setSales(data);
      }
    };

    fetchData();
  }, []);

  const calculateTotalDROS = (data: SalesData[]) => {
    return data.reduce((total, row) => {
      if (row.subcategory_label) {
        return total + (row.SoldQty || 0);
      }
      return total;
    }, 0);
  };

  useEffect(() => {
    setTotalDROS(calculateTotalDROS(sales));
  }, [sales]);

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
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div>
      <SalesTableToolbar table={table} totalDROS={totalDROS} />
      <DataTable table={table} />
    </div>
  );
};

export default SalesDataTable;
