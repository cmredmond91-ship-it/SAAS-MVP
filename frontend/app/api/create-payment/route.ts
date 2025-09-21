import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // 👈 service role key required
);

export async function POST(req: Request) {
  const { userId } = await req.json();

  // 1. Look up the user's Stripe ID in Supabase
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  if (error || !profile?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No Stripe customer ID found for user" },
      { status: 400 }
    );
  }

  // 2. Create a PaymentIntent in Stripe
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 2000, // $20.00 (amount is in cents)
    currency: "usd",
    customer: profile.stripe_customer_id,
  });

  return NextResponse.json({ clientSecret: paymentIntent.client_secret });
}
