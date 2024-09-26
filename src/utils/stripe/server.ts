"use server";

import { stripe } from "./config";
import { createClient } from "@/utils/supabase/server";
import { Database, Price } from "@/types_db";

export async function checkoutWithStripe(
  price: Price,
  metadata: {
    productId: string;
    productName: string;
    billingInterval: "one_time" | "month" | "year";
  }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Could not get user");

  // Determine the correct mode based on the price type
  const mode = price.type === "recurring" ? "subscription" : "payment";

  // Get the base URL dynamically
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL! || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    billing_address_collection: "required",
    customer_email: user.email,
    line_items: [
      {
        price: price.id,
        quantity: 1,
      },
    ],
    mode,
    allow_promotion_codes: true,
    success_url: `${baseUrl}/payment-confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/`,
    metadata: {
      ...metadata,
      userId: user.id,
    },
  });

  if (!session) {
    throw new Error("Could not create checkout session");
  }

  return { sessionId: session.id };
}
