import { NextResponse } from "next/server";
import { stripe } from "@/utils/stripe/config";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/types_db"; // Updated import

export async function POST(req: Request) {
  const { sessionId } = await req.json();

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log("Stripe session:", JSON.stringify(session, null, 2));

    if (session.payment_status === "paid") {
      const supabase = createServerComponentClient<Database>({ cookies });

      // Get user from Supabase auth
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("Error fetching user:", userError);
        return NextResponse.json(
          { error: "User not authenticated" },
          { status: 401 }
        );
      }

      console.log("User ID from Supabase auth:", user.id);

      // Extract class_id from metadata
      const classId = session.metadata?.class_id;
      if (!classId) {
        console.error("Class ID not found in session metadata");
        return NextResponse.json(
          { error: "Class ID not found in session" },
          { status: 400 }
        );
      }

      // Fetch user details from customers table
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("first_name, last_name")
        .eq("user_uuid", user.id)
        .single();

      let userName: string;
      if (customerError || !customerData) {
        console.error("Error fetching customer details:", customerError);
        // If not found in customers, check employees table
        const { data: employeeData, error: employeeError } = await supabase
          .from("employees")
          .select("name")
          .eq("user_uuid", user.id)
          .single();

        if (employeeError || !employeeData) {
          console.error("Error fetching employee details:", employeeError);
          return NextResponse.json(
            { error: "Error fetching user details" },
            { status: 500 }
          );
        }
        userName = employeeData.name;
      } else {
        userName = `${customerData.first_name} ${customerData.last_name}`;
      }

      console.log("User Name:", userName);

      // Insert enrollment with user name, user_id, and class_id
      const enrollmentData = {
        user_id: user.id,
        class_id: parseInt(classId),
        payment_status: session.payment_status,
        stripe_session_id: session.id,
        user_name: userName,
      };

      console.log(
        "Inserting enrollment with:",
        JSON.stringify(enrollmentData, null, 2)
      );

      const { data, error } = await supabase
        .from("class_enrollments")
        .insert(enrollmentData)
        .select();

      if (error) {
        console.error("Error updating database:", error);
        return NextResponse.json(
          { error: "Error updating database", details: error },
          { status: 500 }
        );
      }

      console.log("Insertion result:", JSON.stringify(data, null, 2));

      return NextResponse.json({ success: true, enrollmentData: data });
    } else {
      console.error("Payment not successful");
      return NextResponse.json(
        { error: "Payment not successful" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: "Error verifying payment" },
      { status: 500 }
    );
  }
}
