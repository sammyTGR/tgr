"use server";

import { stripe } from "./config";
import { getURL } from "./helpers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/types_db";

export async function checkoutWithStripe(
  price: Database["public"]["Tables"]["prices"]["Row"] & {
    type: "one_time" | "recurring";
  },
  metadata: {
    productId: string;
    productName: string;
    billingInterval: "one_time" | "month" | "year";
  }
) {
  const supabase = createServerComponentClient<Database>({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Could not get user");

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
    mode: price.type === "recurring" ? "subscription" : "payment",
    allow_promotion_codes: true,
    success_url: `${getURL()}/payment-confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${getURL()}/`,
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
