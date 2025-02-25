"use client";

import { usePatchNotes } from "@/lib/hooks/usePatchNotes";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Edit, ChevronUp, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
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

interface PatchNotesSectionProps {
  onEdit?: (note: PatchNote) => void;
  setDialogOpen?: (open: boolean) => void;
  className?: string;
}

export function PatchNotesSection({
  onEdit,
  setDialogOpen,
  className = "",
}: PatchNotesSectionProps) {
  const { data: patchNotes, isLoading } = usePatchNotes();
  const { role } = useRole();
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>(
    {}
  );

  if (isLoading) return <div>Loading...</div>;

  const toggleCardExpansion = (cardId: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  const handleEdit = (note: PatchNote) => {
    if (onEdit) onEdit(note);
    if (setDialogOpen) setDialogOpen(true);
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
          <div className="flex items-center gap-2">
            <CardTitle>{title}</CardTitle>
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
          </div>
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

  return (
    <div className={`space-y-6 ${className}`}>
      {patchNotes?.map((note) => (
        <ExpandableCard key={note.id} id={note.id} title={note.title}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="ml-2">
                v{note.version}
              </Badge>
              {role === "dev" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(note)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              {format(new Date(note.release_date), "MMM dd, yyyy")}
            </span>
          </div>
          <p className="mb-4">{note.description}</p>
          <ScrollArea className="h-full">
            {note.changes.map((change, index) => (
              <div key={index} className="mb-4">
                <h3 className="font-semibold capitalize mb-2">
                  {change.type}:
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  {change.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </ScrollArea>
        </ExpandableCard>
      ))}
    </div>
  );
}
