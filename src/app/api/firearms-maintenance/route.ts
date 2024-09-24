import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";

export async function POST(request: Request) {
  const { action, data } = await request.json();

  try {
    if (action === "updateMaintenance") {
      const { id, maintenance_notes, status } = data;

      const { error } = await supabase
        .from("firearms_maintenance")
        .update({
          maintenance_notes,
          status: status !== null ? status : "",
          last_maintenance_date: new Date(),
        })
        .eq("id", id);

      if (error) {
        throw error;
      }

      return NextResponse.json({ message: "Maintenance updated successfully" });
    } else if (action === "generateNewList") {
      const { userUuid } = data;

      const { data: existingList, error: existingListError } = await supabase
        .from("persisted_firearms_list")
        .select("*")
        .eq("user_uuid", userUuid)
        .single();

      if (existingListError && existingListError.code !== "PGRST116") {
        throw existingListError;
      }

      if (existingList) {
        return NextResponse.json({
          message: "Existing list retrieved successfully",
          firearms: existingList.firearms_list,
        });
      } else {
        const { data: firearmsData, error: firearmsError } = await supabase
          .from("firearms_maintenance")
          .select("*");

        if (firearmsError) {
          throw firearmsError;
        }

        const handguns = firearmsData.filter(
          (firearm) => firearm.firearm_type === "handgun"
        );
        const longGuns = firearmsData.filter(
          (firearm) => firearm.firearm_type === "long gun"
        );

        handguns.sort(
          (a, b) =>
            new Date(a.last_maintenance_date).getTime() -
            new Date(b.last_maintenance_date).getTime()
        );
        longGuns.sort(
          (a, b) =>
            new Date(a.last_maintenance_date).getTime() -
            new Date(b.last_maintenance_date).getTime()
        );

        const assignedHandguns = handguns.slice(0, 13);
        const assignedLongGuns = longGuns.slice(0, 13);

        const updatedFirearms = [...assignedHandguns, ...assignedLongGuns];

        const { error: persistError } = await supabase
          .from("persisted_firearms_list")
          .insert({ user_uuid: userUuid, firearms_list: updatedFirearms });

        if (persistError) {
          throw persistError;
        }

        return NextResponse.json({
          message: "New list generated successfully",
          firearms: updatedFirearms,
        });
      }
    } else {
      return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error handling firearms maintenance request:", error);
    return NextResponse.json(
      { error: "An error occurred while processing the request" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    },
  });
}
