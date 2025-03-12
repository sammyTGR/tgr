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

    // Transform form data to match database schema
    const dbData = {
      user_id: user.id,
      // Purchaser Information
      first_name: formData.firstName,
      middle_name: formData.middleName || null,
      last_name: formData.lastName,
      suffix: formData.suffix || null,
      street_address: formData.streetAddress,
      zip_code: formData.zipCode,
      city: formData.city,
      state: formData.state?.toUpperCase(),
      gender: formData.gender?.toLowerCase(),
      hair_color: formData.hairColor?.toLowerCase(),
      eye_color: formData.eyeColor?.toLowerCase(),
      height_feet: parseInt(formData.heightFeet) || 0,
      height_inches: parseInt(formData.heightInches) || 0,
      weight: formData.weight ? parseInt(formData.weight) : null,
      date_of_birth: formData.dateOfBirth,
      id_type: formData.idType?.toLowerCase(),
      id_number: formData.idNumber,
      race: formData.race?.toLowerCase(),
      is_us_citizen:
        formData.isUsCitizen?.toLowerCase() === "yes" ? "yes" : "no",
      place_of_birth: formData.placeOfBirth?.toLowerCase(),
      phone_number: formData.phoneNumber || null,
      alias_first_name: formData.aliasFirstName || null,
      alias_middle_name: formData.aliasMiddleName || null,
      alias_last_name: formData.aliasLastName || null,
      alias_suffix: formData.aliasSuffix || null,

      // Seller Information
      seller_first_name: formData.sellerFirstName,
      seller_middle_name: formData.sellerMiddleName || null,
      seller_last_name: formData.sellerLastName,
      seller_suffix: formData.sellerSuffix || null,
      seller_street_address: formData.sellerStreetAddress,
      seller_zip_code: formData.sellerZipCode,
      seller_city: formData.sellerCity,
      seller_state: formData.sellerState?.toUpperCase(),
      seller_gender: formData.sellerGender?.toLowerCase(),
      seller_hair_color: formData.sellerHairColor?.toLowerCase(),
      seller_eye_color: formData.sellerEyeColor?.toLowerCase(),
      seller_height_feet: parseInt(formData.sellerHeightFeet) || 0,
      seller_height_inches: parseInt(formData.sellerHeightInches) || 0,
      seller_weight: formData.sellerWeight
        ? parseInt(formData.sellerWeight)
        : null,
      seller_date_of_birth: formData.sellerDateOfBirth,
      seller_id_type: formData.sellerIdType?.toLowerCase(),
      seller_id_number: formData.sellerIdNumber,
      seller_race: formData.sellerRace?.toLowerCase(),
      seller_is_us_citizen:
        formData.sellerIsUsCitizen?.toLowerCase() === "yes" ? "yes" : "no",
      seller_place_of_birth: formData.sellerPlaceOfBirth?.toLowerCase(),
      seller_phone_number: formData.sellerPhoneNumber || null,
      seller_alias_first_name: formData.sellerAliasFirstName || null,
      seller_alias_middle_name: formData.sellerAliasMiddleName || null,
      seller_alias_last_name: formData.sellerAliasLastName || null,
      seller_alias_suffix: formData.sellerAliasSuffix || null,

      // Transaction Information
      hsc_fsc_number: formData.hscFscNumber || null,
      exemption_code: formData.exemptionCode?.toLowerCase() || null,
      eligibility_q1:
        formData.eligibilityQ1?.toLowerCase() === "yes" ? "yes" : "no",
      eligibility_q2:
        formData.eligibilityQ2?.toLowerCase() === "yes" ? "yes" : "no",
      eligibility_q3:
        formData.eligibilityQ3?.toLowerCase() === "yes" ? "yes" : "no",
      eligibility_q4:
        formData.eligibilityQ4?.toLowerCase() === "yes" ? "yes" : "no",
      is_gun_show_transaction:
        formData.isGunShowTransaction?.toLowerCase() === "yes" ? "yes" : "no",
      waiting_period_exemption: formData.waitingPeriodExemption || null,
      restriction_exemption: formData.restrictionExemption || null,

      // Firearm Information
      frame_only: formData.frameOnly === "yes",
      make: formData.make,
      model: formData.model,
      calibers: formData.calibers || null,
      additional_caliber: formData.additionalCaliber || null,
      additional_caliber2: formData.additionalCaliber2 || null,
      additional_caliber3: formData.additionalCaliber3 || null,
      barrel_length: formData.barrelLength
        ? parseFloat(formData.barrelLength)
        : null,
      unit: formData.unit?.toUpperCase() || "INCH",
      gun_type: formData.gunType?.toUpperCase() || "HANDGUN",
      category: formData.category || null,
      regulated: formData.regulated?.toUpperCase() || "NO",
      serial_number: formData.serialNumber,
      other_number: formData.otherNumber || null,
      color: formData.color?.toLowerCase(),
      is_new_gun: formData.isNewGun?.toLowerCase(),
      firearm_safety_device: formData.firearmSafetyDevice?.toLowerCase(),
      comments: formData.comments || null,
      status: "submitted",
      transaction_type: "ppt-handgun",
      firearms_q1: formData.firearmsQ1?.toLowerCase() || null,
    };

    // Validate required fields
    const requiredFields = [
      "first_name",
      "last_name",
      "street_address",
      "zip_code",
      "city",
      "state",
      "gender",
      "hair_color",
      "eye_color",
      "height_feet",
      "height_inches",
      "date_of_birth",
      "id_type",
      "id_number",
      "race",
      "is_us_citizen",
      "place_of_birth",
      "seller_first_name",
      "seller_last_name",
      "seller_street_address",
      "seller_zip_code",
      "seller_city",
      "seller_state",
      "seller_gender",
      "seller_hair_color",
      "seller_eye_color",
      "seller_height_feet",
      "seller_height_inches",
      "seller_date_of_birth",
      "seller_id_type",
      "seller_id_number",
      "seller_race",
      "seller_is_us_citizen",
      "seller_place_of_birth",
      "make",
      "model",
      "serial_number",
      "color",
      "is_new_gun",
      "firearm_safety_device",
      "eligibility_q1",
      "eligibility_q2",
      "eligibility_q3",
      "eligibility_q4",
      "is_gun_show_transaction",
    ];

    const missingFields = requiredFields.filter(
      (field) => !dbData[field as keyof typeof dbData]
    );
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: "Missing Required Fields",
          details: `Missing required fields: ${missingFields.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate field constraints
    const validationErrors = [];

    // Validate yes/no fields
    const yesNoFields = [
      "is_us_citizen",
      "seller_is_us_citizen",
      "eligibility_q1",
      "eligibility_q2",
      "eligibility_q3",
      "eligibility_q4",
      "is_gun_show_transaction",
    ];
    yesNoFields.forEach((field) => {
      if (
        dbData[field as keyof typeof dbData] &&
        !["yes", "no"].includes(dbData[field as keyof typeof dbData])
      ) {
        validationErrors.push(`${field} must be 'yes' or 'no'`);
      }
    });

    // Validate firearms_q1
    if (
      dbData.firearms_q1 &&
      !["yes", "no", "n/a"].includes(dbData.firearms_q1)
    ) {
      validationErrors.push("firearms_q1 must be 'yes', 'no', or 'n/a'");
    }

    // Validate unit
    if (dbData.unit && !["INCH", "CENTIMETER"].includes(dbData.unit)) {
      validationErrors.push("unit must be 'INCH' or 'CENTIMETER'");
    }

    // Validate regulated
    if (dbData.regulated && !["YES", "NO"].includes(dbData.regulated)) {
      validationErrors.push("regulated must be 'YES' or 'NO'");
    }

    // Validate transaction_type
    if (!["ppt-handgun", "dealer-handgun"].includes(dbData.transaction_type)) {
      validationErrors.push("Invalid transaction_type");
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: "Validation Error",
          details: validationErrors.join(", "),
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("private_handgun_transfers")
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Database Error", details: error.message },
        { status: 400 }
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
