import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { PostgrestError } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const formData = await request.json();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Base data that's always required
    const baseData = {
      user_id: user.id,
      // Purchaser Information
      first_name: formData.firstName?.trim(),
      middle_name: formData.middleName?.trim() || null,
      last_name: formData.lastName?.trim(),
      suffix: formData.suffix?.trim() || null,
      street_address: formData.streetAddress?.trim(),
      zip_code: formData.zipCode?.trim(),
      city: formData.city?.trim(),
      state: formData.state?.toUpperCase()?.trim(),
      gender: formData.gender?.toLowerCase()?.trim(),
      hair_color: formData.hairColor?.toLowerCase()?.trim(),
      eye_color: formData.eyeColor?.toLowerCase()?.trim(),
      height_feet: parseInt(formData.heightFeet),
      height_inches: parseInt(formData.heightInches),
      weight: formData.weight ? parseInt(formData.weight) : null,
      date_of_birth: formData.dateOfBirth,
      id_type: formData.idType?.toLowerCase()?.trim(),
      id_number: formData.idNumber?.trim(),
      race: formData.race?.toLowerCase()?.trim(),
      is_us_citizen: formData.isUsCitizen?.toLowerCase()?.trim(),
      place_of_birth: formData.placeOfBirth?.toLowerCase()?.trim(),
      phone_number: formData.phoneNumber?.trim() || null,
      alias_first_name: formData.aliasFirstName?.trim() || null,
      alias_middle_name: formData.aliasMiddleName?.trim() || null,
      alias_last_name: formData.aliasLastName?.trim() || null,
      alias_suffix: formData.aliasSuffix?.trim() || null,

      // Transaction Information
      hsc_fsc_number: formData.hscFscNumber?.trim() || null,
      exemption_code: formData.exemptionCode?.trim() || null,
      eligibility_q1: formData.eligibilityQ1?.toLowerCase()?.trim() || "no",
      eligibility_q2: formData.eligibilityQ2?.toLowerCase()?.trim() || "no",
      eligibility_q3: formData.eligibilityQ3?.toLowerCase()?.trim() || "no",
      eligibility_q4: formData.eligibilityQ4?.toLowerCase()?.trim() || "no",
      firearms_q1: formData.firearmsQ1?.toLowerCase()?.trim() || "n/a",
      is_gun_show_transaction:
        formData.isGunShowTransaction?.toLowerCase()?.trim() || "no",
      waiting_period_exemption: formData.waitingPeriodExemption?.trim() || null,
      restriction_exemption: "Return to Owner",

      // Common Firearm Information
      make: formData.make?.trim(),
      model: formData.model?.trim(),
      serial_number: formData.serialNumber?.trim(),
      other_number: formData.otherNumber?.trim() || null,
      color: formData.color?.toLowerCase()?.trim(),
      is_new_gun: "used",
      comments: formData.comments?.trim() || null,
      status: "submitted",
      transaction_type: "handgun-redemption",
    };

    // Frame-only specific data
    const frameOnlyData =
      formData.frameOnly === "yes"
        ? {
            frame_only: true,
            calibers: null,
            additional_caliber: null,
            additional_caliber2: null,
            additional_caliber3: null,
            barrel_length: null,
            unit: null,
            gun_type: "HANDGUN",
            category: formData.category?.trim(),
            regulated: formData.regulated?.toUpperCase()?.trim() || "NO",
          }
        : {
            frame_only: false,
            calibers: formData.calibers?.trim(),
            additional_caliber: formData.additionalCaliber?.trim() || null,
            additional_caliber2: formData.additionalCaliber2?.trim() || null,
            additional_caliber3: formData.additionalCaliber3?.trim() || null,
            barrel_length: formData.barrelLength
              ? parseFloat(formData.barrelLength)
              : null,
            unit: "INCH",
            gun_type: "HANDGUN",
            category: formData.category?.trim(),
            regulated: null,
          };

    // Combine the data
    const dbData = {
      ...baseData,
      ...frameOnlyData,
    };

    console.log("Submitting data:", dbData); // Add this for debugging

    const { data, error } = await supabase
      .from("handgun_redemption")
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Database Error", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Error:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: "Internal Server Error", details: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error", details: "An unknown error occurred" },
      { status: 500 }
    );
  }
}
