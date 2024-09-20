import { NextResponse } from "next/server";
import { stripe } from "@/utils/stripe/config";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const { classId } = await req.json();
    console.log("Received classId:", classId);

    const supabase = createClient();

    // Fetch the class details
    const { data: classData, error: classError } = await supabase
      .from("class_schedules")
      .select("*")
      .eq("id", classId)
      .single();

    if (classError) {
      console.error("Supabase error:", classError);
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (!classData) {
      console.error("Class data is null");
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    console.log("Class data:", classData);

    if (!classData.stripe_price_id) {
      console.error("Stripe price ID is missing for the class");
      return NextResponse.json(
        { error: "Invalid class data" },
        { status: 400 }
      );
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: classData.stripe_price_id,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get(
        "origin"
      )}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/classes`,
    });

    console.log("Stripe session created:", session.id);
    return NextResponse.json({ sessionId: session.id });
  } catch (err: any) {
    console.error("Detailed error:", err);
    return NextResponse.json(
      { error: "Error creating checkout session", details: err.message },
      { status: 500 }
    );
  }
}
