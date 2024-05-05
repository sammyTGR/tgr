"use client";
import supabase from "../../../supabase/lib/supabaseClient";
import { AuditData, columns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { ModeToggle } from "@/components/mode-toggle";
import React from "react";

async function fetchAuditData(): Promise<AuditData[]> {
  const { data, error } = await supabase.from("Auditsinput").select("*");
  if (error) throw new Error(error.message);
  return data as AuditData[];
}

export default function AuditReview() {
  const [data, setData] = React.useState<AuditData[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadData() {
      try {
        const fetchedData = await fetchAuditData();
        setData(fetchedData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);
  return (
    <div>
      <header >
        <div className="flex items-center justify-between mb-4">
          <span className="hidden font-bold sm:inline-block">
            TGR Audit Review
          </span>
          <ModeToggle />
        </div>
      </header>
      <section>
        <div className="hidden h-full flex flex-col space-y-8 p-8 md:flex ">
          <div className="flex items-center justify-between space-y-2">
            <div>
              <h2 className="text-2xl font-bold">Audits</h2>
            </div>
          </div>
          <div className="flex items-center justify-between space-y-2">
            <div className="space-y-4">
              <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                {loading ? <p>Loading...</p> : <DataTable columns={columns} data={data} />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
