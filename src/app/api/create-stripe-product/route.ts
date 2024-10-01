"use server";

import { NextResponse } from "next/server";
import { stripe } from "@/utils/stripe/config";
import { createClient } from "@/utils/supabase/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  try {
    const { name, description, price, start_time, end_time } = await req.json();

    // Convert price to cents for Stripe
    const priceCents = Math.round(parseFloat(price) * 100);

    let product: Stripe.Product;
    try {
      // Create Stripe product with metadata
      product = await stripe.products.create({
        name,
        description,
        metadata: {
          product_type: "training",
          training: "true",
        },
      });
      console.log("Created Stripe product:", JSON.stringify(product, null, 2));
    } catch (stripeError) {
      console.error("Error creating Stripe product:", stripeError);
      return NextResponse.json(
        { error: "Error creating Stripe product", details: stripeError },
        { status: 500 }
      );
    }

    let priceObject: Stripe.Price;
    try {
      // Create Stripe price
      priceObject = await stripe.prices.create({
        product: product.id,
        unit_amount: priceCents,
        currency: "usd",
      });
    } catch (stripeError) {
      console.error("Error creating Stripe price:", stripeError);
      return NextResponse.json(
        { error: "Error creating Stripe price", details: stripeError },
        { status: 500 }
      );
    }

    const supabase = createClient();

    // Insert into class_schedules table only
    const { data, error } = await supabase
      .from("class_schedules")
      .insert({
        title: name,
        description,
        price,
        start_time,
        end_time,
        stripe_product_id: product.id,
        stripe_price_id: priceObject.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting into class_schedules:", error);
      return NextResponse.json(
        { error: "Error creating class schedule", details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      productId: product.id,
      priceId: priceObject.id,
      classData: data,
      productMetadata: product.metadata,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Unexpected error occurred", details: error },
      { status: 500 }
    );
  }
}
