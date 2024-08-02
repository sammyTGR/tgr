"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { FirearmsMaintenanceData, columns } from "./columns";
import { DataTable } from "./data-table";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import { Toaster, toast } from "sonner";
import { Button } from "@/components/ui/button";
import AddFirearmForm from "@/app/TGR/gunsmithing/AddFirearmForm";

const words = "Firearms Checklist";

interface FirearmVerification {
  firearm_id: number;
  firearm_name: string;
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
  const [userName, setUserName] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAnyFirearmRentedOut, setIsAnyFirearmRentedOut] = useState(false);

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
        .select("role, name")
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
      setUserName(roleData.name);
    } catch (error) {
      console.error("Unexpected error fetching role:", error);
    }
  }, []);

  useEffect(() => {
    fetchUserRoleAndUuid();
  }, [fetchUserRoleAndUuid]);

  const fetchFirearmsMaintenanceData = useCallback(async () => {
    const today = new Date().toISOString().split("T")[0];

    const { data: firearmsData, error: firearmsError } = await supabase
      .from("firearms_maintenance")
      .select("*");

    if (firearmsError) {
      console.error("Error fetching initial data:", firearmsError.message);
      throw new Error(firearmsError.message);
    }

    // Fetch all verifications
    const { data: verificationsData, error: verificationsError } =
      await supabase.from("firearm_verifications").select("*");

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

      const withGunsmith = latestVerification?.notes === "With Gunsmith";
      const currentlyRentedOut =
        latestVerification?.notes === "Currently Rented Out";

      return {
        ...firearm,
        notes: latestVerification ? latestVerification.notes : "",
        morning_checked:
          withGunsmith || currentlyRentedOut
            ? ""
            : verificationsData.some(
                (verification) =>
                  verification.firearm_id === firearm.id &&
                  verification.verification_time === "morning" &&
                  verification.verification_date === today
              ),
        evening_checked:
          withGunsmith || currentlyRentedOut
            ? ""
            : verificationsData.some(
                (verification) =>
                  verification.firearm_id === firearm.id &&
                  verification.verification_time === "evening" &&
                  verification.verification_date === today
              ),
        highlight: withGunsmith ? "amber" : currentlyRentedOut ? "red" : "",
      };
    });

    // Sort the data by type (handguns first) and then by firearm name
    combinedData.sort((a, b) => {
      if (a.firearm_type === b.firearm_type) {
        return a.firearm_name.localeCompare(b.firearm_name);
      }
      return a.firearm_type === "handgun" ? -1 : 1;
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

  useEffect(() => {
    const deleteChannel = supabase
      .channel("custom-delete-channel")
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "firearms_maintenance" },
        (payload) => {
          setData((prevData) =>
            prevData.filter((item) => item.id !== payload.old.id)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(deleteChannel);
    };
  }, []);

  const handleNotesChange = (id: number, notes: string) => {
    setData((prevData) =>
      prevData.map((item) => (item.id === id ? { ...item, notes } : item))
    );
  };

  const handleDeleteFirearm = async (id: number) => {
    try {
      // First, delete related records from firearm_verifications
      const { error: verificationsError } = await supabase
        .from("firearm_verifications")
        .delete()
        .eq("firearm_id", id);

      if (verificationsError) {
        throw verificationsError;
      }

      // Then, delete the firearm
      const { error: firearmError } = await supabase
        .from("firearms_maintenance")
        .delete()
        .eq("id", id);

      if (firearmError) {
        throw firearmError;
      }

      setData((prevData) => prevData.filter((item) => item.id !== id)); // Update the local state
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error deleting firearm:", error.message);
      } else {
        console.error(
          "An unknown error occurred while deleting firearm:",
          error
        );
      }
    }
  };

  const handleAddFirearm = async (newFirearm: {
    firearm_type: string;
    firearm_name: string;
    last_maintenance_date: string;
    maintenance_frequency: number;
    maintenance_notes: string;
    status: string;
    assigned_to: string | null;
  }) => {
    try {
      const { data: newFirearmData, error } = await supabase
        .from("firearms_maintenance")
        .insert([newFirearm])
        .select("*");

      if (error) {
        throw error;
      }

      if (newFirearmData && newFirearmData.length > 0) {
        setData((prevData) => [...prevData, newFirearmData[0]]);
      }

      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error adding firearm:", error);
    }
  };

  const handleSubmitChecklist = async (shift: "morning" | "evening") => {
    const today = new Date().toISOString().split("T")[0];

    // Check if a submission already exists for today and this shift
    const { data: existingSubmissions, error: existingSubmissionsError } =
      await supabase
        .from("checklist_submissions")
        .select("*")
        .eq("shift", shift)
        .eq("submission_date", today);

    if (existingSubmissionsError) {
      console.error(
        "Error checking for existing submissions:",
        existingSubmissionsError.message
      );
      toast.error("Failed to check for existing submissions.");
      return;
    }

    if (existingSubmissions.length > 0) {
      toast(
        `A checklist for the ${shift} shift has already been submitted today.`
      );
      return;
    }

    // Filter firearms with notes
    const firearmsWithNotes = data.filter((item) => item.notes);

    // Ensure no firearms are currently rented out
    const currentlyRentedOut = data.some(
      (item) => item.notes === "Currently Rented Out"
    );

    if (currentlyRentedOut) {
      toast("There's a firearm still rented out!");
      return;
    }

    // Ensure all required firearms are verified
    const allVerified = data.every(
      (item) => item.notes || item.morning_checked || item.evening_checked
    );

    if (!allVerified) {
      toast(`Please verify all firearms for the ${shift} shift.`);
      return;
    }

    try {
      // Insert the firearms with notes into the checklist_submissions table
      for (const firearm of firearmsWithNotes) {
        await supabase.from("checklist_submissions").insert({
          shift,
          submitted_by: userUuid,
          submitted_by_name: userName,
          submission_date: today,
          checklist_notes: firearm.notes,
          firearm_name: firearm.firearm_name,
        });
      }

      // Reset verifications for the current day
      const firearmsToReset = data.filter((item) => !item.notes);

      for (const firearm of firearmsToReset) {
        await supabase
          .from("firearm_verifications")
          .update({
            serial_verified: false,
            condition_verified: false,
            magazine_attached: false,
          })
          .eq("firearm_id", firearm.id)
          .eq("verification_date", today)
          .eq("verification_time", shift);
      }

      // Update in-memory state for firearms that need to be reset
      const updatedData = data.map((firearm) => {
        if (!firearm.notes) {
          return {
            ...firearm,
            morning_checked: false,
            evening_checked: false,
          };
        }
        return firearm;
      });

      setData(updatedData);
      toast.success(`Checklist for ${shift} shift submitted successfully.`);
    } catch (error) {
      console.error("Error submitting checklist:", error);
      toast.error("Failed to submit checklist.");
    }
  };

  return (
    <RoleBasedWrapper
      allowedRoles={["user", "auditor", "admin", "super admin"]}
    >
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
            {["admin", "super admin"].includes(userRole || "") && (
              <AddFirearmForm onAdd={handleAddFirearm} />
            )}
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
                        data={data.map((item) => ({
                          ...item,
                          highlight:
                            item.notes === "With Gunsmith"
                              ? "amber"
                              : item.notes === "Currently Rented Out"
                              ? "red"
                              : "",
                        }))}
                        userRole={userRole}
                        userUuid={userUuid}
                        onNotesChange={handleNotesChange}
                        onVerificationComplete={fetchData}
                        onDeleteFirearm={handleDeleteFirearm}
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
