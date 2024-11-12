"use server";

import { NextResponse } from "next/server";
import { stripe } from "@/utils/stripe/config";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const { name, description, price, start_time, end_time } = await req.json();
    // console.log("Received data:", {
    //   name,
    //   description,
    //   price,
    //   start_time,
    //   end_time,
    // });

    // Create Stripe product with metadata
    let product;
    try {
      product = await stripe.products.create({
        name,
        description,
        metadata: {
          product_type: "training",
          training: "true",
        },
      });
      // console.log("Stripe product created:", product);
    } catch (stripeError) {
      console.error("Error creating Stripe product:", stripeError);
      return NextResponse.json(
        { error: "Error creating Stripe product", details: stripeError },
        { status: 500 }
      );
    }

    // Create Stripe price
    let stripePrice;
    try {
      stripePrice = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(price * 100), // Stripe uses cents
        currency: "usd",
      });
      // console.log("Stripe price created:", stripePrice);
    } catch (stripeError) {
      console.error("Error creating Stripe price:", stripeError);
      return NextResponse.json(
        { error: "Error creating Stripe price", details: stripeError },
        { status: 500 }
      );
    }

    const supabase = createClient();

    // Insert into class_schedules table
    let data, error;
    try {
      const result = await supabase
        .from("class_schedules")
        .insert({
          title: name, // Use 'title' instead of 'name' to match the table structure
          description,
          price,
          start_time,
          end_time,
          stripe_product_id: product.id,
          stripe_price_id: stripePrice.id,
        })
        .select()
        .single();

      data = result.data;
      error = result.error;

      // console.log("Supabase insert result:", { data, error });
    } catch (supabaseError) {
      console.error("Error inserting into class_schedules:", supabaseError);
      return NextResponse.json(
        { error: "Error creating class schedule", details: supabaseError },
        { status: 500 }
      );
    }

    if (error) {
      console.error("Error inserting into class_schedules:", error);
      return NextResponse.json(
        { error: "Error creating class schedule", details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      productId: product.id,
      priceId: stripePrice.id,
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
