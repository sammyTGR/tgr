"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import SubmitAuditForm from "./submit/form";
import SupportNavMenu from "@/components/ui/SupportNavMenu";
import { DataTable } from "@/components/ui/data-table";
import { AuditData, createColumns } from "./review/columns";
import { supabase } from "@/utils/supabase/client";
import { SubmitFormData } from "./submit/PopoverForm";

export default function AuditsPage() {
  const [activeTab, setActiveTab] = useState("submit");
  const [dataMap, setDataMap] = useState<Map<string, AuditData>>(new Map());
  const [loading, setLoading] = useState(true);

  const fetchAuditData = useCallback(async () => {
    const { data, error } = await supabase
      .from("Auditsinput")
      .select("*")
      .order("audit_date", { ascending: false });

    if (error) {
      console.error("Error fetching initial data:", error.message);
      throw new Error(error.message);
    }
    return new Map(data.map(item => [item.audits_id, item]));
  }, []);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedData = await fetchAuditData();
      setDataMap(fetchedData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchAuditData]);

  const columns = useMemo(() => createColumns(refreshData), [refreshData]);

  useEffect(() => {
    refreshData();

    const subscription = supabase
      .channel('Auditsinput_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'Auditsinput' 
        }, 
        (payload) => {
          console.log('Change received!', payload);
          setDataMap(currentMap => {
            const newMap = new Map(currentMap);
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              newMap.set(payload.new.audits_id, payload.new as AuditData);
            } else if (payload.eventType === 'DELETE') {
              newMap.delete(payload.old.audits_id);
            }
            return newMap;
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshData]);

  const data = useMemo(() => Array.from(dataMap.values()), [dataMap]);

  return (
    <RoleBasedWrapper allowedRoles={["auditor", "admin", "super admin"]}>
      <main className="grid flex-1 items-start my-4 mb-4 max-w-8xl gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <div className="mb-10 my-8">
        <SupportNavMenu />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center space-x-2">
            <TabsList>
              <TabsTrigger value="submit">Submit Audits</TabsTrigger>
              <TabsTrigger value="review">Review Audits</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="submit">
            <Card>
              <CardContent className="pt-6">
                <SubmitAuditForm onAuditSubmitted={refreshData} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="review">
            <Card>
              <CardContent className="pt-6">
                {loading ? (
                  <p>Loading...</p>
                ) : (
                  <DataTable columns={columns} data={data} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </RoleBasedWrapper>
  );
}