"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../../../utils/supabase/client";
import createColumns, { AuditData, createColumns as columns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";

const words = "Audits";

export default function AuditReview() {
  const [data, setData] = useState<AuditData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAuditData = useCallback(async () => {
    const { data, error } = await supabase
      .from("Auditsinput")
      .select("*")
      .order("audit_date", { ascending: false }); // Ensure sorting is handled by Supabase

    if (error) {
      console.error("Error fetching initial data:", error.message);
      throw new Error(error.message);
    }
    return data as AuditData[];
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedData = await fetchAuditData();
      // console.log("Fetched data:", fetchedData); // Verify the fetched data
      setData(fetchedData);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setLoading(false);
    }
  }, [fetchAuditData]);

  const columns = useMemo(() => createColumns(fetchAuditData), [fetchAuditData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const AuditTableSubscription = supabase
      .channel("custom-all-audits-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Auditsinput" },
        (payload) => {
          // console.log("Real-time change received:", payload);
          if (payload.new) {
            setData((currentData) => [
              payload.new as AuditData, // Insert the new data at the beginning
              ...currentData,
            ]);
          } else {
            fetchData(); // Refetch for other types of updates
          }
        }
      )
      .subscribe();
    // Cleanup function for the useEffect
    return () => {
      supabase.removeChannel(AuditTableSubscription);
    };
  }, [fetchData]);

  return (
    <RoleBasedWrapper allowedRoles={["auditor", "admin", "super admin"]}>
      <>
        <div className="h-screen flex flex-col">
          <section className="flex-1 flex flex-col space-y-4 p-4">
            <div className="flex items-center justify-between space-y-2">
              <div>
                <h2 className="text-2xl font-bold">
                  <TextGenerateEffect words={words} />
                </h2>
              </div>
            </div>
            <div className="flex-1 flex flex-col space-y-4">
              <div className="rounded-md border flex-1 flex flex-col">
                <div className="relative w-full h-full overflow-auto flex-1">
                  {loading ? (
                    <p></p>
                  ) : (
                    <DataTable columns={columns} data={data} />
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </>
    </RoleBasedWrapper>
  );
}
