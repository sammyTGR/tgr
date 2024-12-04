import { NextResponse } from "next/server";
import { stripe } from "@/utils/stripe/config";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId, priceId } = await req.json();

    // Delete the price first
    if (priceId) {
      await stripe.prices.update(priceId, { active: false });
    }

    // Then delete the product
    if (productId) {
      await stripe.products.update(productId, { active: false });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting Stripe product:", error);
    return NextResponse.json(
      { error: "Error deleting Stripe product", details: error.message },
      { status: 500 }
    );
  }
}
