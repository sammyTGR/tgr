import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supabase/client";

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

        // Separate firearms by type
        const handguns = firearmsData.filter(firearm => firearm.firearm_type === "handgun");
        const longGuns = firearmsData.filter(firearm => firearm.firearm_type === "long gun");

        // Sort firearms by last maintenance date
        handguns.sort((a, b) => new Date(a.last_maintenance_date).getTime() - new Date(b.last_maintenance_date).getTime());
longGuns.sort((a, b) => new Date(a.last_maintenance_date).getTime() - new Date(b.last_maintenance_date).getTime());

        // Get the firearms to assign
        const assignedHandguns = handguns.slice(0, 13);
        const assignedLongGuns = longGuns.slice(0, 13);

        // Mark the selected firearms as "Assigned"
        const updatedFirearms = [...assignedHandguns, ...assignedLongGuns];

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
