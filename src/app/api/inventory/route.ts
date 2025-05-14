import { NextResponse } from "next/server";
import { AimService } from "@/lib/aim/service";
import {
  SearchInventoryRequest,
  SearchInventoryResponse,
} from "@/app/api/aim/dtos";

export const maxDuration = 60; // Set max duration to 60 seconds

export async function POST(req: Request) {
  try {
    const searchParams = await req.json();
    const aimService = AimService.getInstance();
    const client = await aimService.getClient();

    // Create request using documented pattern
    const searchRequest = new SearchInventoryRequest({
      // Required fields
      ApiKey: process.env.API_KEY,
      AppId: process.env.APP_ID,

      // Search parameters
      SearchStr: searchParams.SearchStr || "",
      IncludeSerials: searchParams.IncludeSerials ?? true,
      IncludeMedia: searchParams.IncludeMedia ?? true,
      IncludeAccessories: searchParams.IncludeAccessories ?? true,
      IncludePackages: searchParams.IncludePackages ?? true,
      IncludeDetails: searchParams.IncludeDetails ?? true,
      IncludeIconImage: searchParams.IncludeIconImage ?? true,
      ExactModel: searchParams.ExactModel ?? false,
      StartOffset: searchParams.StartOffset || 0,
      RecordCount: searchParams.RecordCount || 50,

      // Optional filters
      Cat: searchParams.Category,
      Sub: searchParams.SubCategory,
      SelectionCode: searchParams.SelectionCode,
      Mfg: searchParams.Mfg,
      IncludeDeleted: searchParams.IncludeDeleted ?? false,
      ChangedDate: searchParams.ChangedDate,
      IncludePackageLineItems: searchParams.IncludePackageLineItems ?? false,
      MinimumAvailableQuantity: searchParams.MinimumAvailableQuantity,
    });

    console.log("Making search request with:", {
      searchStr: searchRequest.SearchStr,
      startOffset: searchRequest.StartOffset,
      recordCount: searchRequest.RecordCount,
    });

    const api = await client.api(searchRequest);

    if (!api || !api.response) {
      throw new Error("No response received from API");
    }

    const response = api.response as SearchInventoryResponse;

    if (response.Status?.StatusCode === "Error") {
      console.error("API Error:", response.Status);
      return NextResponse.json(response, { status: 500 });
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error in inventory search:", error);
    return NextResponse.json(
      {
        Status: {
          StatusCode: "Error",
          ErrorMessage: error.message || "An unknown error occurred",
          ErrorCode: error.code || "UNKNOWN_ERROR",
        },
      },
      { status: 500 }
    );
  }
}
