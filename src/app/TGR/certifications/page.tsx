// src/app/TGR/certifications/page.tsx
"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  PaginationState,
  ColumnFiltersState,
  VisibilityState,
  TableState,
  Updater,
} from "@tanstack/react-table";
import DOMPurify from "isomorphic-dompurify";
import { supabase } from "@/utils/supabase/client";
import { CertificationDataTable } from "./certification-data-table";
import { CertificationTableToolbar } from "./certification-table-toolbar";
import { certificationColumns } from "./columns";
import { toast } from "sonner";
import { useRole } from "@/context/RoleContext";
import { PopoverForm } from "./PopoverForm";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import classNames from "classnames";
import styles from "./table.module.css";

// Types and Interfaces
interface CertificationData {
  id: string;
  name: string;
  certificate: string;
  number: number;
  expiration: string;
  status: string;
  action_status: string;
}

interface Employee {
  employee_id: number;
  name: string;
}

interface FetchCertificationsResponse {
  data: CertificationData[];
  count: number;
  error: Error | null;
}

interface FilterItem {
  id: string;
  value: string | string[];
}

interface MutationError extends Error {
  type: "update" | "delete";
}

const CertificationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { role } = useRole();

  // Create ref for current table state
  const tableState = React.useRef({
    sorting: [{ id: "expiration", desc: false }] as SortingState,
    pagination: {
      pageIndex: 0,
      pageSize: 10,
    } as PaginationState,
    columnFilters: [] as ColumnFiltersState,
    columnVisibility: {} as VisibilityState,
  });

  // Queries
  const employeesQuery = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("employee_id, name");
      if (error) throw error;
      return data.map((emp) => ({
        ...emp,
        name: DOMPurify.sanitize(emp.name),
      }));
    },
  });

  const certificationsQuery = useQuery({
    queryKey: [
      "certifications",
      tableState.current.pagination,
      tableState.current.sorting,
      tableState.current.columnFilters,
    ],
    queryFn: async () => {
      const state = tableState.current;
      const response = await fetch("/api/fetch-certifications-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageIndex: state.pagination.pageIndex,
          pageSize: state.pagination.pageSize,
          filters: state.columnFilters.map((filter) => ({
            id: DOMPurify.sanitize(filter.id),
            value:
              typeof filter.value === "string"
                ? DOMPurify.sanitize(filter.value)
                : filter.value,
          })),
          sorting: state.sorting,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const result = await response.json();
      return {
        data: result.data.map((cert: CertificationData) => ({
          ...cert,
          name: DOMPurify.sanitize(cert.name),
          certificate: DOMPurify.sanitize(cert.certificate),
          status: DOMPurify.sanitize(cert.status),
        })),
        pageCount: Math.ceil(result.count / state.pagination.pageSize),
      };
    },
  });

  // Create memoized data first
  const tableData = React.useMemo(
    () => certificationsQuery.data?.data ?? [],
    [certificationsQuery.data]
  );

  const pageCount = React.useMemo(
    () =>
      Math.ceil(
        (certificationsQuery.data?.pageCount ?? 0) *
          tableState.current.pagination.pageSize
      ),
    [
      certificationsQuery.data?.pageCount,
      tableState.current.pagination.pageSize,
    ]
  );

  // Mutations
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<CertificationData>;
    }) => {
      if (Object.keys(updates).length === 0) {
        const { error } = await supabase
          .from("certifications")
          .delete()
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("certifications")
          .update(updates)
          .eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certifications"] });
      toast.success("Certification updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update certification: ${error.message}`);
    },
  });

  const addMutation = useMutation<
    CertificationData,
    Error,
    Partial<CertificationData>
  >({
    mutationFn: async (newCertification) => {
      const sanitizedCert = {
        ...newCertification,
        name: DOMPurify.sanitize(newCertification.name || ""),
        certificate: DOMPurify.sanitize(newCertification.certificate || ""),
        status: DOMPurify.sanitize(newCertification.status || ""),
      };

      const { data, error } = await supabase
        .from("certifications")
        .insert([sanitizedCert])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certifications"] });
      toast.success("Certification added successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to add certification: ${error.message}`);
    },
  });

  // Table instance
  const table = useReactTable({
    data: [],
    columns: certificationColumns((id, updates) =>
      updateMutation.mutate({ id, updates })
    ),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    defaultColumn: {
      minSize: 0,
      size: 150,
      maxSize: 500,
    },
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
      sorting: [{ id: "expiration", desc: false }],
      columnFilters: [],
    },
    onStateChange: (updater) => {
      queryClient.invalidateQueries({ queryKey: ["certifications"] });
    },
  });

  // Update table state
  table.options.data = tableData;
  table.options.pageCount = Math.ceil(
    (certificationsQuery.data?.pageCount ?? 0) *
      table.getState().pagination.pageSize
  );

  return (
    <div className="flex flex-col h-screen my-8 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs defaultValue="certifications" className="flex-1 flex flex-col">
          <div className="container justify-start px-4 mt-4">
            <TabsList>
              <TabsTrigger value="certifications">Certifications</TabsTrigger>
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
                  <ScrollArea>
                    <div className="max-h-[calc(100vh-300px)] max-w-[calc(100vw-20px)] overflow-auto relative">
                      <CardContent className="p-0 mx-auto overflow-hidden">
                        <CertificationTableToolbar
                          table={table}
                          onFilterChange={(filters) => {
                            tableState.current.columnFilters = filters;
                            queryClient.invalidateQueries({
                              queryKey: ["certifications"],
                            });
                          }}
                        />
                        <div>
                          <CertificationDataTable
                            data={tableData}
                            table={table}
                            employees={employeesQuery.data ?? []}
                            onAddCertificate={(
                              cert: Partial<CertificationData>
                            ) => addMutation.mutate(cert)}
                          />
                        </div>
                      </CardContent>
                      <ScrollBar orientation="vertical" />
                      <ScrollBar orientation="horizontal" />
                    </div>
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
