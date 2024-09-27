import { NextResponse } from "next/server";
import { stripe } from "@/utils/stripe/config";
import { createClient } from "@/utils/supabase/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  const { sessionId } = await req.json();
  //console.log("Received session ID:", sessionId);

  try {
    //console.log("Retrieving Stripe session...");
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "line_items.data.price.product"],
    });
    //console.log("Stripe session retrieved:", session);

    if (session.payment_status !== "paid") {
      throw new Error("Payment not successful");
    }

    const supabase = createClient();

    //console.log("Fetching user details...");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Error fetching user:", userError);
      throw new Error("Could not get user");
    }

    //console.log("User found:", user);

    // Fetch customer data from the customers table
    const { data: customerData, error: customerError } = await supabase
      .from("customers")
      .select("*")
      .eq("user_uuid", user.id)
      .single();

    if (customerError) {
      console.error("Error fetching customer data:", customerError);
      throw new Error("Could not fetch customer data");
    }

    if (!customerData) {
      console.error("Customer data not found");
      throw new Error("Customer data not found");
    }

    //console.log("Customer data fetched:", customerData);

    // Process the purchase
    //console.log("Processing purchase...");
    const product = session.line_items?.data[0]?.price
      ?.product as Stripe.Product | null;

    const { data: purchaseData, error: purchaseError } = await supabase
      .from("purchases")
      .insert({
        user_id: user.id,
        first_name: customerData.first_name,
        last_name: customerData.last_name,
        email: customerData.email,
        product_id:
          session.metadata?.productId ||
          (product && "id" in product ? product.id : null),
        product_name:
          session.metadata?.productName ||
          (product && "name" in product ? product.name : null),
        amount: session.amount_total ? session.amount_total / 100 : null,
        currency: session.currency,
        status: session.payment_status,
        payment_intent_id: session.payment_intent as string,
        stripe_session_id: session.id,
      })
      .select();

    if (purchaseError) {
      console.error("Error inserting purchase:", purchaseError);
      throw new Error(`Failed to record purchase: ${purchaseError.message}`);
    }

    //console.log("Purchase recorded successfully:", purchaseData);

    // Update customer payment status and last payment date
    const { error: updateError } = await supabase
      .from("customers")
      .update({
        payment_status: "active",
        last_payment_date: new Date().toISOString(),
      })
      .eq("user_uuid", user.id);

    if (updateError) {
      console.error("Error updating customer payment status:", updateError);
      // Don't throw an error here, as the purchase was successful
    }

    return NextResponse.json({ success: true, purchase: purchaseData[0] });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}
