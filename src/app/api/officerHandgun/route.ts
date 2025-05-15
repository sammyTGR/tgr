import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { PostgrestError } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const formData = await request.json();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate required fields
    const requiredFields = [
      'firstName',
      'lastName',
      'streetAddress',
      'zipCode',
      'city',
      'state',
      'gender',
      'hairColor',
      'eyeColor',
      'heightFeet',
      'heightInches',
      'dateOfBirth',
      'idType',
      'idNumber',
      'race',
      'isUsCitizen',
      'placeOfBirth',
      'make',
      'model',
      'serialNumber',
      'color',
      'isNewGun',
      'firearmSafetyDevice',
      'nonRosterExemption',
      'eligibilityQ1',
      'eligibilityQ2',
      'eligibilityQ3',
      'eligibilityQ4',
      'isGunShowTransaction',
    ];

    const missingFields = requiredFields.filter(
      (field) => !formData[field as keyof typeof formData]
    );

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: 'Missing Required Fields',
          details: `Missing required fields: ${missingFields.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Base data that's always required
    const baseData = {
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
      is_us_citizen: formData.isUsCitizen?.toLowerCase(),
      place_of_birth: formData.placeOfBirth?.toLowerCase(),
      phone_number: formData.phoneNumber || null,
      alias_first_name: formData.aliasFirstName || null,
      alias_middle_name: formData.aliasMiddleName || null,
      alias_last_name: formData.aliasLastName || null,
      alias_suffix: formData.aliasSuffix || null,

      // Transaction Information
      hsc_fsc_number: formData.hscFscNumber || null,
      exemption_code: formData.exemptionCode || null,
      eligibility_q1: formData.eligibilityQ1?.toLowerCase() || 'no',
      eligibility_q2: formData.eligibilityQ2?.toLowerCase() || 'no',
      eligibility_q3: formData.eligibilityQ3?.toLowerCase() || 'no',
      eligibility_q4: formData.eligibilityQ4?.toLowerCase() || 'no',
      firearms_q1: formData.firearmsQ1?.toLowerCase() || 'n/a',
      is_gun_show_transaction: formData.isGunShowTransaction?.toLowerCase() || 'no',
      waiting_period_exemption: formData.waitingPeriodExemption || null,
      restriction_exemption: 'Peace Officer - Active - Letter Required',

      // Common Firearm Information
      make: formData.make,
      model: formData.model,
      serial_number: formData.serialNumber,
      other_number: formData.otherNumber || null,
      color: formData.color?.toLowerCase(),
      is_new_gun: formData.isNewGun?.toLowerCase() || 'new',
      firearm_safety_device: formData.firearmSafetyDevice?.toLowerCase(),
      non_roster_exemption: formData.nonRosterExemption || null,
      agency_department: formData.agencyDepartment || null,
      comments: formData.comments || null,
      status: 'submitted',
      transaction_type: 'officer-handgun',
    };

    // Frame-only specific data
    const frameOnlyData =
      formData.frameOnly === 'yes'
        ? {
            frame_only: true,
            calibers: null,
            additional_caliber: null,
            additional_caliber2: null,
            additional_caliber3: null,
            barrel_length: null,
            unit: null,
            gun_type: 'HANDGUN',
            category: formData.category?.toLowerCase() || null,
            regulated: formData.regulated?.toUpperCase() || 'NO',
          }
        : {
            frame_only: false,
            calibers: formData.calibers || null,
            additional_caliber: formData.additionalCaliber || null,
            additional_caliber2: formData.additionalCaliber2 || null,
            additional_caliber3: formData.additionalCaliber3 || null,
            barrel_length: formData.barrelLength ? parseFloat(formData.barrelLength) : null,
            unit: formData.unit?.toUpperCase() || 'INCH',
            gun_type: 'HANDGUN',
            category: formData.category?.toLowerCase() || null,
            regulated: null,
          };

    // Combine the data
    const dbData = {
      ...baseData,
      ...frameOnlyData,
    };

    const { data, error } = await supabase.from('officer_handgun').insert(dbData).select().single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Database Error', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Internal Server Error', details: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Internal Server Error', details: 'An unknown error occurred' },
      { status: 500 }
    );
  }
}
