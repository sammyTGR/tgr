import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Pencil1Icon } from "@radix-ui/react-icons";
import { Pencil } from "lucide-react";

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
  id: number;
  message: string;
  timestamp: string;
  authorUuid: string;
  linkedInquiryId?: number | null; // Add this to link responses to inquiries
}

interface RequestResponsePair {
  request: RequestResponse;
  response: RequestResponse | null;
}

interface HoverStates {
  inquiryId: number | null;
  canEdit: boolean;
  type: "inquiry" | "response" | null;
}

interface CombinedMessage extends RequestResponse {
  type: "inquiry" | "response";
}

export default function DailyChecklist({
  userRole,
  userUuid,
  userName,
  onSubmit,
}: DailyChecklistProps) {
  const [selectedInquiryId, setSelectedInquiryId] = useState<number | null>(
    null
  );
  const [hoverStates, setHoverStates] = useState<HoverStates>({
    inquiryId: null,
    canEdit: false,
    type: null,
  });

  const [editingInquiryId, setEditingInquiryId] = useState<string | null>(null);
  const [editingInquiryText, setEditingInquiryText] = useState("");
  const [editingResponseText, setEditingResponseText] = useState("");
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
  const handleInquiryHover = (inquiryId: number, authorUuid: string) => {
    setHoverStates({
      inquiryId,
      canEdit: authorUuid === userUuid && userRole !== "gunsmith",
      type: "inquiry",
    });
  };

  const handleInquiryLeave = () => {
    if (!editingInquiryId) {
      setHoverStates({ inquiryId: null, canEdit: false, type: null });
    }
  };
  // Helper functions
  const startEditingInquiry = (inquiry: RequestResponse) => {
    setEditingInquiryId(inquiry.id.toString());
    setEditingInquiryText(inquiry.message);
    setHoverStates({ inquiryId: null, canEdit: false, type: null });
  };

  const startEditingResponse = (response: RequestResponse) => {
    setEditingResponseId(response.id);
    setEditingResponseText(response.message);
    setHoverStates({ inquiryId: null, canEdit: false, type: null });
  };

  const cancelEdit = (type: "inquiry" | "response") => {
    if (type === "inquiry") {
      setEditingInquiryId(null);
      setEditingInquiryText("");
    } else {
      setEditingResponseId(null);
      setEditingResponseText("");
    }
  };

  const handleHover = (
    id: number,
    authorUuid: string,
    type: "inquiry" | "response"
  ) => {
    const isAdmin = ["admin", "super admin", "dev"].includes(userRole || "");

    // For gunsmith: can edit responses (not inquiries)
    // For admin/dev: can edit their own inquiries
    const canEdit =
      (type === "response" &&
        userRole === "gunsmith" &&
        authorUuid === userUuid) ||
      (type === "inquiry" && isAdmin && authorUuid === userUuid);

    console.log({
      id,
      authorUuid,
      userUuid,
      type,
      userRole,
      isAdmin,
      canEdit,
    }); // Add this for debugging

    setHoverStates({
      inquiryId: id,
      canEdit,
      type,
    });
  };

  const handleLeave = () => {
    if (!editingInquiryId && !editingResponseId) {
      setHoverStates({ inquiryId: null, canEdit: false, type: null });
    }
  };

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
      ...requests.map((r) => ({ ...r, type: "inquiry" as const })),
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
      const responses = Array.isArray(parsed) ? parsed : [parsed];
      return responses.map((response) => ({
        ...response,
        id:
          typeof response.id === "number"
            ? response.id
            : Math.floor(Math.random() * 1000000), // Fallback to random number if not valid
        timestamp: response.timestamp || new Date().toISOString(),
        authorUuid: response.authorUuid || "Unknown",
        linkedInquiryId: response.linkedInquiryId || null,
      }));
    } catch {
      return [
        {
          id: Math.floor(Math.random() * 1000000),
          message: jsonString,
          timestamp: new Date().toISOString(),
          authorUuid: "Unknown",
          linkedInquiryId: undefined,
        },
      ];
    }
  };

  const fetchGunsmithEmail = async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("contact_info")
      .eq("role", "gunsmith")
      .single();

    if (error) {
      console.error("Error fetching gunsmith email:", error);
      return null;
    }

    return data?.contact_info || null;
  };

  const submitAdminRequest = async (id: number) => {
    try {
      const firearm = firearms.find((f) => f.id === id);
      if (!firearm) throw new Error("Firearm not found");
      const newInquiryObj: RequestResponse = {
        id: Number(crypto.randomUUID().replace(/-/g, "")), // Convert UUID to number
        message: newRequest,
        timestamp: new Date().toISOString(),
        authorUuid: userUuid || "Unknown",
      };

      const existingRequests = parseRequestResponses(
        firearm.admin_request || ""
      );
      const newRequestObj: RequestResponse = {
        id: Number(crypto.randomUUID().replace(/-/g, "")), // Convert UUID to number
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

      // Fetch gunsmith email
      const gunsmithEmail = await fetchGunsmithEmail();

      if (!gunsmithEmail) {
        throw new Error("Gunsmith email not found");
      }

      // Send email notification to gunsmith
      const response = await fetch("/api/send_email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: gunsmithEmail,
          subject: "Requesting Update",
          templateName: "GunsmithNewRequest",
          templateData: {
            firearmId: firearm.id,
            firearmName: firearm.firearm_name,
            requestedBy: userName || "Unknown",
            requestMessage: newRequest,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send email notification");
      }
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

  const submitGunsmithResponse = async (
    firearmId: number,
    inquiryId: number
  ) => {
    try {
      const firearm = firearms.find((f) => f.id === firearmId);
      if (!firearm) throw new Error("Firearm not found");

      const newResponseObj: RequestResponse = {
        id: Math.floor(Math.random() * 1000000), // Generate a random ID
        message: newResponse,
        timestamp: new Date().toISOString(),
        authorUuid: userUuid || "Unknown",
        linkedInquiryId: inquiryId,
      };

      const existingResponses = parseRequestResponses(
        firearm.gunsmith_response || ""
      );
      const updatedResponses = [...existingResponses, newResponseObj];

      const { error } = await supabase
        .from("firearms_maintenance")
        .update({
          gunsmith_response: JSON.stringify(updatedResponses),
          has_new_request: false,
        })
        .eq("id", firearmId);

      if (error) throw error;

      setFirearms(
        firearms.map((f) =>
          f.id === firearmId
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
      setSelectedInquiryId(null);
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

  const handleEditInquiry = async (
    firearmId: number,
    inquiryId: number,
    newText: string
  ) => {
    try {
      const firearm = firearms.find((f) => f.id === firearmId);
      if (!firearm) throw new Error("Firearm not found");

      const existingInquiries = parseRequestResponses(
        firearm.admin_request || ""
      );
      const updatedInquiries = existingInquiries.map((inquiry) =>
        inquiry.id === inquiryId ? { ...inquiry, message: newText } : inquiry
      );

      const { error } = await supabase
        .from("firearms_maintenance")
        .update({ admin_request: JSON.stringify(updatedInquiries) })
        .eq("id", firearmId);

      if (error) throw error;

      setFirearms(
        firearms.map((f) =>
          f.id === firearmId
            ? { ...f, admin_request: JSON.stringify(updatedInquiries) }
            : f
        )
      );
      setEditingInquiryId(null);
      setEditingInquiryText("");
      toast.success("Inquiry updated successfully");
    } catch (error) {
      console.error("Error updating inquiry:", error);
      toast.error("Failed to update inquiry");
    }
  };

  const handleEditResponse = async (
    firearmId: number,
    responseId: number,
    newText: string
  ) => {
    try {
      const firearm = firearms.find((f) => f.id === firearmId);
      if (!firearm) throw new Error("Firearm not found");

      const existingResponses = parseRequestResponses(
        firearm.gunsmith_response || ""
      );
      const updatedResponses = existingResponses.map((response) =>
        response.id === responseId
          ? { ...response, message: newText }
          : response
      );

      const { error } = await supabase
        .from("firearms_maintenance")
        .update({ gunsmith_response: JSON.stringify(updatedResponses) })
        .eq("id", firearmId);

      if (error) throw error;

      setFirearms(
        firearms.map((f) =>
          f.id === firearmId
            ? { ...f, gunsmith_response: JSON.stringify(updatedResponses) }
            : f
        )
      );
      setEditingResponseId(null);
      setEditingResponseText("");
      toast.success("Response updated successfully");
    } catch (error) {
      console.error("Error updating response:", error);
      toast.error("Failed to update response");
    }
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

  if (loading) return <div></div>;

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
                    const messagePairs: RequestResponsePair[] = requests.map(
                      (request, index) => ({
                        request,
                        response: responses[index] || null,
                      })
                    );

                    return messagePairs.map((pair, index) => (
                      <div
                        key={`pair-${index}`}
                        className="mt-4 p-4 rounded-lg bg-muted/30 border border-border/50"
                      >
                        {/* Inquiry section */}
                        <div className="relative group">
                          <div
                            className="p-2 -mx-2 rounded transition-colors hover:bg-muted/10"
                            onMouseEnter={() =>
                              handleHover(
                                pair.request.id,
                                pair.request.authorUuid,
                                "inquiry"
                              )
                            }
                            onMouseLeave={handleLeave}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span className="font-medium">
                                  Admin Inquiry
                                </span>
                                <span>
                                  ({getEmployeeName(pair.request.authorUuid)})
                                </span>
                                <span className="text-xs">
                                  {formatDate(pair.request.timestamp)}
                                </span>
                              </div>
                              {hoverStates.inquiryId === pair.request.id &&
                                hoverStates.type === "inquiry" &&
                                hoverStates.canEdit && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditingInquiryId(
                                        pair.request.id.toString()
                                      );
                                      setEditingInquiryText(
                                        pair.request.message
                                      );
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Pencil1Icon className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                )}
                            </div>

                            {editingInquiryId === pair.request.id.toString() ? (
                              <div className="mt-2">
                                <Textarea
                                  value={editingInquiryText}
                                  onChange={(e) =>
                                    setEditingInquiryText(e.target.value)
                                  }
                                  className="min-h-[100px]"
                                />
                                <div className="flex gap-2 mt-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleEditInquiry(
                                        firearm.id,
                                        pair.request.id,
                                        editingInquiryText
                                      )
                                    }
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingInquiryId(null)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <p className="mt-1 text-medium">
                                {pair.request.message}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Response section */}
                        <div className="mt-3">
                          {/* Gunsmith response button */}
                          {userRole === "gunsmith" &&
                            !responses.find(
                              (r) => r.linkedInquiryId === pair.request.id
                            ) && (
                              <div
                                className="relative p-2 -mx-2 rounded hover:bg-muted/10 transition-colors cursor-pointer"
                                onMouseEnter={() =>
                                  setSelectedInquiryId(pair.request.id)
                                }
                                onMouseLeave={() => {
                                  if (!activeResponseFirearmId) {
                                    setSelectedInquiryId(null);
                                  }
                                }}
                              >
                                <div className="absolute right-2 top-2 z-10">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-background"
                                    onClick={() => {
                                      setActiveResponseFirearmId(firearm.id);
                                      setSelectedInquiryId(pair.request.id);
                                    }}
                                  >
                                    Respond to Inquiry
                                  </Button>
                                </div>
                              </div>
                            )}

                          {/* Responses list */}
                          {responses
                            .filter(
                              (response) =>
                                response.linkedInquiryId === pair.request.id ||
                                !response.linkedInquiryId
                            )
                            .map((response, idx) => (
                              <div
                                key={`response-${idx}`}
                                className={`relative group mt-3 pl-4 border-l-2 ${
                                  response.linkedInquiryId === pair.request.id
                                    ? "border-blue-500"
                                    : "border-gray-300"
                                }`}
                                onMouseEnter={() =>
                                  handleHover(
                                    response.id,
                                    response.authorUuid,
                                    "response"
                                  )
                                }
                                onMouseLeave={handleLeave}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span className="font-medium">
                                      {response.linkedInquiryId ===
                                      pair.request.id
                                        ? "Direct Response"
                                        : "General Response"}
                                    </span>
                                    <span>
                                      ({getEmployeeName(response.authorUuid)})
                                    </span>
                                    <span className="text-xs">
                                      {formatDate(response.timestamp)}
                                    </span>
                                  </div>
                                  {hoverStates.inquiryId === response.id &&
                                    hoverStates.type === "response" &&
                                    hoverStates.canEdit && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setEditingResponseId(response.id);
                                          setEditingResponseText(
                                            response.message
                                          );
                                        }}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <Pencil1Icon className="h-4 w-4 mr-1" />
                                        Edit
                                      </Button>
                                    )}
                                </div>

                                {editingResponseId === response.id ? (
                                  <div className="mt-2">
                                    <Textarea
                                      value={editingResponseText}
                                      onChange={(e) =>
                                        setEditingResponseText(e.target.value)
                                      }
                                      className="min-h-[100px]"
                                    />
                                    <div className="flex gap-2 mt-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          handleEditResponse(
                                            firearm.id,
                                            response.id,
                                            editingResponseText
                                          )
                                        }
                                      >
                                        Save
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setEditingResponseId(null);
                                          setEditingResponseText("");
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="mt-1 text-medium">
                                    {response.message}
                                  </p>
                                )}
                              </div>
                            ))}

                          {/* Response Form */}
                          {activeResponseFirearmId === firearm.id &&
                            selectedInquiryId === pair.request.id && (
                              <div className="mt-2">
                                <Textarea
                                  value={newResponse}
                                  onChange={(e) =>
                                    setNewResponse(e.target.value)
                                  }
                                  placeholder="Enter response..."
                                  className="min-h-[100px]"
                                />
                                <div className="flex gap-2 mt-2">
                                  <Button
                                    variant="outline"
                                    onClick={() =>
                                      submitGunsmithResponse(
                                        firearm.id,
                                        pair.request.id
                                      )
                                    }
                                    disabled={!newResponse}
                                  >
                                    Submit
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    onClick={() => {
                                      setActiveResponseFirearmId(null);
                                      setSelectedInquiryId(null);
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            )}
                        </div>
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
                            placeholder="Enter new inquiry..."
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
                          New Inquiry
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
                              submitGunsmithResponse(
                                firearm.id,
                                selectedInquiryId!
                              );
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
