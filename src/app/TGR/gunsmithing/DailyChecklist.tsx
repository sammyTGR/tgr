import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface DailyChecklistProps {
  userRole: string | null;
  userUuid: string | null;
  onSubmit: () => void;
}

interface FirearmWithGunsmith {
  id: number;
  firearm_name: string;
  rental_notes: string;
  maintenance_notes?: string;
}

export default function DailyChecklist({
  userRole,
  userUuid,
  onSubmit,
}: DailyChecklistProps) {
  const [firearms, setFirearms] = useState<FirearmWithGunsmith[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFirearmsWithGunsmith();
  }, []);

  const fetchFirearmsWithGunsmith = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("firearms_maintenance")
        .select("id, firearm_name, rental_notes, maintenance_notes")
        .eq("rental_notes", "With Gunsmith");

      if (error) throw error;
      setFirearms(data || []);
    } catch (error) {
      console.error("Error fetching firearms:", error);
      toast.error("Failed to fetch firearms");
    } finally {
      setLoading(false);
    }
  };

  const handleNoteChange = (id: number, note: string) => {
    setFirearms(
      firearms.map((f) => (f.id === id ? { ...f, maintenance_notes: note } : f))
    );
  };

  const handleSubmit = async () => {
    try {
      const updates = firearms.map(({ id, maintenance_notes }) => ({
        id,
        maintenance_notes,
        last_maintenance_date: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("firearms_maintenance")
        .upsert(updates, { onConflict: "id" });

      if (error) throw error;
      toast.success("Daily maintenance notes updated successfully");
      onSubmit?.();
    } catch (error) {
      console.error("Error updating maintenance notes:", error);
      toast.error("Failed to update maintenance notes");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Firearms With Gunsmith</h2>
      {firearms.length === 0 ? (
        <p>No firearms currently with gunsmith.</p>
      ) : (
        firearms.map((firearm) => (
          <div key={firearm.id} className="border p-4 rounded-md">
            <h3 className="font-medium">{firearm.firearm_name}</h3>
            <Textarea
              value={firearm.maintenance_notes || ""}
              onChange={(e) => handleNoteChange(firearm.id, e.target.value)}
              placeholder="Enter maintenance note..."
              className="mt-2"
            />
          </div>
        ))
      )}
      <Button onClick={handleSubmit} disabled={firearms.length === 0}>
        Submit Daily Checklist Firearms
      </Button>
    </div>
  );
}
