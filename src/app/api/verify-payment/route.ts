import { NextResponse } from "next/server";
import { stripe } from "@/utils/stripe/config";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  const { sessionId } = await req.json();

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log("Stripe session:", session);

    if (session.payment_status === "paid") {
      const supabase = createClient();

      // Ensure we have the necessary data
      if (!session.client_reference_id || !session.metadata?.classId) {
        console.error("Missing client_reference_id or classId");
        return NextResponse.json(
          { error: "Missing required data" },
          { status: 400 }
        );
      }

      // Update your database to reflect the successful payment
      const { data, error } = await supabase.from("class_enrollments").insert({
        user_id: session.client_reference_id,
        class_id: session.metadata.classId,
        payment_status: "paid",
        stripe_session_id: session.id,
      });

      if (error) {
        console.error("Error updating database:", error);
        return NextResponse.json(
          { error: `Error updating database: ${error.message}` },
          { status: 500 }
        );
      }

      console.log("Database updated successfully:", data);
      return NextResponse.json({ success: true });
    } else {
      console.log("Payment not successful. Status:", session.payment_status);
      return NextResponse.json(
        { error: "Payment not successful" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: `Error verifying payment: ${error.message}` },
      { status: 500 }
    );
  }
}
