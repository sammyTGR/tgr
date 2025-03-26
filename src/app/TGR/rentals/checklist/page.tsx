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
import { ProgressBar } from "@/components/ProgressBar";
import { toZonedTime, format as formatTZ } from "date-fns-tz";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useSidebar } from "@/components/ui/sidebar";

const words = "Firearms Checklist";
const timeZone = "America/Los_Angeles";

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
  const { state } = useSidebar();
  const [data, setData] = useState<FirearmsMaintenanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userUuid, setUserUuid] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAnyFirearmRentedOut, setIsAnyFirearmRentedOut] = useState(false);
  const [submittingChecklist, setSubmittingChecklist] = useState(false);
  const [submittingBulkVerify, setSubmittingBulkVerify] = useState(false);

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

  const getHighlightColor = (notes: string) => {
    switch (notes) {
      case "With Gunsmith":
        return "amber";
      case "Currently Rented Out":
        return "red";
      case "Verified":
        return "green-600";
      case "Inspection Requested":
        return "blue-500";
      default:
        return "";
    }
  };

  useEffect(() => {
    let channel: RealtimeChannel;

    const setupRealtimeSubscription = async () => {
      channel = supabase
        .channel("firearms-maintenance-changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "firearms_maintenance" },
          (payload) => {
            const changedFirearm = payload.new as FirearmsMaintenanceData;
            setData((prevData) =>
              prevData.map((item) =>
                item.id === changedFirearm.id
                  ? {
                      ...item,
                      ...changedFirearm,
                      notes: changedFirearm.rental_notes || "", // Use rental_notes, fallback to empty string if null
                      highlight: getHighlightColor(
                        changedFirearm.rental_notes || ""
                      ),
                    }
                  : item
              )
            );
          }
        )
        .subscribe();
    };

    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const handleRequestInspection = async (id: number, notes: string) => {
    try {
      // Update the firearm's notes in the database
      const { error } = await supabase
        .from("firearms_maintenance")
        .update({
          rental_notes: "Inspection Requested",
          verified_status: "Inspection Requested",
        })
        .eq("id", id);

      if (error) throw error;

      // Update local state
      setData((prevData) =>
        prevData.map((item) =>
          item.id === id
            ? {
                ...item,
                notes: "Inspection Requested",
                verified_status: "Inspection Requested",
              }
            : item
        )
      );

      // Fetch gunsmith, admin, super admin, dev roles, and specific individuals
      const { data: employees, error: employeesError } = await supabase
        .from("employees")
        .select("contact_info, name, role")
        .or("role.in.(gunsmith),name.in.(Sammy, Russ, Slim Jim, Michelle)");

      if (employeesError) throw employeesError;

      const recipientEmails = employees.map((emp) => emp.contact_info);

      // Get the firearm name
      const firearm = data.find((item) => item.id === id);
      const firearmName = firearm ? firearm.firearm_name : "Unknown Firearm";

      // Send email using the API
      const response = await fetch("/api/send_email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: recipientEmails,
          subject: "Firearm Inspection Requested",
          templateName: "GunsmithInspection",
          templateData: {
            firearmId: id,
            firearmName: firearmName,
            requestedBy: userName || "Unknown User",
            notes: notes,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send email");
      }

      toast.success("Inspection request submitted successfully.");
    } catch (error) {
      console.error("Error requesting inspection:", error);
      toast.error("Failed to submit inspection request.");
    }
  };

  const fetchFirearmsMaintenanceData = useCallback(async () => {
    const today = new Date().toISOString().split("T")[0];

    const { data: firearmsData, error: firearmsError } = await supabase
      .from("firearms_maintenance")
      .select("*");

    if (firearmsError) {
      console.error("Error fetching initial data:", firearmsError.message);
      throw new Error(firearmsError.message);
    }

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

      const withGunsmith = firearm.rental_notes === "With Gunsmith";
      const currentlyRentedOut =
        firearm.rental_notes === "Currently Rented Out";
      const isVerifiedToday = latestVerification?.verification_date === today;
      const isVerified =
        latestVerification?.serial_verified &&
        latestVerification?.condition_verified &&
        latestVerification?.magazine_attached;

      return {
        ...firearm,
        notes: firearm.rental_notes,
        morning_checked:
          withGunsmith || currentlyRentedOut || !isVerifiedToday
            ? false
            : latestVerification.verification_time === "morning",
        evening_checked:
          withGunsmith || currentlyRentedOut || !isVerifiedToday
            ? false
            : latestVerification.verification_time === "evening",
        highlight: isVerified
          ? "text-green-600"
          : withGunsmith
            ? "text-amber"
            : currentlyRentedOut
              ? "text-red"
              : "",
      };
    });

    combinedData.sort((a, b) => {
      if (a.firearm_type === b.firearm_type) {
        return a.firearm_name.localeCompare(b.firearm_name);
      }
      return a.firearm_type === "handgun" ? -1 : 1;
    });

    return combinedData;
  }, []);

  const handleVerificationComplete = async (firearmId: number) => {
    try {
      // Update the rental_notes field in the database to "Verified"
      const { error } = await supabase
        .from("firearms_maintenance")
        .update({ rental_notes: "Verified", verified_status: "Verified" })
        .eq("id", firearmId);

      if (error) {
        console.error("Error updating rental_notes:", error.message);
        return;
      }

      // Update the local state to reflect the change
      setData((prevData) =>
        prevData.map((item) =>
          item.id === firearmId
            ? {
                ...item,
                notes: "Verified", // Set the notes to "Verified"
                highlight: "text-green-600", // Set highlight to green
                morning_checked: false,
                evening_checked: false,
              }
            : item
        )
      );
    } catch (error) {
      console.error("Error in handleVerificationComplete:", error);
    }
  };

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

  const handleSubmitChecklist = async () => {
    // Use toZonedTime and formatTZ to get the correct local date-time
    const now = new Date();
    const localTime = toZonedTime(now, timeZone);
    const today = formatTZ(localTime, "yyyy-MM-dd hh:mm:ss a", { timeZone });

    try {
      setSubmittingChecklist(true);

      // Step 1: Check if any firearms are still "Currently Rented Out"
      const firearmsRentedOut = data.some(
        (item) => item.notes === "Currently Rented Out"
      );

      if (firearmsRentedOut) {
        toast.error(
          "There are firearms still rented out. The checklist cannot be submitted until all firearms are returned and verified."
        );
        setSubmittingChecklist(false);
        return;
      }

      // Step 2: Check if all firearms are verified or with the gunsmith
      const allFirearmsHandled = data.every(
        (item) =>
          item.notes === "Verified" ||
          item.notes === "With Gunsmith" ||
          item.notes === "Inspection Requested"
      );

      if (!allFirearmsHandled) {
        toast.error(
          "Not all firearms are verified or with the gunsmith. The checklist cannot be submitted until all firearms are handled."
        );
        setSubmittingChecklist(false);
        return;
      }

      // Step 3: Filter firearms where rental_notes is "With Gunsmith" or "Inspection Requested" and verified_status is null or empty
      const firearmsToSubmit = data.filter(
        (item) =>
          ((!item.verified_status || item.verified_status.trim() === "") &&
            item.notes === "With Gunsmith") ||
          item.notes === "Inspection Requested"
      );

      if (firearmsToSubmit.length === 0) {
        toast.info("No firearms to submit; all are verified.");
        setSubmittingChecklist(false);
        return;
      }

      // Step 4: Submit only firearms that meet the criteria
      for (const firearm of firearmsToSubmit) {
        await supabase.from("checklist_submissions").insert({
          shift: "morning", // Adjust if necessary
          submitted_by: userUuid,
          submitted_by_name: userName,
          submission_date: today,
          checklist_notes: firearm.notes,
          firearm_name: firearm.firearm_name,
        });
      }

      // Step 5: Clear rental_notes and verified_status for all firearms marked as "Verified"
      const { error } = await supabase
        .from("firearms_maintenance")
        .update({ rental_notes: "", verified_status: "" })
        .in(
          "id",
          data
            .filter((item) => item.notes === "Verified")
            .map((item) => item.id)
        );

      if (error) {
        console.error("Error clearing fields:", error.message);
        toast.error("Failed to clear fields.");
        return;
      }

      // Step 6: Update local state to reflect the changes
      const updatedData = data.map((firearm) =>
        firearm.notes === "Verified"
          ? { ...firearm, notes: "", verified_status: "" }
          : firearm
      );

      setData(updatedData);
      toast.success("Checklist submitted successfully.");
    } catch (error) {
      console.error("Error submitting checklist:", error);
      toast.error("Failed to submit checklist.");
    } finally {
      setSubmittingChecklist(false);
    }
  };

  const bulkVerifyFirearms = async () => {
    setSubmittingBulkVerify(true); // Start showing the progress bar for bulk verification
    try {
      // Fetch all firearms data
      const { data: firearmsData, error: firearmsError } = await supabase
        .from("firearms_maintenance")
        .select("*");

      if (firearmsError) {
        console.error("Error fetching firearms data:", firearmsError.message);
        setSubmittingBulkVerify(false);
        return;
      }

      // Filter out firearms that are "With Gunsmith" or "Currently Rented Out"
      const firearmsToVerify = firearmsData.filter(
        (firearm) =>
          firearm.rental_notes !== "With Gunsmith" &&
          firearm.rental_notes !== "Currently Rented Out"
      );

      // Bulk verify each firearm
      for (const firearm of firearmsToVerify) {
        // Update the rental_notes to "Verified" and the verified_status to "Verified"
        const { error: maintenanceError } = await supabase
          .from("firearms_maintenance")
          .update({
            rental_notes: "Verified", // Ensure rental_notes is updated
            verified_status: "Verified", // Update the new verified_status column
          })
          .eq("id", firearm.id);

        if (maintenanceError) {
          console.error(
            `Error updating rental_notes for firearm ${firearm.firearm_name}:`,
            maintenanceError.message
          );
          continue;
        }

        // Update local state immediately to reflect the change
        setData((prevData) =>
          prevData.map((item) =>
            item.id === firearm.id
              ? {
                  ...item,
                  notes: "Verified", // Update the notes locally
                  verified_status: "Verified", // Update the verified_status locally
                }
              : item
          )
        );
      }

      toast.success("Bulk verification completed successfully!");
    } catch (error) {
      console.error("Error in bulkVerifyFirearms:", error);
      toast.error("Failed to complete bulk verification.");
    } finally {
      setSubmittingBulkVerify(false); // Stop showing the progress bar
    }
  };

  const handleEditFirearm = async (updatedFirearm: {
    id: number;
    firearm_type: string;
    firearm_name: string;
    maintenance_frequency: number | null;
  }) => {
    try {
      const { error } = await supabase
        .from("firearms_maintenance")
        .update({
          firearm_type: updatedFirearm.firearm_type,
          firearm_name: updatedFirearm.firearm_name,
          maintenance_frequency: updatedFirearm.maintenance_frequency,
        })
        .eq("id", updatedFirearm.id);

      if (error) {
        throw error;
      }

      // Update the local state
      setData((prevData) =>
        prevData.map((item) =>
          item.id === updatedFirearm.id ? { ...item, ...updatedFirearm } : item
        )
      );

      toast.success("Firearm updated successfully.");
    } catch (error) {
      console.error("Error updating firearm:", error);
      toast.error("Failed to update firearm.");
    }
  };

  return (
    <RoleBasedWrapper
      allowedRoles={["user", "auditor", "admin", "super admin", "dev"]}
    >
      <div
        className={`relative ${state === "collapsed" ? "w-[calc(100vw-40rem)]" : "w-[calc(100vw-40rem)]"} h-full overflow-hidden flex-1 transition-all duration-300`}
      >
        <Toaster position="top-right" />
        <section className="flex-1 flex flex-col space-y-4 p-4">
          <div>
            <h2 className="text-2xl font-bold">
              <TextGenerateEffect words={words} />
            </h2>
          </div>
          <div className="flex items-center space-y-2">
            <div className="flex space-x-2">
              <Button
                variant="gooeyRight"
                onClick={handleSubmitChecklist}
                disabled={submittingChecklist} // Disable the button while submitting
              >
                {submittingChecklist
                  ? "Submitting Checklist..."
                  : "Submit Checklist"}
              </Button>

              {submittingChecklist && (
                <ProgressBar
                  value={100}
                  showAnimation={true}
                  className="w-full mt-2" // Add some margin-top for spacing
                />
              )}

              {["admin", "super admin", "dev"].includes(userRole || "") && (
                <AddFirearmForm onAdd={handleAddFirearm} />
              )}
              {["super admin", "dev"].includes(userRole || "") && (
                <>
                  <Button
                    variant="linkHover1"
                    onClick={bulkVerifyFirearms}
                    disabled={submittingBulkVerify} // Disable the button while submitting
                  >
                    {submittingBulkVerify
                      ? "Bulk Verifying Firearms..."
                      : "Bulk Verify"}
                  </Button>

                  {submittingBulkVerify && (
                    <ProgressBar
                      value={100}
                      showAnimation={true}
                      className="w-full mt-2" // Add some margin-top for spacing
                    />
                  )}
                </>
              )}
            </div>
          </div>
          <div className="flex-1 flex flex-col space-y-4">
            <div className="rounded-md border h-full flex-1 flex flex-col">
              <div className="relative w-full h-full overflow-auto">
                {loading ? (
                  <p></p>
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
                                : item.notes === "Verified"
                                  ? "green-600"
                                  : "", // Ensure this handles the empty string correctly
                        }))}
                        userRole={userRole}
                        userUuid={userUuid}
                        onNotesChange={handleNotesChange}
                        onVerificationComplete={fetchData}
                        onDeleteFirearm={handleDeleteFirearm}
                        onEditFirearm={handleEditFirearm}
                        onRequestInspection={handleRequestInspection}
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
