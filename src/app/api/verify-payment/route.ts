import { NextResponse } from "next/server";
import { stripe } from "@/utils/stripe/config";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/types_db"; // Updated import

export async function POST(req: Request) {
  const { sessionId } = await req.json();
  console.log(
    `[${new Date().toISOString()}] Received verification request for session ID: ${sessionId}`
  );

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log(
      `[${new Date().toISOString()}] Stripe session:`,
      JSON.stringify(session, null, 2)
    );

    if (session.payment_status !== "paid") {
      console.error(
        `[${new Date().toISOString()}] Payment not successful for session ${sessionId}`
      );
      return NextResponse.json(
        { error: "Payment not successful" },
        { status: 400 }
      );
    }

    const supabase = createServerComponentClient<Database>({ cookies });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error(
        `[${new Date().toISOString()}] Error fetching user:`,
        userError
      );
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    console.log(
      `[${new Date().toISOString()}] User ID from Supabase auth:`,
      user.id
    );

    const classId = session.metadata?.class_id;
    if (!classId) {
      console.error(
        `[${new Date().toISOString()}] Class ID not found in session metadata`
      );
      return NextResponse.json(
        { error: "Class ID not found in session" },
        { status: 400 }
      );
    }

    // Fetch user name (keeping your existing logic)
    let userName: string;
    const { data: customerData, error: customerError } = await supabase
      .from("customers")
      .select("first_name, last_name")
      .eq("user_uuid", user.id)
      .single();

    if (customerError || !customerData) {
      const { data: employeeData, error: employeeError } = await supabase
        .from("employees")
        .select("name")
        .eq("user_uuid", user.id)
        .single();

      if (employeeError || !employeeData) {
        console.error(
          `[${new Date().toISOString()}] Error fetching user details:`,
          employeeError || customerError
        );
        return NextResponse.json(
          { error: "Error fetching user details" },
          { status: 500 }
        );
      }
      userName = employeeData.name;
    } else {
      userName = `${customerData.first_name} ${customerData.last_name}`;
    }

    console.log(`[${new Date().toISOString()}] User Name:`, userName);

    // Check if enrollment already exists
    const { data: existingEnrollment, error: existingEnrollmentError } =
      await supabase
        .from("class_enrollments")
        .select("*")
        .eq("user_id", user.id)
        .eq("class_id", parseInt(classId))
        .eq("stripe_session_id", session.id)
        .single();

    if (
      existingEnrollmentError &&
      existingEnrollmentError.code !== "PGRST116"
    ) {
      console.error(
        `[${new Date().toISOString()}] Error checking existing enrollment:`,
        existingEnrollmentError
      );
      return NextResponse.json(
        { error: "Error checking existing enrollment" },
        { status: 500 }
      );
    }

    if (existingEnrollment) {
      console.log(
        `[${new Date().toISOString()}] Enrollment already exists for session ${
          session.id
        }`
      );
      return NextResponse.json({
        success: true,
        enrollmentData: existingEnrollment,
        action: "existing",
      });
    }

    // Insert new enrollment
    const enrollmentData = {
      user_id: user.id,
      class_id: parseInt(classId),
      payment_status: session.payment_status,
      stripe_session_id: session.id,
      user_name: userName,
    };

    console.log(
      `[${new Date().toISOString()}] Inserting new enrollment:`,
      JSON.stringify(enrollmentData, null, 2)
    );

    const { data: newEnrollment, error: insertError } = await supabase
      .from("class_enrollments")
      .insert(enrollmentData)
      .select()
      .single();

    if (insertError) {
      console.error(
        `[${new Date().toISOString()}] Error inserting enrollment:`,
        insertError
      );
      return NextResponse.json(
        { error: "Error inserting enrollment", details: insertError },
        { status: 500 }
      );
    }

    console.log(
      `[${new Date().toISOString()}] New enrollment inserted:`,
      JSON.stringify(newEnrollment, null, 2)
    );

    return NextResponse.json({
      success: true,
      enrollmentData: newEnrollment,
      action: "inserted",
    });
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error verifying payment for session ${sessionId}:`,
      error
    );
    return NextResponse.json(
      { error: "Error verifying payment" },
      { status: 500 }
    );
  }
}
