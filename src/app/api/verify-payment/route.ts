import { NextResponse } from "next/server";
import { stripe } from "@/utils/stripe/config";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/types_db"; // Updated import

export async function POST(req: Request) {
  const { sessionId } = await req.json();

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      console.error(`Payment not successful for session ${sessionId}`);
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
      console.error(`Error fetching user:`, userError);
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const classId = session.metadata?.class_id;
    if (!classId) {
      console.error(`Class ID not found in session metadata`);
      return NextResponse.json(
        { error: "Class ID not found in session" },
        { status: 400 }
      );
    }

    // Fetch user name
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
          `Error fetching user details:`,
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

    // Upsert enrollment
    const { data: enrollment, error: upsertError } = await supabase
      .from("class_enrollments")
      .upsert(
        {
          user_id: user.id,
          class_id: parseInt(classId),
          payment_status: session.payment_status,
          stripe_session_id: session.id,
          user_name: userName,
        },
        {
          onConflict: "user_id,class_id,stripe_session_id",
        }
      )
      .select()
      .single();

    if (upsertError) {
      console.error(`Error upserting enrollment:`, upsertError);
      return NextResponse.json(
        { error: "Error processing enrollment" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      enrollmentData: enrollment,
      action: "upserted",
    });
  } catch (error) {
    console.error(`Error verifying payment for session ${sessionId}:`, error);
    return NextResponse.json(
      { error: "Error verifying payment" },
      { status: 500 }
    );
  }
}
