"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation"; // Correct import
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Pencil1Icon, TrashIcon } from "@radix-ui/react-icons";
import { supabase } from "@/utils/supabase/client";
import { useRole } from "@/context/RoleContext";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import Link from "next/link";
import { CustomCalendar } from "@/components/ui/calendar";
import { DataTable } from "../../../audits/contest/data-table";
import { RenderDropdown } from "../../../audits/contest/dropdown";
import { PostgrestSingleResponse } from "@supabase/supabase-js";

interface Note {
  id: number;
  profile_employee_id: number;
  employee_id: number;
  note: string;
  type: string;
  created_at: string;
  created_by: string;
  reviewed?: boolean;
  reviewed_by?: string;
  reviewed_at?: string;
}

interface Absence {
  schedule_date: string;
  status: string;
}

interface Audit {
  dros_number: string;
  salesreps: string;
  audit_type: string;
  trans_date: string;
  audit_date: string;
  error_location: string;
  error_details: string;
  error_notes: string;
  dros_cancel: string;
}

interface Employee {
  lanid: string;
}

interface SalesData {
  id: number;
  Lanid: string;
  subcategory_label: string;
  dros_cancel: string | null;
  // other fields
}

interface AuditInput {
  id: string;
  salesreps: string;
  error_location: string;
  audit_date: string; // Ensure this is included
  dros_cancel: string | null;
  // other fields
}

interface PointsCalculation {
  category: string;
  error_location: string;
  points_deducted: number;
}

