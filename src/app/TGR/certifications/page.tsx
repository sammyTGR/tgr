// src/app/TGR/certifications/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  ColumnDef,
  SortingState,
  PaginationState,
} from "@tanstack/react-table";
import { supabase } from "@/utils/supabase/client";
import { CertificationDataTable } from "./certification-data-table";
import { CertificationTableToolbar } from "./certification-table-toolbar";
import { certificationColumns } from "./columns";
import { toast } from "sonner";

interface CertificationData {
  id: string;
  name: string;
  certificate: string;
  number: number;
  expiration: string;
  status: string;
  action_status: string;
}

const CertificationsPage: React.FC = () => {
  const [certifications, setCertifications] = useState<CertificationData[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [pageCount, setPageCount] = useState(0);
  const [filters, setFilters] = useState<any[]>([]);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "expiration", desc: false },
  ]);

  const fetchCertificationsData = async (
    pageIndex: number,
    pageSize: number,
    filters: any[],
    sorting: SortingState
  ) => {
    const response = await fetch("/api/fetch-certifications-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pageIndex, pageSize, filters, sorting }),
    });

    const { data, count, error } = await response.json();

    if (error) {
      console.error("Error fetching certifications data:", error);
    } else {
      setCertifications(data);
      if (count !== undefined) {
        setPageCount(Math.ceil(count / pageSize));
      }
    }
  };

  useEffect(() => {
    fetchCertificationsData(pageIndex, pageSize, filters, sorting);
  }, [pageIndex, pageSize, filters, sorting]);

  const onUpdate = async (id: string, updates: Partial<CertificationData>) => {
    const { error } = await supabase
      .from("certifications")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Error updating certification:", error);
      toast.error("Failed to update certification.");
    } else {
      setCertifications((currentCertifications) =>
        currentCertifications.map((certification) =>
          certification.id === id
            ? { ...certification, ...updates }
            : certification
        )
      );
      toast.success("Certification updated successfully.");
    }
  };

  const handleFilterChange = (newFilters: any[]) => {
    setFilters(newFilters);
    setPageIndex(0); // Reset to the first page when filters change
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
  //*ts-ignore
  const table = useReactTable({
    data: certifications,
    columns: certificationColumns(onUpdate),
    state: {
      sorting,
      columnFilters: filters,
      pagination: { pageIndex, pageSize },
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: setFilters,
    onPaginationChange: (updater) => {
      const [pageIndex, setPageIndex] = useState<number>(0);
      0;
      setPageIndex(pageIndex);
      setPageSize(pageSize);
    },
    manualPagination: true,
    pageCount,
  });

  return (
    <div>
      <CertificationTableToolbar
        table={table}
        onFilterChange={handleFilterChange}
      />
      <CertificationDataTable
        columns={certificationColumns(onUpdate)}
        data={certifications}
        pageCount={pageCount}
        pageIndex={pageIndex}
        setPageIndex={setPageIndex}
        pageSize={pageSize}
        setPageSize={setPageSize}
        filters={filters}
      />
    </div>
  );
};

export default CertificationsPage;
