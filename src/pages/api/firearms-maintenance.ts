import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supabase/client";
import { cycleFirearms } from "@/utils/cycleFirearms"; // Import the cycleFirearms function

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { action, data } = req.body;

    try {
      if (action === "updateMaintenance") {
        const { id, maintenance_notes, status } = data;

        const { error } = await supabase
          .from("firearms_maintenance")
          .update({ maintenance_notes, status: status !== null ? status : "", last_maintenance_date: new Date() })
          .eq("id", id);

        if (error) {
          throw error;
        }

        res.status(200).json({ message: "Maintenance updated successfully" });
      } else if (action === "generateNewList") {
        const { userUuid } = data;

        // Fetch all firearms data
        const { data: firearmsData, error } = await supabase
          .from("firearms_maintenance")
          .select("*");

        if (error) {
          throw error;
        }

        // Filter and sort firearms by type, frequency, and date of last maintenance
        const handguns = firearmsData
          .filter((firearm) => firearm.firearm_type === "handgun")
          .sort((a, b) => {
            const frequencyA = a.maintenance_frequency || 1;
            const frequencyB = b.maintenance_frequency || 1;
            const lastMaintenanceDateA = new Date(a.last_maintenance_date || 0);
            const lastMaintenanceDateB = new Date(b.last_maintenance_date || 0);
            return (lastMaintenanceDateA.getTime() / frequencyA) - (lastMaintenanceDateB.getTime() / frequencyB);
          });

        const longGuns = firearmsData
          .filter((firearm) => firearm.firearm_type === "long gun")
          .sort((a, b) => {
            const frequencyA = a.maintenance_frequency || 1;
            const frequencyB = b.maintenance_frequency || 1;
            const lastMaintenanceDateA = new Date(a.last_maintenance_date || 0);
            const lastMaintenanceDateB = new Date(b.last_maintenance_date || 0);
            return (lastMaintenanceDateA.getTime() / frequencyA) - (lastMaintenanceDateB.getTime() / frequencyB);
          });

        // Cycle firearms to ensure there are exactly 13 of each type
        const updatedHandguns = cycleFirearms(handguns, 13);
        const updatedLongGuns = cycleFirearms(longGuns, 13);

        const updatedFirearms = [...updatedHandguns, ...updatedLongGuns].map(firearm => ({
          ...firearm,
          assigned_to: userUuid,
          status: "Assigned",
        }));

        // Update the database
        for (const firearm of updatedFirearms) {
          const { id, assigned_to, status } = firearm;
          const { error: updateError } = await supabase
            .from("firearms_maintenance")
            .update({ assigned_to, status })
            .eq("id", id);

          if (updateError) {
            throw updateError;
          }
        }

        res.status(200).json({ message: "New list generated successfully", firearms: updatedFirearms });
      } else {
        res.status(400).json({ message: "Invalid action" });
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error handling firearms maintenance request:", error);
        res.status(500).json({ message: error.message });
      } else {
        console.error("Unknown error:", error);
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
