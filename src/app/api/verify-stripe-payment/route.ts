import { NextResponse } from "next/server";
import { stripe } from "@/utils/stripe/config";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/types_db";
import Stripe from "stripe";

export async function POST(req: Request) {
  const { sessionId } = await req.json();

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "line_items.data.price.product"],
    });

    if (session.payment_status !== "paid") {
      throw new Error("Payment not successful");
    }

    const supabase = createServerComponentClient<Database>({ cookies });

    // Fetch user details from Supabase
    let userData;
    // First, try to fetch from customers table
    const { data: customerData, error: customerError } = await supabase
      .from("customers")
      .select("first_name, last_name, email")
      .eq("user_uuid", session.client_reference_id)
      .single();

    if (customerError || !customerData) {
      // If not found in customers, check employees table
      const { data: employeeData, error: employeeError } = await supabase
        .from("employees")
        .select("name, email")
        .eq("user_uuid", session.client_reference_id)
        .single();

      if (employeeError || !employeeData) {
        throw new Error("User not found in customers or employees table");
      }

      // Split the name into first_name and last_name
      const [first_name, ...lastNameParts] = employeeData.name.split(" ");
      const last_name = lastNameParts.join(" ");

      userData = {
        first_name,
        last_name,
        email: employeeData.email,
      };
    } else {
      userData = customerData;
    }

    if (session.mode === "subscription") {
      const subscription = session.subscription as Stripe.Subscription;
      const { error: subscriptionError } = await supabase
        .from("subscriptions")
        .upsert({
          id: subscription.id,
          user_id: session.client_reference_id,
          status: subscription.status,
          price_id: session.metadata?.price_id,
          quantity: subscription.items.data[0].quantity,
          cancel_at_period_end: subscription.cancel_at_period_end,
          created: new Date(subscription.created * 1000).toISOString(),
          current_period_start: new Date(
            subscription.current_period_start * 1000
          ).toISOString(),
          current_period_end: new Date(
            subscription.current_period_end * 1000
          ).toISOString(),
          ended_at: subscription.ended_at
            ? new Date(subscription.ended_at * 1000).toISOString()
            : null,
          cancel_at: subscription.cancel_at
            ? new Date(subscription.cancel_at * 1000).toISOString()
            : null,
          canceled_at: subscription.canceled_at
            ? new Date(subscription.canceled_at * 1000).toISOString()
            : null,
          trial_start: subscription.trial_start
            ? new Date(subscription.trial_start * 1000).toISOString()
            : null,
          trial_end: subscription.trial_end
            ? new Date(subscription.trial_end * 1000).toISOString()
            : null,
          metadata: subscription.metadata,
          first_name: userData.first_name,
          last_name: userData.last_name,
          email: userData.email,
        });

      if (subscriptionError) throw subscriptionError;
    } else {
      // Handle one-time purchase
      const lineItems = session.line_items?.data;
      if (!lineItems || lineItems.length === 0) {
        throw new Error("No line items found in the session");
      }

      const purchasePromises = lineItems.map((item) => {
        const product = item.price?.product;
        let productId: string;
        let productName: string;

        if (typeof product === "string") {
          productId = product;
          productName = "Unknown Product"; // You might want to fetch the product details separately
        } else if (product && "id" in product && "name" in product) {
          productId = product.id;
          productName = product.name;
        } else {
          throw new Error("Invalid product data");
        }

        return supabase.from("purchases").insert({
          user_id: session.client_reference_id,
          first_name: userData.first_name,
          last_name: userData.last_name,
          email: userData.email,
          product_id: productId,
          product_name: productName,
          amount: item.amount_total ? item.amount_total / 100 : null, // Stripe amounts are in cents
          currency: session.currency,
          status: session.payment_status,
          payment_intent_id: session.payment_intent as string,
          stripe_session_id: session.id,
          created_at: new Date().toISOString(),
        });
      });

      const results = await Promise.all(purchasePromises);
      const errors = results.filter((result) => result.error);
      if (errors.length > 0) {
        throw new Error(
          `Error inserting purchases: ${errors
            .map((e) => e.error?.message)
            .join(", ")}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      productName:
        (session.line_items?.data[0]?.price?.product as Stripe.Product)?.name ||
        "Product",
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}
