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
      middle_name: formData.middleName,
      last_name: formData.lastName,
      suffix: formData.suffix,
      street_address: formData.streetAddress,
      zip_code: formData.zipCode,
      city: formData.city,
      state: formData.state?.toUpperCase(),
      gender: formData.gender,
      hair_color: formData.hairColor,
      eye_color: formData.eyeColor,
      height_feet: parseInt(formData.heightFeet),
      height_inches: parseInt(formData.heightInches),
      weight: formData.weight ? parseInt(formData.weight) : null,
      date_of_birth: formData.dateOfBirth,
      id_type: formData.idType,
      id_number: formData.idNumber,
      race: formData.race,
      is_us_citizen: formData.isUsCitizen?.toLowerCase() === "yes",
      place_of_birth: formData.placeOfBirth,
      phone_number: formData.phoneNumber,
      alias_first_name: formData.aliasFirstName,
      alias_middle_name: formData.aliasMiddleName,
      alias_last_name: formData.aliasLastName,
      alias_suffix: formData.aliasSuffix,

      // Seller Information
      seller_first_name: formData.sellerFirstName,
      seller_middle_name: formData.sellerMiddleName,
      seller_last_name: formData.sellerLastName,
      seller_suffix: formData.sellerSuffix,
      seller_street_address: formData.sellerStreetAddress,
      seller_zip_code: formData.sellerZipCode,
      seller_city: formData.sellerCity,
      seller_state: formData.sellerState?.toUpperCase(),
      seller_gender: formData.sellerGender,
      seller_hair_color: formData.sellerHairColor,
      seller_eye_color: formData.sellerEyeColor,
      seller_height_feet: parseInt(formData.sellerHeightFeet),
      seller_height_inches: parseInt(formData.sellerHeightInches),
      seller_weight: formData.sellerWeight
        ? parseInt(formData.sellerWeight)
        : null,
      seller_date_of_birth: formData.sellerDateOfBirth,
      seller_id_type: formData.sellerIdType,
      seller_id_number: formData.sellerIdNumber,
      seller_race: formData.sellerRace,
      seller_is_us_citizen: formData.sellerIsUsCitizen?.toLowerCase() === "yes",
      seller_place_of_birth: formData.sellerPlaceOfBirth,
      seller_phone_number: formData.sellerPhoneNumber,
      seller_alias_first_name: formData.sellerAliasFirstName,
      seller_alias_middle_name: formData.sellerAliasMiddleName,
      seller_alias_last_name: formData.sellerAliasLastName,
      seller_alias_suffix: formData.sellerAliasSuffix,

      // Transaction Information
      hsc_fsc_number: formData.hscFscNumber,
      exemption_code: formData.exemptionCode,
      eligibility_q1: formData.eligibilityQ1?.toLowerCase() === "yes",
      eligibility_q2: formData.eligibilityQ2?.toLowerCase() === "yes",
      eligibility_q3: formData.eligibilityQ3?.toLowerCase() === "yes",
      eligibility_q4: formData.eligibilityQ4?.toLowerCase() === "yes",
      is_gun_show_transaction:
        formData.isGunShowTransaction?.toLowerCase() === "yes",
      waiting_period_exemption: formData.waitingPeriodExemption,
      restriction_exemption: formData.restrictionExemption,

      // Firearm Information
      make: formData.make,
      model: formData.model,
      serial_number: formData.serialNumber,
      other_number: formData.otherNumber,
      color: formData.color,
      is_new_gun: formData.isNewGun === "new",
      firearm_safety_device: formData.firearmSafetyDevice,
      comments: formData.comments,
      status: "submitted",
      transaction_type: "ppt-handgun", // Fixed value for this form
    };

    const { data, error } = await supabase
      .from("private_handgun_transfers")
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      throw error;
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
