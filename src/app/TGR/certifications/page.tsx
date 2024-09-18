// src/app/TGR/certifications/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  PaginationState,
} from "@tanstack/react-table";
import { supabase } from "@/utils/supabase/client";
import { CertificationDataTable } from "./certification-data-table";
import { CertificationTableToolbar } from "./certification-table-toolbar";
import { certificationColumns } from "./columns";
import { toast } from "sonner";
import { useRole } from "@/context/RoleContext"; // Import useRole hook
import { PopoverForm } from "./PopoverForm";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import classNames from "classnames";
import styles from "./table.module.css";

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
  const [employees, setEmployees] = useState<
    { employee_id: number; name: string }[]
  >([]);
  const { role } = useRole(); // Get the user's role

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
  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("employee_id, name");

    if (error) {
      console.error("Error fetching employees:", error);
    } else {
      setEmployees(data);
    }
  };

  useEffect(() => {
    fetchCertificationsData(pageIndex, pageSize, filters, sorting);
  }, [pageIndex, pageSize, filters, sorting]);

  const onUpdate = async (id: string, updates: Partial<CertificationData>) => {
    if (Object.keys(updates).length === 0) {
      // Handle deletion case
      const { error } = await supabase
        .from("certifications")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting certification:", error);
        toast.error("Failed to delete certification.");
      } else {
        setCertifications((currentCertifications) =>
          currentCertifications.filter(
            (certification) => certification.id !== id
          )
        );
        toast.success("Certification deleted successfully.");
      }
    } else {
      // Handle update case
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
    }
  };

  const handleAddCertificate = async (
    id: string, // This parameter will be ignored for adding a new certificate
    updates: Partial<CertificationData> // This will contain the updates to be made
  ) => {
    const { name, certificate, number, expiration, status } = updates;

    if (!name || !certificate || !number || !expiration || !status) {
      console.error("Missing required fields for adding certification.");
      toast.error("Please fill in all required fields.");
      return;
    }

    const { data, error } = await supabase
      .from("certifications")
      .insert([{ name, certificate, number, expiration, status }])
      .select(); // Ensure data is returned after insert

    if (error) {
      console.error("Error adding certification:", error);
      toast.error("Failed to add certification.");
    } else if (data && Array.isArray(data) && data.length > 0) {
      const newCertification = data[0] as CertificationData;

      setCertifications((prevCertifications) => [
        ...prevCertifications,
        { ...newCertification, action_status: "" },
      ]);
      toast.success("Certification added successfully.");
    } else {
      console.error("No data returned after inserting certification.");
      toast.error("Failed to add certification.");
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
    onPaginationChange: (
      updater: PaginationState | ((old: PaginationState) => PaginationState)
    ) => {
      if (typeof updater === "function") {
        const { pageIndex: newPageIndex, pageSize: newPageSize } = updater({
          pageIndex,
          pageSize,
        });
        setPageIndex(newPageIndex);
        setPageSize(newPageSize);
      } else {
        setPageIndex(updater.pageIndex);
        setPageSize(updater.pageSize);
      }
    },
    manualPagination: true,
    pageCount,
  });

  useEffect(() => {
    const fetchEmployees = async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("employee_id, name");

      if (error) {
        console.error("Error fetching employees:", error);
      } else {
        setEmployees(data);
      }
    };

    fetchEmployees();
  }, []);

  return (
    <div className="flex flex-col h-screen my-8 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs defaultValue="certifications" className="flex-1 flex flex-col">
          <div className="container justify-start px-4 mt-4">
            <TabsList>
              <TabsTrigger value="certifications">Certifications</TabsTrigger>
              {/* Add more tabs if needed */}
            </TabsList>
          </div>

          <div className="grid flex-1 items-start mt-4 max-w-8xl gap-4 p-2 sm:px-6 sm:py-0 md:gap-8 body">
            <div className="container px-4 mt-4">
              <TabsContent
                value="certifications"
                className="mt-0 overflow-hidden"
              >
                <Card className="h-full overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold">
                      <TextGenerateEffect words="Certifications Management" />
                    </CardTitle>
                  </CardHeader>
                  <ScrollArea className="h-[calc(100vh-300px)] overflow-auto">
                    <CardContent className="p-0 mx-auto overflow-hidden">
                      <CertificationTableToolbar
                        table={table}
                        onFilterChange={handleFilterChange}
                      />
                      <div className="border rounded-md">
                        <CertificationDataTable
                          columns={certificationColumns(onUpdate)}
                          data={certifications}
                          pageCount={pageCount}
                          pageIndex={pageIndex}
                          setPageIndex={setPageIndex}
                          pageSize={pageSize}
                          setPageSize={setPageSize}
                          filters={filters}
                          handleAddCertificate={handleAddCertificate}
                          employees={employees}
                        />
                      </div>
                    </CardContent>
                    <ScrollBar orientation="vertical" />
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </Card>
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default CertificationsPage;
