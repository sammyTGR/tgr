import { useState, useEffect, useCallback } from "react";
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
  firearm_type: string;
  firearm_name: string;
  last_maintenance_date: string | null;
  maintenance_frequency: number | null;
  maintenance_notes: string | null;
  status: string | null;
  assigned_to: string | null;
  rental_notes: string | null;
  verified_status: string | null;
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

  const fetchFirearmsWithGunsmith = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("firearms_maintenance")
        .select("*")
        .eq("rental_notes", "With Gunsmith");
      if (error) throw error;
      setFirearms(data || []);
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

  const handleSubmit = async () => {
    // console.log("Starting submission");
    try {
      const updates = firearms.map((firearm) => ({
        ...firearm,
        last_maintenance_date: new Date().toISOString(),
      }));
      //   console.log("Updates prepared:", updates);
      const { data, error } = await supabase
        .from("firearms_maintenance")
        .upsert(updates, { onConflict: "id" });
      //   console.log("Supabase response:", { data, error });
      if (error) throw error;
      //   console.log("Submission successful");
      toast.success("Daily maintenance notes updated successfully");
      await fetchFirearmsWithGunsmith(); // Refresh the list after submission
    } catch (error) {
      console.error("Error in submission:", error);
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
            <h3 className="font-medium">
              {firearm.firearm_name} ({firearm.firearm_type})
            </h3>
            <p>Status: {firearm.status || "N/A"}</p>
            <p>Last Maintenance: {firearm.last_maintenance_date || "N/A"}</p>
            <p>
              Maintenance Frequency: {firearm.maintenance_frequency || "N/A"}
            </p>
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
