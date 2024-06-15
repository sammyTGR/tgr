"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { RangeWalkData, columns } from "./columns";
import { DataTable } from "./data-table";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";

const words = "Range Walk Reports";

export default function RangeWalkReport() {
  const [data, setData] = useState<RangeWalkData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRangeWalkData = useCallback(async () => {
    const { data, error } = await supabase
      .from("range_walk_reports")
      .select("*")
      .order("date_of_walk", { ascending: false });

    if (error) {
      console.error("Error fetching initial data:", error.message);
      throw new Error(error.message);
    }
    return data as RangeWalkData[];
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedData = await fetchRangeWalkData();
      setData(fetchedData);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setLoading(false);
    }
  }, [fetchRangeWalkData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const RangeWalkTableSubscription = supabase
      .channel("custom-all-range-walk-reports-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "range_walk_reports" },
        (payload) => {
          if (payload.new) {
            setData((currentData) => [
              payload.new as RangeWalkData,
              ...currentData,
            ]);
          } else {
            fetchData();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(RangeWalkTableSubscription);
    };
  }, [fetchData]);

  return (
    <RoleBasedWrapper allowedRoles={["user", "admin", "super admin"]}>
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
                    <p>Loading...</p>
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
