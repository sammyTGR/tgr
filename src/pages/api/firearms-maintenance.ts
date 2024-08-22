import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supabase/client";
import { corsHeaders } from '@/utils/cors';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Add this to the beginning of your handler function
  if (req.method === 'OPTIONS') {
    res.status(200).json({ message: 'CORS preflight request success' });
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');

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

        // Check if a persisted list already exists for the user
        const { data: existingList, error: existingListError } = await supabase
          .from("persisted_firearms_list")
          .select("*")
          .eq("user_uuid", userUuid)
          .single();

        if (existingListError && existingListError.code !== "PGRST116") {
          throw existingListError;
        }

        if (existingList) {
          // If a list exists, use the existing list
          res.status(200).json({ message: "Existing list retrieved successfully", firearms: existingList.firearms_list });
        } else {
          // Fetch all firearms data
          const { data: firearmsData, error: firearmsError } = await supabase
            .from("firearms_maintenance")
            .select("*");

          if (firearmsError) {
            throw firearmsError;
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

          // Persist the new list in the persisted_firearms_list table
          const { error: persistError } = await supabase
            .from("persisted_firearms_list")
            .insert({ user_uuid: userUuid, firearms_list: updatedFirearms });

          if (persistError) {
            throw persistError;
          }

          res.status(200).json({ message: "New list generated successfully", firearms: updatedFirearms });
        }
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
