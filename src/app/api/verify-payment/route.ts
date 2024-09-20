import { NextResponse } from "next/server";
import { stripe } from "@/utils/stripe/config";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  const { sessionId } = await req.json();

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      const supabase = createClient();

      // Update your database to reflect the successful payment
      // This is just an example, adjust according to your database structure
      const { data, error } = await supabase.from("class_enrollments").insert({
        user_id: session.client_reference_id,
        class_id: session.metadata?.classId,
        payment_status: "paid",
        stripe_session_id: session.id,
      });

      if (error) {
        console.error("Error updating database:", error);
        return NextResponse.json(
          { error: "Error updating database" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    } else {
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
