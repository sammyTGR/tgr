// src/app/TGR/rentals/checklist/page.tsx

"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { FirearmsMaintenanceData, columns } from "./columns";
import { DataTable } from "./data-table";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import { Toaster } from "sonner";

const words = "Firearms Checklist";

export default function FirearmsChecklist() {
  const [data, setData] = useState<FirearmsMaintenanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userUuid, setUserUuid] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 30;

  const fetchUserRoleAndUuid = useCallback(async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error("Error fetching user:", userError.message);
      return;
    }

    const user = userData.user;
    setUserUuid(user?.id || "");

    try {
      const { data: roleData, error: roleError } = await supabase
        .from("employees")
        .select("role")
        .eq("user_uuid", user?.id)
        .single();

      if (roleError || !roleData) {
        console.error(
          "Error fetching role:",
          roleError?.message || "No role found"
        );
        return;
      }

      setUserRole(roleData.role);
    } catch (error) {
      console.error("Unexpected error fetching role:", error);
    }
  }, []);

  useEffect(() => {
    fetchUserRoleAndUuid();
  }, [fetchUserRoleAndUuid]);

  const fetchFirearmsMaintenanceData = useCallback(async () => {
    const { data, error } = await supabase
      .from("firearms_maintenance")
      .select("*");

    if (error) {
      console.error("Error fetching initial data:", error.message);
      throw new Error(error.message);
    }

    return data;
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedData = await fetchFirearmsMaintenanceData();
      setData(fetchedData);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setLoading(false);
    }
  }, [fetchFirearmsMaintenanceData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = async (id: number, status: string | null) => {
    try {
      const { error } = await supabase
        .from("firearms_maintenance")
        .update({ status })
        .eq("id", id);

      if (error) {
        throw error;
      }

      setData((prevData) =>
        prevData.map((item) =>
          item.id === id
            ? { ...item, status: status !== null ? status : "" }
            : item
        )
      );
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleNotesChange = (id: number, notes: string) => {
    setData((prevData) =>
      prevData.map((item) =>
        item.id === id ? { ...item, notes } : item
      )
    );
  };

  useEffect(() => {
    const FirearmsMaintenanceTableSubscription = supabase
      .channel("custom-all-firearms-maintenance-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "firearms_maintenance" },
        (payload) => {
          setData((prevData) => {
            let updatedData = [...prevData];

            if (payload.eventType === "INSERT") {
              const exists = prevData.some(
                (item) => item.id === payload.new.id
              );
              if (!exists) {
                updatedData = [
                  payload.new as FirearmsMaintenanceData,
                  ...prevData,
                ];
              }
            } else if (payload.eventType === "UPDATE") {
              updatedData = prevData.map((item) =>
                item.id === payload.new.id
                  ? (payload.new as FirearmsMaintenanceData)
                  : item
              );
            } else if (payload.eventType === "DELETE") {
              updatedData = prevData.filter(
                (item) => item.id !== payload.old.id
              );
            }

            return updatedData;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(FirearmsMaintenanceTableSubscription);
    };
  }, []);

  return (
    <RoleBasedWrapper allowedRoles={["sales", "admin", "super admin"]}>
      <div className="h-screen flex flex-col">
        <Toaster position="top-right" />
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
              <div className="relative w-full h-full overflow-auto">
                {loading ? (
                  <p>Loading...</p>
                ) : (
                  userRole &&
                  userUuid && (
                    <>
                      <DataTable
                        columns={columns}
                        data={data}
                        userRole={userRole}
                        userUuid={userUuid}
                        onStatusChange={handleStatusChange}
                        onNotesChange={handleNotesChange}
                        pageIndex={pageIndex}
                        setPageIndex={setPageIndex}
                      />
                    </>
                  )
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </RoleBasedWrapper>
  );
}
