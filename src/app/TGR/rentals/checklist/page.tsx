"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { FirearmsMaintenanceData, columns } from "./columns";
import { DataTable } from "./data-table";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import { toast, Toaster } from "sonner";
import { Button } from "@/components/ui/button"; // Import the Button component

const words = "Firearms Checklist";

interface FirearmVerification {
  firearm_id: number;
  verified_by: string;
  verification_date: string;
  verification_time: string;
  serial_verified: boolean;
  condition_verified: boolean;
  magazine_attached: boolean;
  notes: string;
  created_at: string;
}

export default function FirearmsChecklist() {
  const [data, setData] = useState<FirearmsMaintenanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userUuid, setUserUuid] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null); // Add userName state

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
        .select("role, name") // Fetch role and name
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
      setUserName(roleData.name); // Set userName state
    } catch (error) {
      console.error("Unexpected error fetching role:", error);
    }
  }, []);

  useEffect(() => {
    fetchUserRoleAndUuid();
  }, [fetchUserRoleAndUuid]);

  const fetchFirearmsMaintenanceData = useCallback(async () => {
    const { data: firearmsData, error: firearmsError } = await supabase
      .from("firearms_maintenance")
      .select("*");

    if (firearmsError) {
      console.error("Error fetching initial data:", firearmsError.message);
      throw new Error(firearmsError.message);
    }

    const { data: verificationsData, error: verificationsError } =
      await supabase
        .from("firearm_verifications")
        .select("*")
        .eq("verification_date", new Date().toISOString().split("T")[0]);

    if (verificationsError) {
      console.error(
        "Error fetching verification data:",
        verificationsError.message
      );
      throw new Error(verificationsError.message);
    }

    const combinedData = firearmsData.map((firearm) => {
      const latestVerification = verificationsData
        .filter((verification) => verification.firearm_id === firearm.id)
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];

      return {
        ...firearm,
        notes: latestVerification ? latestVerification.notes : "",
        morning_checked: verificationsData.some(
          (verification) =>
            verification.firearm_id === firearm.id &&
            verification.verification_time === "morning"
        ),
        evening_checked: verificationsData.some(
          (verification) =>
            verification.firearm_id === firearm.id &&
            verification.verification_time === "evening"
        ),
      };
    });

    return combinedData;
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

  useEffect(() => {
    const channel = supabase
      .channel("custom-all-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "firearm_verifications" },
        (payload) => {
          const newVerification = payload.new as FirearmVerification;
          setData((prevData) =>
            prevData.map((item) =>
              item.id === newVerification.firearm_id
                ? {
                    ...item,
                    notes: newVerification.notes,
                    morning_checked:
                      newVerification.verification_time === "morning"
                        ? true
                        : item.morning_checked,
                    evening_checked:
                      newVerification.verification_time === "evening"
                        ? true
                        : item.evening_checked,
                  }
                : item
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleNotesChange = (id: number, notes: string) => {
    setData((prevData) =>
      prevData.map((item) => (item.id === id ? { ...item, notes } : item))
    );
  };

  const handleSubmitChecklist = async (shift: "morning" | "evening") => {
    const allVerified = data.every((item) =>
      shift === "morning" ? item.morning_checked : item.evening_checked
    );

    if (!allVerified) {
      toast(`Please verify all firearms for the ${shift} shift.`);
      return;
    }

    try {
      await supabase.from("checklist_submissions").insert({
        shift,
        submitted_by: userUuid,
        submitted_by_name: userName,
        submission_date: new Date().toISOString(),
      });
      toast(`Checklist for ${shift} shift submitted successfully.`);
    } catch (error) {
      console.error("Error submitting checklist:", error);
      toast("Failed to submit checklist.");
    }
  };

  return (
    <RoleBasedWrapper allowedRoles={["user", "admin", "super admin"]}>
      <div className="h-screen flex flex-col">
        <Toaster position="top-right" />
        <section className="flex-1 flex flex-col space-y-4 p-4">
          <div className="flex items-center justify-between space-y-2">
            <div>
              <h2 className="text-2xl font-bold">
                <TextGenerateEffect words={words} />
              </h2>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="linkHover1"
                onClick={() => handleSubmitChecklist("morning")}
              >
                Submit Morning Checklist
              </Button>
              <Button
                variant="linkHover1"
                onClick={() => handleSubmitChecklist("evening")}
              >
                Submit Evening Checklist
              </Button>
            </div>
          </div>
          <div className="flex-1 flex flex-col space-y-4">
            <div className="rounded-md border h-full flex-1 flex flex-col">
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
                        onNotesChange={handleNotesChange}
                        onVerificationComplete={() => Promise.resolve()} // Do nothing on verification complete
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
