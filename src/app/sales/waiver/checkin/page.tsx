// src/app/sales/waiver/checkin/page.tsx
"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { waiverColumns, Waiver } from "./columns";
import { DataTable } from "./data-table";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { WaiverTableToolbar } from "./waiver-table-toolbar";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import { useRole } from "@/context/RoleContext"; // Import the useRole hook
import { useRouter } from "next/navigation"; // Import the router
import RoleBasedWrapper from "@/components/RoleBasedWrapper";

const title = "Review Waiver Submissions";

export default function WaiversCheckinPage() {
  const [data, setData] = useState<Waiver[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWaiverData = useCallback(async () => {
    const { data, error } = await supabase
      .from("waiver")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching initial data:", error.message);
      throw new Error(error.message);
    }
    return data as Waiver[];
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedData = await fetchWaiverData();
      setData(fetchedData);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setLoading(false);
    }
  }, [fetchWaiverData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onStatusChange = (id: string, status: "checked_in" | "checked_out") => {
    setData((currentWaivers) =>
      currentWaivers.map((waiver) =>
        waiver.id === id ? { ...waiver, status } : waiver
      )
    );
  };

  const table = useReactTable({
    data,
    columns: waiverColumns(onStatusChange),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  useEffect(() => {
    const WaiversTableSubscription = supabase
      .channel("custom-all-waivers-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "waiver" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setData((currentData) => [payload.new as Waiver, ...currentData]);
          } else if (payload.eventType === "UPDATE") {
            setData((currentData) =>
              currentData.map((waiver) =>
                waiver.id === payload.new.id ? (payload.new as Waiver) : waiver
              )
            );
          } else if (payload.eventType === "DELETE") {
            setData((currentData) =>
              currentData.filter((waiver) => waiver.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(WaiversTableSubscription);
    };
  }, [fetchData]);

  return (
    <RoleBasedWrapper
      allowedRoles={["user", "auditor", "admin", "super admin", "dev"]}
    >
      <div className="h-screen flex flex-col">
        <section className="flex-1 flex flex-col space-y-4 p-4">
          <div className="flex items-center justify-between space-y-2">
            <div>
              <h2 className="text-2xl font-bold">
                <TextGenerateEffect words={title} />
              </h2>
            </div>
          </div>
          <div className="flex-1 flex flex-col space-y-4">
            <WaiverTableToolbar table={table} /> {/* Add the toolbar here */}
            <div className="rounded-md border flex-1 flex flex-col">
              <div className="relative w-full h-full overflow-auto flex-1">
                {loading ? (
                  <p>Loading...</p>
                ) : (
                  <DataTable table={table} /> // Pass the table object to DataTable
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </RoleBasedWrapper>
  );
}
