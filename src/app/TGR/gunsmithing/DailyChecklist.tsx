import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface DailyChecklistProps {
  userRole: string | null;
  userUuid: string | null;
  userName: string | null;
  onSubmit: () => void;
}

interface FirearmWithGunsmith {
  id: number;
  firearm_type: string;
  firearm_name: string;
  last_maintenance_date: string | null;
  maintenance_frequency: number | null;
  maintenance_notes: string | null;
  status: string | null;
  assigned_to: string | null;
  rental_notes: string | null;
  verified_status: string | null;
  admin_request?: string;
  admin_name?: string;
  admin_uuid?: string;
  gunsmith_response?: string;
  has_new_request?: boolean;
}

export default function DailyChecklist({
  userRole,
  userUuid,
  userName,
  onSubmit,
}: DailyChecklistProps) {
  const [firearms, setFirearms] = useState<FirearmWithGunsmith[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRequestId, setActiveRequestId] = useState<number | null>(null);
  const [activeResponseId, setActiveResponseId] = useState<number | null>(null);
  const [showOnlyPendingRequests, setShowOnlyPendingRequests] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<{
    [key: number]: string;
  }>({});
  const [editingRequestId, setEditingRequestId] = useState<number | null>(null);
  const [editingResponseId, setEditingResponseId] = useState<number | null>(
    null
  );

  const fetchFirearmsWithGunsmith = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("firearms_maintenance")
        .select("*")
        .eq("rental_notes", "With Gunsmith");
      if (error) throw error;
      setFirearms(
        data.map((firearm) => ({
          ...firearm,
          has_new_request: Boolean(
            firearm.admin_request && !firearm.gunsmith_response
          ),
        })) || []
      );
    } catch (error: unknown) {
      console.error("Error fetching firearms:", error);
      toast.error("Failed to fetch firearms");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFirearmsWithGunsmith();
  }, [fetchFirearmsWithGunsmith]);

  const handleNoteChange = (id: number, note: string) => {
    setFirearms(
      firearms.map((f) => (f.id === id ? { ...f, maintenance_notes: note } : f))
    );
  };

  const handleAdminRequestChange = (id: number, request: string) => {
    setPendingRequests({ ...pendingRequests, [id]: request });
  };

  const submitAdminRequest = async (id: number) => {
    try {
      const { data: employeeData, error: employeeError } = await supabase
        .from("employees")
        .select("name")
        .eq("user_uuid", userUuid)
        .single();

      if (employeeError) throw employeeError;

      const adminName = employeeData?.name;

      const { error } = await supabase
        .from("firearms_maintenance")
        .update({
          admin_request: pendingRequests[id],
          admin_name: adminName,
          admin_uuid: userUuid,
          gunsmith_response: null,
        })
        .eq("id", id);

      if (error) throw error;

      setFirearms(
        firearms.map((f) =>
          f.id === id
            ? {
                ...f,
                admin_request: pendingRequests[id],
                admin_name: adminName,
                has_new_request: true,
                gunsmith_response: undefined,
              }
            : f
        ) as FirearmWithGunsmith[]
      );
      delete pendingRequests[id];
      setPendingRequests({ ...pendingRequests });
      setEditingRequestId(null);
      toast.success("Request submitted successfully");
    } catch (error) {
      console.error("Error submitting request:", error);
      toast.error("Failed to submit request");
    }
  };

  const editAdminRequest = (id: number) => {
    const firearm = firearms.find((f) => f.id === id);
    if (firearm) {
      setPendingRequests({
        ...pendingRequests,
        [id]: firearm.admin_request || "",
      });
      setEditingRequestId(id);
    }
  };

  const handleGunsmithResponseChange = (id: number, response: string) => {
    setFirearms(
      firearms.map((f) =>
        f.id === id
          ? { ...f, gunsmith_response: response, has_new_request: false }
          : f
      )
    );
  };

  const submitGunsmithResponse = async (id: number) => {
    try {
      const firearm = firearms.find((f) => f.id === id);
      if (!firearm) throw new Error("Firearm not found");

      const { error } = await supabase
        .from("firearms_maintenance")
        .update({
          gunsmith_response: firearm.gunsmith_response,
        })
        .eq("id", id);

      if (error) throw error;

      setFirearms(
        firearms.map((f) =>
          f.id === id
            ? { ...f, gunsmith_response: firearm.gunsmith_response }
            : f
        )
      );
      setActiveResponseId(null);
      setEditingResponseId(null);
      toast.success("Response submitted successfully");
    } catch (error) {
      console.error("Error submitting response:", error);
      toast.error("Failed to submit response");
    }
  };

  const toggleEditResponse = (id: number) => {
    setEditingResponseId(editingResponseId === id ? null : id);
  };

  const handleSubmit = async () => {
    try {
      const updates = firearms.map(
        ({
          id,
          firearm_type,
          firearm_name,
          last_maintenance_date,
          maintenance_frequency,
          maintenance_notes,
          status,
          assigned_to,
          rental_notes,
          verified_status,
          admin_request,
          gunsmith_response,
          admin_name,
          admin_uuid,
        }) => ({
          id,
          firearm_type,
          firearm_name,
          last_maintenance_date: new Date().toISOString(),
          maintenance_frequency,
          maintenance_notes,
          status,
          assigned_to,
          rental_notes,
          verified_status,
          admin_request,
          gunsmith_response,
          admin_name,
          admin_uuid,
        })
      );

      const { error } = await supabase
        .from("firearms_maintenance")
        .upsert(updates, { onConflict: "id" });

      if (error) throw error;

      localStorage.setItem(
        "lastDailyChecklistSubmission",
        new Date().toDateString()
      );

      toast.success(
        "Daily maintenance notes and requests updated successfully"
      );
      await fetchFirearmsWithGunsmith();
      onSubmit();
    } catch (error) {
      console.error("Error in submission:", error);
      toast.error("Failed to update maintenance notes and requests");
    }
  };

  const filteredFirearms = showOnlyPendingRequests
    ? firearms.filter((f) => f.has_new_request)
    : firearms;

  if (loading) return <div>Loading...</div>;

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow">
        <h2 className="text-xl font-semibold mb-4">Firearms With Gunsmith</h2>
        <Button
          variant="gooeyLeft"
          onClick={() => setShowOnlyPendingRequests(!showOnlyPendingRequests)}
          className="mb-4"
        >
          {showOnlyPendingRequests
            ? "Show All Firearms"
            : "Show Only Pending Requests"}
        </Button>
        {filteredFirearms.length === 0 ? (
          <p>No firearms currently with gunsmith.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {filteredFirearms.map((firearm) => (
              <div key={firearm.id} className="border p-4 rounded-md">
                <h3 className="font-medium flex items-center">
                  {firearm.firearm_name} ({firearm.firearm_type})
                  {firearm.has_new_request && (
                    <Badge variant="destructive" className="ml-2">
                      New Status Update Request
                    </Badge>
                  )}
                </h3>
                <p>Status: {firearm.status || "N/A"}</p>
                <p>
                  Last Maintenance: {firearm.last_maintenance_date || "N/A"}
                </p>
                <Textarea
                  value={firearm.maintenance_notes || ""}
                  onChange={(e) => handleNoteChange(firearm.id, e.target.value)}
                  placeholder="Update daily note..."
                  className="mt-2"
                />
                {(userRole === "admin" || userRole === "super admin") && (
                  <>
                    {(!firearm.admin_request ||
                      firearm.admin_uuid === userUuid) && (
                      <Button
                        variant="outline"
                        onClick={() =>
                          editingRequestId === firearm.id
                            ? setEditingRequestId(null)
                            : editAdminRequest(firearm.id)
                        }
                        className="mt-2"
                      >
                        {editingRequestId === firearm.id
                          ? "Cancel Edit"
                          : firearm.admin_request
                          ? "Edit Request"
                          : "Make Request"}
                      </Button>
                    )}
                    {editingRequestId === firearm.id && (
                      <>
                        <Textarea
                          value={pendingRequests[firearm.id] || ""}
                          onChange={(e) =>
                            handleAdminRequestChange(firearm.id, e.target.value)
                          }
                          placeholder="Enter request or question..."
                          className="mt-2"
                        />
                        <Button
                          variant="outline"
                          onClick={() => submitAdminRequest(firearm.id)}
                          className="mt-2"
                          disabled={!pendingRequests[firearm.id]}
                        >
                          {firearm.admin_request
                            ? "Update Request"
                            : "Submit Request"}
                        </Button>
                      </>
                    )}
                  </>
                )}
                {firearm.admin_request && (
                  <div className="mt-6">
                    <p className="text-small font-small text-muted-foreground">
                      Status Update Request from{" "}
                      {firearm.admin_name || "Unknown"}:
                    </p>
                    <h3 className="text-large font-medium text-foreground mb-2">
                      {firearm.admin_request}
                    </h3>
                    <div className="mt-4">
                      <p className="text-small font-small text-muted-foreground">
                        Gunsmith Response:
                      </p>
                      {editingResponseId === firearm.id ? (
                        <>
                          <Textarea
                            value={firearm.gunsmith_response || ""}
                            onChange={(e) =>
                              handleGunsmithResponseChange(
                                firearm.id,
                                e.target.value
                              )
                            }
                            placeholder="Enter response to status update request..."
                            className="mt-2"
                          />
                          <Button
                            variant="outline"
                            onClick={() => submitGunsmithResponse(firearm.id)}
                            className="mt-2 mr-2"
                            disabled={!firearm.gunsmith_response}
                          >
                            Update Response
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => toggleEditResponse(firearm.id)}
                            className="mt-2"
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <p className="text-medium font-medium text-foreground">
                            {firearm.gunsmith_response || "No response yet."}
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => toggleEditResponse(firearm.id)}
                            className="mt-2"
                          >
                            {firearm.gunsmith_response
                              ? "Edit Response"
                              : "Add Response"}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-8">
        <Button
          variant="gooeyRight"
          onClick={handleSubmit}
          disabled={firearms.length === 0}
          className="w-full"
        >
          Submit Daily Checklist Firearms
        </Button>
      </div>
    </div>
  );
}
