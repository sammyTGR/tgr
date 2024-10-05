import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

interface Employee {
  user_uuid: string;
  name: string;
}

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
  has_new_request: boolean; // Client-side property
}

interface RequestResponse {
  message: string;
  timestamp: string;
  authorUuid: string;
}

interface CombinedMessage extends RequestResponse {
  type: "request" | "response";
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
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [newRequest, setNewRequest] = useState<string>("");
  const [newResponse, setNewResponse] = useState<string>("");
  const [activeRequestFirearmId, setActiveRequestFirearmId] = useState<
    number | null
  >(null);
  const [activeResponseFirearmId, setActiveResponseFirearmId] = useState<
    number | null
  >(null);

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("user_uuid, name");
      if (error) throw error;
      return data;
    },
  });

  const getEmployeeName = useCallback(
    (uuid: string | null | undefined) => {
      if (!uuid) return "Unknown";
      const employee = employees?.find((e) => e.user_uuid === uuid);
      return employee?.name || "Unknown";
    },
    [employees]
  );

  const formatDate = (dateString: string) => {
    if (dateString === "Unknown") return "Unknown Date";
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? "Invalid Date"
      : date.toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  };

  const combineAndSortMessages = (
    requests: RequestResponse[],
    responses: RequestResponse[]
  ): CombinedMessage[] => {
    const combined = [
      ...requests.map((r) => ({ ...r, type: "request" as const })),
      ...responses.map((r) => ({ ...r, type: "response" as const })),
    ];
    return combined.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  };

  const fetchFirearmsWithGunsmith = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("firearms_maintenance")
        .select("*")
        .eq("rental_notes", "With Gunsmith");
      if (error) throw error;
      setFirearms(
        data.map((firearm) => {
          const adminRequests = parseRequestResponses(firearm.admin_request);
          const gunsmithResponses = parseRequestResponses(
            firearm.gunsmith_response
          );
          const hasNewRequest = adminRequests.length > gunsmithResponses.length;
          return {
            ...firearm,
            has_new_request: hasNewRequest,
          };
        }) || []
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

  const parseRequestResponses = (
    jsonString: string | null
  ): RequestResponse[] => {
    if (!jsonString) return [];
    try {
      const parsed = JSON.parse(jsonString);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      // If parsing fails, assume it's an old format string message
      return [
        {
          message: jsonString,
          timestamp: "Unknown",
          authorUuid: "Unknown",
        },
      ];
    }
  };

  const submitAdminRequest = async (id: number) => {
    try {
      const firearm = firearms.find((f) => f.id === id);
      if (!firearm) throw new Error("Firearm not found");

      const existingRequests = parseRequestResponses(
        firearm.admin_request || ""
      );
      const newRequestObj: RequestResponse = {
        message: newRequest,
        timestamp: new Date().toISOString(),
        authorUuid: userUuid || "Unknown",
      };
      const updatedRequests = [...existingRequests, newRequestObj];

      const { error } = await supabase
        .from("firearms_maintenance")
        .update({
          admin_request: JSON.stringify(updatedRequests),
          admin_name: userName,
          admin_uuid: userUuid,
        })
        .eq("id", id);

      if (error) throw error;

      setFirearms(
        firearms.map((f) =>
          f.id === id
            ? {
                ...f,
                admin_request: JSON.stringify(updatedRequests),
                has_new_request: true,
              }
            : f
        )
      );
      setNewRequest("");
      setActiveRequestFirearmId(null);
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

      const existingResponses = parseRequestResponses(
        firearm.gunsmith_response || ""
      );
      const newResponseObj: RequestResponse = {
        message: newResponse,
        timestamp: new Date().toISOString(),
        authorUuid: userUuid || "Unknown",
      };
      const updatedResponses = [...existingResponses, newResponseObj];

      const { error } = await supabase
        .from("firearms_maintenance")
        .update({
          gunsmith_response: JSON.stringify(updatedResponses),
          has_new_request: false,
        })
        .eq("id", id);

      if (error) throw error;

      setFirearms(
        firearms.map((f) =>
          f.id === id
            ? {
                ...f,
                gunsmith_response: JSON.stringify(updatedResponses),
                has_new_request: false,
              }
            : f
        )
      );
      setNewResponse("");
      setActiveResponseFirearmId(null);
      toast.success("Response submitted successfully");
    } catch (error) {
      console.error("Error submitting response:", error);
      toast.error("Failed to submit response");
    }
  };

  const toggleEditResponse = (id: number) => {
    setEditingResponseId(editingResponseId === id ? null : id);
  };

  const toggleEditNote = (id: number) => {
    setEditingNoteId(editingNoteId === id ? null : id);
  };

  const handleSubmit = async () => {
    try {
      const updates = firearms.map((firearm) => {
        const { has_new_request, ...firearmData } = firearm;
        return {
          ...firearmData,
          last_maintenance_date: new Date().toISOString(),
        };
      });

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
                <div className="mt-2">
                  <p className="text-small font-small text-muted-foreground">
                    Maintenance Notes:
                  </p>
                  {editingNoteId === firearm.id ? (
                    <>
                      <Textarea
                        value={firearm.maintenance_notes || ""}
                        onChange={(e) =>
                          handleNoteChange(firearm.id, e.target.value)
                        }
                        placeholder="Update daily note..."
                        className="mt-2"
                      />
                      <div className="mt-2 space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => toggleEditNote(firearm.id)}
                          className="mt-2"
                        >
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            // Reset the note to its original value
                            handleNoteChange(
                              firearm.id,
                              firearm.maintenance_notes || ""
                            );
                            toggleEditNote(firearm.id);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-medium font-medium text-foreground">
                        {firearm.maintenance_notes || "No maintenance notes."}
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => toggleEditNote(firearm.id)}
                        className="mt-2"
                      >
                        Edit Note
                      </Button>
                    </>
                  )}
                </div>
                <div className="mt-6">
                  <h4 className="font-medium">Requests and Responses:</h4>
                  {(() => {
                    const requests = parseRequestResponses(
                      firearm.admin_request || ""
                    );
                    const responses = parseRequestResponses(
                      firearm.gunsmith_response || ""
                    );
                    const combinedMessages = combineAndSortMessages(
                      requests,
                      responses
                    );

                    return combinedMessages.map((message, index) => (
                      <div key={`message-${index}`} className="mt-2">
                        <p className="text-sm text-muted-foreground">
                          {message.type === "request"
                            ? "Admin Request"
                            : "Gunsmith Response"}{" "}
                          ({getEmployeeName(message.authorUuid)}) -{" "}
                          {formatDate(message.timestamp)}:
                        </p>
                        <p className="text-medium font-medium">
                          {message.message}
                        </p>
                      </div>
                    ));
                  })()}
                  {/* New Request Button (for admin and super admin) */}
                  {(userRole === "admin" ||
                    userRole === "super admin" ||
                    userRole === "dev") && (
                    <div className="mt-4">
                      {activeRequestFirearmId === firearm.id ? (
                        <>
                          <Textarea
                            value={newRequest}
                            onChange={(e) => setNewRequest(e.target.value)}
                            placeholder="Enter new request..."
                            className="mt-2"
                          />
                          <Button
                            variant="outline"
                            onClick={() => {
                              submitAdminRequest(firearm.id);
                              setActiveRequestFirearmId(null);
                            }}
                            className="mt-2 mr-2"
                            disabled={!newRequest}
                          >
                            Submit Request
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setActiveRequestFirearmId(null)}
                            className="mt-2"
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => setActiveRequestFirearmId(firearm.id)}
                          className="mt-2"
                        >
                          New Request
                        </Button>
                      )}
                    </div>
                  )}
                  {/* New Response Button (only for gunsmith role) */}
                  {userRole === "gunsmith" && (
                    <div className="mt-4">
                      {activeResponseFirearmId === firearm.id ? (
                        <>
                          <Textarea
                            value={newResponse}
                            onChange={(e) => setNewResponse(e.target.value)}
                            placeholder="Enter new response..."
                            className="mt-2"
                          />
                          <Button
                            variant="outline"
                            onClick={() => {
                              submitGunsmithResponse(firearm.id);
                              setActiveResponseFirearmId(null);
                            }}
                            className="mt-2 mr-2"
                            disabled={!newResponse}
                          >
                            Submit Response
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setActiveResponseFirearmId(null)}
                            className="mt-2"
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => setActiveResponseFirearmId(firearm.id)}
                          className="mt-2"
                        >
                          New Response
                        </Button>
                      )}
                    </div>
                  )}
                </div>
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
