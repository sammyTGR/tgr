import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const formData = await request.json();

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;

    // Log the incoming form data for debugging
    // console.log("Incoming form data:", JSON.stringify(formData, null, 2));

    // Transform the data to match database schema
    const transformedData = {
      user_id: user?.id,
      first_name: formData.firstName?.toLowerCase() || '',
      middle_name: formData.middleName?.toLowerCase() || null,
      last_name: formData.lastName?.toLowerCase() || '',
      suffix: formData.suffix?.toLowerCase() || null,
      street_address: formData.streetAddress?.toLowerCase() || '',
      zip_code: formData.zipCode || '',
      city: formData.city?.toLowerCase() || '',
      state: formData.state?.toUpperCase() || '',
      gender: formData.gender?.toLowerCase() || '',
      hair_color: formData.hairColor?.toLowerCase() || '',
      eye_color: formData.eyeColor?.toLowerCase() || '',
      height_feet: parseInt(formData.heightFeet) || 0,
      height_inches: parseInt(formData.heightInches) || 0,
      weight: formData.weight ? parseInt(formData.weight) : null,
      date_of_birth: formData.dateOfBirth || '',
      id_type: formData.idType?.toLowerCase() || '',
      id_number: formData.idNumber || '',
      race: formData.race?.toLowerCase() || '',
      is_us_citizen: formData.isUsCitizen?.toLowerCase() || '',
      place_of_birth: formData.placeOfBirth?.toLowerCase() || '',
      phone_number: formData.phoneNumber || null,
      alias_first_name: formData.aliasFirstName?.toLowerCase() || null,
      alias_middle_name: formData.aliasMiddleName?.toLowerCase() || null,
      alias_last_name: formData.aliasLastName?.toLowerCase() || null,
      alias_suffix: formData.aliasSuffix?.toLowerCase() || null,
      hsc_fsc_number: formData.hscFscNumber || null,
      exemption_code: formData.exemptionCode?.toLowerCase() || null,
      eligibility_q1: formData.eligibilityQ1?.toLowerCase() || '',
      eligibility_q2: formData.eligibilityQ2?.toLowerCase() || '',
      eligibility_q3: formData.eligibilityQ3?.toLowerCase() || '',
      eligibility_q4: formData.eligibilityQ4?.toLowerCase() || '',
      is_gun_show_transaction: formData.isGunShowTransaction?.toLowerCase() || '',
      waiting_period_exemption: formData.waitingPeriodExemption?.toLowerCase() || null,
      restriction_exemption: formData.restrictionExemption?.toLowerCase() || null,
      make: formData.make?.toLowerCase() || '',
      model: formData.model?.toLowerCase() || '',
      serial_number: formData.serialNumber || '',
      other_number: formData.otherNumber || null,
      color: formData.color?.toLowerCase() || '',
      is_new_gun: formData.isNewGun?.toLowerCase() || '',
      firearm_safety_device: formData.firearmSafetyDevice?.toLowerCase() || '',
      non_roster_exemption: formData.nonRosterExemption || '',
      agency_department: formData.agencyDepartment || null,
      comments: formData.comments || null,
      status: 'pending',
      transaction_type: 'exempt-handgun',
      frame_only: formData.frameOnly === 'yes',
      calibers: formData.frameOnly === 'yes' ? null : formData.calibers || null,
      additional_caliber: formData.frameOnly === 'yes' ? null : formData.additionalCaliber || null,
      additional_caliber2:
        formData.frameOnly === 'yes' ? null : formData.additionalCaliber2 || null,
      additional_caliber3:
        formData.frameOnly === 'yes' ? null : formData.additionalCaliber3 || null,
      barrel_length:
        formData.frameOnly === 'yes'
          ? null
          : formData.barrelLength
            ? parseFloat(formData.barrelLength)
            : null,
      unit: formData.frameOnly === 'yes' ? null : formData.unit?.toUpperCase() || null,
      gun_type: 'HANDGUN',
      category: formData.category?.toUpperCase() || null,
      regulated: formData.frameOnly === 'yes' ? formData.regulated?.toUpperCase() || null : null,
      firearms_q1: formData.firearmsQ1?.toLowerCase() || null,
    };

    // Log the transformed data for debugging
    // console.log("Transformed data:", JSON.stringify(transformedData, null, 2));

    // Validate required fields
    const requiredFields = [
      'first_name',
      'last_name',
      'street_address',
      'zip_code',
      'city',
      'state',
      'gender',
      'hair_color',
      'eye_color',
      'height_feet',
      'height_inches',
      'date_of_birth',
      'id_type',
      'id_number',
      'race',
      'is_us_citizen',
      'place_of_birth',
      'eligibility_q1',
      'eligibility_q2',
      'eligibility_q3',
      'eligibility_q4',
      'is_gun_show_transaction',
      'make',
      'model',
      'serial_number',
      'color',
      'is_new_gun',
      'firearm_safety_device',
      'non_roster_exemption',
    ];

    const missingFields = requiredFields.filter(
      (field) => !transformedData[field as keyof typeof transformedData]
    );
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Insert the data
    const { data, error } = await supabase
      .from('exempt_handgun')
      .insert([transformedData])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        {
          error: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
