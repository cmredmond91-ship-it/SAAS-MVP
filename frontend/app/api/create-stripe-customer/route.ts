import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Init Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

// Init Supabase (service role, server-side only!)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ NOT the anon key
);

export async function POST(req: Request) {
  try {
    const { userId, email } = await req.json();

    // 1. Create Stripe customer
    const customer = await stripe.customers.create({
      email,
    });

    // 2. Save the Stripe ID in Supabase
    const { error } = await supabase
      .from("profiles")
      .update({ stripe_customer_id: customer.id })
      .eq("id", userId);

    if (error) throw error;

    return NextResponse.json({ stripeCustomerId: customer.id });
  } catch (error: any) {
    console.error("Stripe customer creation failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