const EmployeeProfile = () => {
  const params = useParams()!;
  const employeeIdParam = params.employeeId;

  const employeeId = Array.isArray(employeeIdParam)
    ? parseInt(employeeIdParam[0], 10)
    : parseInt(employeeIdParam, 10);

  const [activeTab, setActiveTab] = useState("daily_briefing");
  const [notes, setNotes] = useState<Note[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [newNote, setNewNote] = useState("");
  const [newReview, setNewReview] = useState("");
  const [newAbsence, setNewAbsence] = useState("");
  const [newGrowth, setNewGrowth] = useState("");
  const [newDailyBriefing, setNewDailyBriefing] = useState("");
  const [employee, setEmployee] = useState<any>(null);
  const { user } = useRole();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedLanid, setSelectedLanid] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<Date | undefined>(
    undefined
  );
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [auditData, setAuditData] = useState<AuditInput[]>([]);
  const [pointsCalculation, setPointsCalculation] = useState<
    PointsCalculation[]
  >([]);
  const [totalPoints, setTotalPoints] = useState<number>(300);
  const [summaryData, setSummaryData] = useState<any[]>([]);
  const [showAllEmployees, setShowAllEmployees] = useState<boolean>(false);

  useEffect(() => {
    if (user && employeeId) {
      fetchEmployeeData();
      fetchNotes();
      fetchAbsences();
      subscribeToNoteChanges();
    }
  }, [user, employeeId]);

  useEffect(() => {
    if (employee && employee.lanid) {
      fetchAudits(employee.lanid);
    }
  }, [employee]);

  useEffect(() => {
    const fetchEmployeeName = async (user_uuid: string): Promise<string | null> => {
      const { data, error } = await supabase
        .from("employees")
        .select("name")
        .eq("user_uuid", user_uuid)
        .single();
    
      if (error) {
        console.error("Error fetching employee name:", error);
        return null;
      }
      return data?.name || null;
    };
    
  
    const fetchPointsCalculation = async () => {
      const { data, error } = await supabase
        .from("points_calculation")
        .select("*");
      if (error) {
        console.error(error);
      } else {
        setPointsCalculation(data);
      }
    };
  
    fetchPointsCalculation();
  }, []);
  

  useEffect(() => {
    const fetchData = async () => {
      if (selectedMonth && employee) {
        const startDate = new Date(
          selectedMonth.getFullYear(),
          selectedMonth.getMonth(),
          1
        )
          .toISOString()
          .split("T")[0];
        const endDate = new Date(
          selectedMonth.getFullYear(),
          selectedMonth.getMonth() + 1,
          0
        )
          .toISOString()
          .split("T")[0];

        const { data: salesData, error: salesError } = await supabase
          .from("sales_data")
          .select("*")
          .eq("Lanid", employee.lanid)
          .gte("Date", startDate)
          .lte("Date", endDate)
          .not("subcategory_label", "is", null)
          .not("subcategory_label", "eq", "");

        const { data: auditData, error: auditError } = await supabase
          .from("Auditsinput")
          .select("*")
          .eq("salesreps", employee.lanid)
          .gte("audit_date", startDate)
          .lte("audit_date", endDate);

        if (salesError || auditError) {
          console.error(salesError || auditError);
        } else {
          setSalesData(salesData);
          setAuditData(auditData);
          calculateSummary(salesData, auditData, selectedMonth, [
            employee.lanid,
          ]);
        }
      }
    };

    fetchData();

    const salesSubscription = supabase
      .channel("custom-all-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sales_data" },
        (payload) => {
          fetchData();
        }
      )
      .subscribe();

    const auditsSubscription = supabase
      .channel("custom-all-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Auditsinput" },
        (payload) => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(salesSubscription);
      supabase.removeChannel(auditsSubscription);
    };
  }, [employee, selectedMonth, pointsCalculation]);

  const fetchEmployeeData = async () => {
    if (!employeeId) return;

    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("employee_id", employeeId)
      .single();

    if (error) {
      console.error("Error fetching employee data:", error.message);
    } else {
      setEmployee(data);
    }
  };

  const fetchEmployeeName = async (user_uuid: string): Promise<string | null> => {
    const { data, error } = await supabase
      .from("employees")
      .select("name")
      .eq("user_uuid", user_uuid)
      .single();
  
    if (error) {
      console.error("Error fetching employee name:", error);
      return null;
    }
    return data?.name || null;
  };  

  const fetchNotes = async () => {
    if (!employeeId) return;

    const { data, error } = await supabase
      .from("employee_profile_notes")
      .select("*")
      .eq("profile_employee_id", employeeId);

    if (error) {
      console.error("Error fetching notes:", error);
    } else {
      setNotes(data as Note[]);
    }
  };

  const fetchAbsences = async () => {
    if (!employeeId) return;

    const { data, error } = await supabase
      .from("schedules")
      .select("schedule_date, status")
      .eq("employee_id", employeeId)
      .or("status.eq.called_out,status.eq.left_early,status.ilike.%late%");

    if (error) {
      console.error("Error fetching absences:", error);
    } else {
      const formattedAbsences = data.map((absence) => {
        let status = absence.status;
        if (status === "called_out") {
          status = "Called Out";
        } else if (status === "left_early") {
          status = "Left Early";
        } else if (status.toLowerCase().includes("late")) {
          status = status.replace(/^Custom:\s*/i, "").trim();
        }
        return {
          schedule_date: absence.schedule_date,
          status: status,
        };
      });
      setAbsences(formattedAbsences);
    }
  };

  const fetchAudits = async (lanid: string) => {
    const { data, error } = await supabase
      .from("Auditsinput")
      .select("*")
      .eq("salesreps", lanid)
      .order("audit_date", { ascending: false });

    if (error) {
      console.error("Error fetching audits:", error);
    } else {
      setAudits(data as Audit[]);
    }
  };

  const subscribeToNoteChanges = () => {
    if (!employeeId) return;

    const channel = supabase
      .channel("custom-all-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employee_profile_notes" },
        (payload) => {
          if (payload.new) {
            setNotes((prevNotes) => [...prevNotes, payload.new as Note]);
          } else if (payload.old) {
            setNotes((prevNotes) =>
              prevNotes.filter((note) => note.id !== (payload.old as Note).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleAddNote = async (type: string) => {
    let noteContent = "";
    switch (type) {
      case "notes":
        noteContent = newNote;
        break;
      case "reviews":
        noteContent = newReview;
        break;
      case "growth":
        noteContent = newGrowth;
        break;
      case "absence":
        noteContent = newAbsence;
        break;
      case "daily_briefing":
        noteContent = newDailyBriefing;
        break;
      default:
        return;
    }
  
    if (!employeeId || noteContent.trim() === "") return;
  
    const employeeName = await fetchEmployeeName(user.id);
    if (!employeeName) return;
  
    const { data, error } = await supabase
      .from("employee_profile_notes")
      .insert([
        {
          profile_employee_id: employeeId,
          employee_id: parseInt(user.id, 10),
          note: noteContent,
          type,
          created_by: employeeName,
        },
      ])
      .select();
  
    if (error) {
      console.error("Error adding note:", error);
    } else if (data) {
      setNotes((prevNotes) => [data[0], ...prevNotes]);
      switch (type) {
        case "notes":
          setNewNote("");
          break;
        case "reviews":
          setNewReview("");
          break;
        case "growth":
          setNewGrowth("");
          break;
        case "absence":
          setNewAbsence("");
          break;
        case "daily_briefing":
          setNewDailyBriefing("");
          break;
      }
    }
  };
  
  const handleDeleteNote = async (id: number) => {
    const { error } = await supabase
      .from("employee_profile_notes")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting note:", error);
    } else {
      setNotes(notes.filter((note) => note.id !== id));
    }
  };

  const handleEditNote = async (id: number, updatedNote: string | null) => {
    if (updatedNote === null || updatedNote.trim() === "") return;

    const { error } = await supabase
      .from("employee_profile_notes")
      .update({ note: updatedNote })
      .eq("id", id);

    if (error) {
      console.error("Error updating note:", error);
    } else {
      setNotes(
        notes.map((note) =>
          note.id === id ? { ...note, note: updatedNote } : note
        )
      );
    }
  };

  const handleReviewNote = async (id: number, currentReviewedStatus: boolean) => {
    const newReviewedStatus = !currentReviewedStatus;
  
    const { error } = await supabase
      .from("employee_profile_notes")
      .update({
        reviewed: newReviewedStatus,
        reviewed_by: newReviewedStatus ? user.name : null,
        reviewed_at: newReviewedStatus ? new Date().toISOString() : null,
      })
      .eq("id", id);
  
    if (error) {
      console.error("Error reviewing note:", error);
    } else {
      setNotes(
        notes.map((note) =>
          note.id === id
            ? {
                ...note,
                reviewed: newReviewedStatus,
                reviewed_by: newReviewedStatus ? user.name : null,
                reviewed_at: newReviewedStatus ? new Date().toISOString() : undefined,
              }
            : note
        )
      );
    }
  };
  

  const calculateSummary = (
    salesData: SalesData[],
    auditData: AuditInput[],
    selectedMonth: Date,
    lanids: string[]
  ) => {
    let summary = lanids.map((lanid) => {
      const employeeSalesData = salesData.filter(
        (sale) => sale.Lanid === lanid
      );
      const employeeAuditData = auditData.filter(
        (audit) => audit.salesreps === lanid
      );

      const totalDros = employeeSalesData.filter(
        (sale) => sale.subcategory_label
      ).length;
      let pointsDeducted = 0;

      employeeSalesData.forEach((sale: SalesData) => {
        if (sale.dros_cancel === "Yes") {
          pointsDeducted += 5;
        }
      });

      employeeAuditData.forEach((audit: AuditInput) => {
        const auditDate = new Date(audit.audit_date);
        if (auditDate <= selectedMonth) {
          pointsCalculation.forEach((point: PointsCalculation) => {
            if (audit.error_location === point.error_location) {
              pointsDeducted += point.points_deducted;
            } else if (
              point.error_location === "dros_cancel_field" &&
              audit.dros_cancel === "Yes"
            ) {
              pointsDeducted += point.points_deducted;
            }
          });
        }
      });

      const totalPoints = 300 - pointsDeducted;

      return {
        Lanid: lanid,
        TotalDros: totalDros,
        PointsDeducted: pointsDeducted,
        TotalPoints: totalPoints,
      };
    });

    summary.sort((a, b) => b.TotalPoints - a.TotalPoints);
    setSummaryData(summary);
  };

  if (!employee) return <div>Loading...</div>;

  return (
    <RoleBasedWrapper allowedRoles={["admin", "super admin"]}>
      <div className="section w-full">
        <Card className="h-full max-w-8xl mx-auto my-12">
          <header className="bg-gray-100 dark:bg-muted px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <Avatar>
                <img
                  src={employee.avatar_url || "/Banner.png"}
                  alt="Employee Avatar"
                />
                <AvatarFallback>{employee.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-bold">{employee.name}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {employee.position}
                </p>
              </div>
              <div className="flex ml-auto">
                <Link href="/admin/dashboard">
                  <Button variant="linkHover1">Back To Profiles</Button>
                </Link>
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-auto">
            <Tabs
              defaultValue="daily_briefing"
              className="w-full"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList className="border-b border-gray-200 dark:border-gray-700">
                <TabsTrigger value="daily_briefing">Daily Briefing</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="absences">Absences</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="growth">Growth Tracking</TabsTrigger>
                <TabsTrigger value="audits">Audits</TabsTrigger>
                <TabsTrigger value="performance">
                  Monthly Performance
                </TabsTrigger>
              </TabsList>
              <TabsContent value="daily_briefing">
  <div className="p-6 space-y-4">
    <div className="grid gap-1.5">
      <Label htmlFor="new-daily-briefing">Add a new daily briefing</Label>
      <Textarea
        id="new-daily-briefing"
        value={newDailyBriefing}
        onChange={(e) => setNewDailyBriefing(e.target.value)}
        placeholder="Type your daily briefing here..."
        className="min-h-[100px]"
      />
      <Button onClick={() => handleAddNote("daily_briefing")}>
        Add Daily Briefing
      </Button>
    </div>
    <div className="grid gap-4">
      {notes
        .filter((note) => note.type === "daily_briefing" && !note.reviewed)
        .map((note) => (
          <div key={note.id} className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={note.reviewed || false}
                onChange={() => handleReviewNote(note.id, note.reviewed || false)}
              />
              <div>
                <div
                  className="text-sm font-medium"
                  style={{
                    textDecoration: note.reviewed ? "line-through" : "none",
                  }}
                >
                  {note.note}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  - {note.created_by} on{" "}
                  {new Date(note.created_at).toLocaleDateString()}
                </div>
                {note.reviewed && note.reviewed_by && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Reviewed by {note.reviewed_by} on{" "}
                    {note.reviewed_at
                      ? new Date(note.reviewed_at).toLocaleDateString()
                      : ""}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  handleEditNote(
                    note.id,
                    prompt("Edit daily briefing:", note.note) ?? note.note
                  )
                }
              >
                <Pencil1Icon />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleDeleteNote(note.id)}
              >
                <TrashIcon />
              </Button>
            </div>
          </div>
        ))}
      {notes
        .filter((note) => note.type === "daily_briefing" && note.reviewed)
        .map((note) => (
          <div key={note.id} className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={note.reviewed || false}
                onChange={() => handleReviewNote(note.id, note.reviewed || false)}
              />
              <div>
                <div
                  className="text-sm font-medium"
                  style={{
                    textDecoration: note.reviewed ? "line-through" : "none",
                  }}
                >
                  {note.note}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  - {note.created_by} on{" "}
                  {new Date(note.created_at).toLocaleDateString()}
                </div>
                {note.reviewed && note.reviewed_by && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Reviewed by {note.reviewed_by} on{" "}
                    {note.reviewed_at
                      ? new Date(note.reviewed_at).toLocaleDateString()
                      : ""}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  handleEditNote(
                    note.id,
                    prompt("Edit daily briefing:", note.note) ?? note.note
                  )
                }
              >
                <Pencil1Icon />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleDeleteNote(note.id)}
              >
                <TrashIcon />
              </Button>
            </div>
          </div>
        ))}
    </div>
  </div>
</TabsContent>


              <TabsContent value="notes">
                <div className="p-6 space-y-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="new-note">Add a new note</Label>
                    <Textarea
                      id="new-note"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Type your note here..."
                      className="min-h-[100px]"
                    />
                    <Button onClick={() => handleAddNote("notes")}>
                      Add Note
                    </Button>
                  </div>
                  <div className="grid gap-4">
                    {notes
                      .filter((note) => note.type === "notes")
                      .map((note) => (
                        <div
                          key={note.id}
                          className="flex justify-between items-start"
                        >
                          <div>
                            <div className="text-sm font-medium">
                              {note.note}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                handleEditNote(
                                  note.id,
                                  prompt("Edit note:", note.note) ?? note.note
                                )
                              }
                            >
                              <Pencil1Icon />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDeleteNote(note.id)}
                            >
                              <TrashIcon />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="absences">
                <div className="p-6 space-y-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="new-absence">Add a new absence</Label>
                    <Textarea
                      id="new-absence"
                      value={newAbsence}
                      onChange={(e) => setNewAbsence(e.target.value)}
                      placeholder="Enter date and reason for absence (e.g., 2023-12-01: Called out sick)"
                      className="min-h-[100px]"
                    />
                    <Button onClick={() => handleAddNote("absence")}>
                      Add Absence
                    </Button>
                  </div>
                  <div className="grid gap-4">
                    {notes
                      .filter((note) => note.type === "absence")
                      .map((note) => (
                        <div
                          key={note.id}
                          className="flex justify-between items-start"
                        >
                          <div>
                            <div className="text-sm font-medium">
                              {note.note}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                handleEditNote(
                                  note.id,
                                  prompt("Edit absence:", note.note) ??
                                    note.note
                                )
                              }
                            >
                              <Pencil1Icon />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDeleteNote(note.id)}
                            >
                              <TrashIcon />
                            </Button>
                          </div>
                        </div>
                      ))}
                    {absences.map((absence, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-start"
                      >
                        <div className="text-sm font-medium">
                          {absence.schedule_date}
                        </div>
                        <div className="text-sm">{absence.status}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="reviews">
                <div className="p-6 space-y-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="new-review">Add a new review</Label>
                    <Textarea
                      id="new-review"
                      value={newReview}
                      onChange={(e) => setNewReview(e.target.value)}
                      placeholder="Type your review here..."
                      className="min-h-[100px]"
                    />
                    <Button onClick={() => handleAddNote("reviews")}>
                      Add Review
                    </Button>
                  </div>
                  <div className="grid gap-4">
                    {notes
                      .filter((note) => note.type === "reviews")
                      .map((note) => (
                        <div
                          key={note.id}
                          className="flex justify-between items-start"
                        >
                          <div>
                            <div className="text-sm font-medium">
                              {note.note}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                handleEditNote(
                                  note.id,
                                  prompt("Edit note:", note.note) ?? note.note
                                )
                              }
                            >
                              <Pencil1Icon />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDeleteNote(note.id)}
                            >
                              <TrashIcon />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="growth">
                <div className="p-6 space-y-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="new-growth">
                      Add a new growth tracking entry
                    </Label>
                    <Textarea
                      id="new-growth"
                      value={newGrowth}
                      onChange={(e) => setNewGrowth(e.target.value)}
                      placeholder="Type your growth tracking entry here..."
                      className="min-h-[100px]"
                    />
                    <Button onClick={() => handleAddNote("growth")}>
                      Add Entry
                    </Button>
                  </div>
                  <div className="grid gap-4">
                    {notes
                      .filter((note) => note.type === "growth")
                      .map((note) => (
                        <div
                          key={note.id}
                          className="flex justify-between items-start"
                        >
                          <div>
                            <div className="text-sm font-medium">
                              {note.note}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                handleEditNote(
                                  note.id,
                                  prompt("Edit note:", note.note) ?? note.note
                                )
                              }
                            >
                              <Pencil1Icon />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDeleteNote(note.id)}
                            >
                              <TrashIcon />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="audits">
                <div className="p-6 space-y-4">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className="py-2 w-36 text-left">DROS #</th>
                        <th className="py-2 w-24 text-left">Sales Rep</th>
                        <th className="py-2 w-24 text-left">Audit Type</th>
                        <th className="py-2 w-32 text-left">Trans Date</th>
                        <th className="py-2 w-32 text-left">Audit Date</th>
                        <th className="py-2 w-38 text-left">Location</th>
                        <th className="py-2 w-58 text-left">Details</th>
                        <th className="py-2 w-64 text-left">Notes</th>
                        <th className="py-2 w-12 text-left">Cancelled?</th>
                      </tr>
                    </thead>
                    <tbody>
                      {audits.map((audit, index) => (
                        <tr key={index} className="border-t">
                          <td className="py-2 w-36">{audit.dros_number}</td>
                          <td className="py-2 w-24">{audit.salesreps}</td>
                          <td className="py-2 w-24">{audit.audit_type}</td>
                          <td className="py-2 w-30">{audit.trans_date}</td>
                          <td className="py-2 w-30">{audit.audit_date}</td>
                          <td className="py-2 w-38">{audit.error_location}</td>
                          <td className="py-2 w-58">{audit.error_details}</td>
                          <td className="py-2 w-64">{audit.error_notes}</td>
                          <td className="py-2 w-12">{audit.dros_cancel}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
              <TabsContent value="performance">
                <div className="p-6 space-y-4">
                  <div className="w-full mb-4">
                    <CustomCalendar
                      selectedDate={selectedMonth}
                      onDateChange={(date: Date | undefined) =>
                        setSelectedMonth(date)
                      }
                      disabledDays={() => false} // Adjust this if needed
                    />
                  </div>
                  <div className="text-left">
                    <DataTable
                      columns={[
                        { Header: "Lanid", accessor: "Lanid" },
                        { Header: "Total DROS", accessor: "TotalDros" },
                        {
                          Header: "Points Deducted",
                          accessor: "PointsDeducted",
                        },
                        { Header: "Total Points", accessor: "TotalPoints" },
                      ]}
                      data={summaryData}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </Card>
      </div>
    </RoleBasedWrapper>
  );
};

export default EmployeeProfile;
