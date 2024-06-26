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

interface Note {
  id: number;
  profile_employee_id: number;
  employee_id: number;
  note: string;
  type: string;
  created_at: string;
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

const EmployeeProfile = () => {
  const params = useParams()!;
  const employeeIdParam = params.employeeId;

  const employeeId = Array.isArray(employeeIdParam)
    ? parseInt(employeeIdParam[0], 10)
    : parseInt(employeeIdParam, 10);

  const [activeTab, setActiveTab] = useState("notes");
  const [notes, setNotes] = useState<Note[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]); // New state for audits
  const [newNote, setNewNote] = useState("");
  const [newReview, setNewReview] = useState("");
  const [newAbsence, setNewAbsence] = useState("");
  const [newGrowth, setNewGrowth] = useState("");
  const [employee, setEmployee] = useState<any>(null);
  const { user } = useRole();

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
      .order("audit_date", { ascending: false }); // Fetch audits by lanid and sort by audit_date in descending order

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
          fetchNotes();
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
      default:
        return;
    }

    if (!employeeId || noteContent.trim() === "") return;

    const { data, error } = await supabase
      .from("employee_profile_notes")
      .insert([
        {
          profile_employee_id: employeeId,
          employee_id: parseInt(user.id, 10),
          note: noteContent,
          type,
        },
      ]);

    if (error) {
      console.error("Error adding note:", error);
    } else if (data) {
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
              defaultValue="notes"
              className="w-full"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList className="border-b border-gray-200 dark:border-gray-700">
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="absences">Absences</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="growth">Growth Tracking</TabsTrigger>
                <TabsTrigger value="audits">Audits</TabsTrigger>
              </TabsList>
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
            </Tabs>
          </div>
        </Card>
      </div>
    </RoleBasedWrapper>
  );
};

export default EmployeeProfile;
