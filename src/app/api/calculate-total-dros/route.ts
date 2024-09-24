import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";

export async function GET() {
  try {
    const batchSize = 1000;
    let offset = 0;
    let totalDROS = 0;
    let hasMoreData = true;

    while (hasMoreData) {
      const { data, error } = await supabase
        .from("sales_data")
        .select("SoldQty, subcategory_label")
        .range(offset, offset + batchSize - 1);

      if (error) throw error;

      if (data.length === 0) {
        hasMoreData = false;
        break;
      }

      const batchTotal = data.reduce((total, row) => {
        if (row.subcategory_label) {
          return (
            total +
            (row.SoldQty || 0) * (parseFloat(row.subcategory_label) || 0)
          );
        }
        return total;
      }, 0);

      totalDROS += batchTotal;
      offset += batchSize;
    }

    return NextResponse.json({ totalDROS });
  } catch (error) {
    console.error("Error calculating total DROS:", error);
    return NextResponse.json(
      { error: "Failed to calculate total DROS" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    },
  });
}
