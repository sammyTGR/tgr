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
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userUuid, setUserUuid] = useState<string | null>(null);

  const fetchUserRoleAndUuid = useCallback(async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error("Error fetching user:", userError.message);
      return;
    }

    const user = userData.user;
    setUserUuid(user?.id || "");

    const { data: roleData, error: roleError } = await supabase
      .from("employees")
      .select("role")
      .eq("user_uuid", user?.id)
      .single();

    if (roleError || !roleData) {
      const { data: customerData, error: customerError } = await supabase
        .from("profiles")
        .select("role")
        .eq("email", user?.email)
        .single();

      if (customerError || !customerData) {
        console.error(
          "Error fetching role:",
          roleError?.message || customerError?.message
        );
        return;
      }

      setUserRole(customerData.role);
    } else {
      setUserRole(roleData.role);
    }
  }, []);

  useEffect(() => {
    fetchUserRoleAndUuid();
  }, [fetchUserRoleAndUuid]);

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

  const handleStatusChange = (id: number, status: string | null) => {
    setData((prevData) =>
      prevData.map((item) =>
        item.id === id
          ? { ...item, status: status as string | undefined }
          : item
      )
    );
  };

  const handleNotesChange = (id: number, notes: string, userName: string) => {
    setData((prevData) =>
      prevData.map((item) =>
        item.id === id
          ? { ...item, repair_notes: notes, repair_notes_user: userName }
          : item
      )
    );
  };

  useEffect(() => {
    const RangeWalkTableSubscription = supabase
      .channel("custom-all-range-walk-reports-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "range_walk_reports" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setData((currentData) => [
              payload.new as RangeWalkData,
              ...currentData,
            ]);
          } else if (payload.eventType === "UPDATE") {
            setData((currentData) =>
              currentData.map((item) =>
                item.id === payload.new.id
                  ? (payload.new as RangeWalkData)
                  : item
              )
            );
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
    <RoleBasedWrapper
      allowedRoles={["user", "admin", "ceo", "super admin", "dev"]}
    >
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
              <div className="relative w-full h-full overflow-auto">
                {loading ? (
                  <p></p>
                ) : (
                  userRole &&
                  userUuid && (
                    <DataTable
                      columns={columns}
                      data={data}
                      userRole={userRole}
                      userUuid={userUuid}
                      onStatusChange={handleStatusChange}
                      onNotesChange={handleNotesChange}
                    />
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
