"use client";

import { usePatchNotes } from "@/lib/hooks/usePatchNotes";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus, Edit, ChevronUp, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { AddPatchNoteDialog } from "./add-patch-note-dialog";
import { useState } from "react";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import { PatchNotesSection } from "./patch-notes-section";
import { useRole } from "@/context/RoleContext";

interface PatchNote {
  id: string;
  version: string;
  title: string;
  description: string;
  release_date: string;
  changes: {
    type: "added" | "changed" | "fixed" | "removed";
    items: string[];
  }[];
}

interface ExpandableCardProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

export default function PatchNotesPage() {
  const { data: patchNotes, isLoading } = usePatchNotes();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<PatchNote | null>(null);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>(
    {}
  );

  if (isLoading) return <div>Loading...</div>;
  const { role } = useRole();

  const handleEdit = (note: PatchNote) => {
    setSelectedNote(note);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setSelectedNote(null);
    setDialogOpen(false);
  };

  const toggleCardExpansion = (cardId: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  const ExpandableCard = ({
    id,
    title,
    children,
  }: {
    id: string;
    title: string;
    children: React.ReactNode;
  }) => {
    const isExpanded = expandedCards[id] ?? false;

    return (
      <Card className={`relative ${isExpanded ? "h-auto" : "h-[200px]"}`}>
        <CardHeader className="flex flex-row items-center justify-between">
          {/* <CardTitle>{title}</CardTitle> */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleCardExpansion(id)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CardHeader>
        <CardContent
          className={`
            ${
              isExpanded
                ? "h-auto max-h-[500px] overflow-y-auto pr-4"
                : "h-[100px] overflow-y-auto pr-4"
            }
            space-y-2
          `}
        >
          {children}
        </CardContent>
      </Card>
    );
  };

  const AdminSection = () => {
    const { role } = useRole();
    if (role !== "dev") return null;

    return (
      <Button onClick={() => setDialogOpen(true)}>
        <Plus className="w-4 h-4 mr-2" />
        Add Patch Note
      </Button>
    );
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Patch Notes</h1>
        <AdminSection />
      </div>

      {role === "dev" && (
        <AddPatchNoteDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          editNote={selectedNote}
        />
      )}

      <PatchNotesSection
        onEdit={setSelectedNote}
        setDialogOpen={setDialogOpen}
      />
    </div>
  );
}
