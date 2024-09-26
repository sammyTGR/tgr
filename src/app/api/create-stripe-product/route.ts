"use server";

import { NextResponse } from "next/server";
import { stripe } from "@/utils/stripe/config";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const { name, description, price } = await req.json();

    // Convert price to cents for Stripe
    const priceCents = Math.round(parseFloat(price) * 100);

    const product = await stripe.products.create({
      name,
      description,
    });

    const priceObject = await stripe.prices.create({
      product: product.id,
      unit_amount: priceCents,
      currency: "usd",
    });

    // Add the product to your Supabase database
    const supabase = createClient();
    await supabase.from("products").insert({
      id: product.id,
      name: product.name,
      description: product.description,
      price_id: priceObject.id,
      price: price, // Store the original price (in dollars)
    });

    return NextResponse.json({
      productId: product.id,
      priceId: priceObject.id,
    });
  } catch (error) {
    console.error("Error creating Stripe product:", error);
    return NextResponse.json(
      { error: "Error creating Stripe product" },
      { status: 500 }
    );
  }
}
