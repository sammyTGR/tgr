"use client";
import supabase from "../../../supabase/lib/supabaseClient";
import { AuditData, columns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import React, { useEffect, useState } from 'react';

const words = 'Audits';

async function fetchAuditData(): Promise<AuditData[]> {
  const { data, error } = await supabase
    .from("Auditsinput")
    .select("*");
    // .order('audit_date', { ascending: true }); // This ensures sorting is handled by Supabase

  if (error) {
    console.error('Error fetching initial data:', error.message);
    throw new Error(error.message);
  }
  return data as AuditData[];
}

export default function AuditReview() {
  const [data, setData] = useState<AuditData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const fetchedData = await fetchAuditData();
        console.log("Fetched data:", fetchedData); // Verify the fetched data
        setData(fetchedData);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setLoading(false);
      }
    };
  
    fetchData();
  
    const subscription = supabase
    .channel('custom-all-audits-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'Auditsinput' }, payload => {
      console.log('Real-time change received:', payload);
      if (payload.new) {
        setData(currentData => [
          ...currentData, 
          payload.new as AuditData // Assert that payload.new is of type AuditData
        ]);
      } else {
        fetchData(); // Refetch for other types of updates
      }
    })
    .subscribe();
    // Cleanup function for the useEffect
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);
  

  return (
    <div>
      <section>
        <div className="hidden h-full flex flex-col space-y-8 p-8 md:flex">
          <div className="flex items-center justify-between space-y-2">
            <div>
              <h2 className="text-2xl font-bold"><TextGenerateEffect words={words} /></h2>
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
