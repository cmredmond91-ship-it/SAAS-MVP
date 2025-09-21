import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

export async function POST() {
  const supabase = createRouteHandlerClient({ cookies });

  // 1. Get logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Check if profile already has a Stripe customer ID
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (profile?.stripe_customer_id) {
    return NextResponse.json({ customerId: profile.stripe_customer_id });
  }

  // 3. Create new Stripe customer
  const customer = await stripe.customers.create({
    email: user.email ?? undefined,
  });

  // 4. Save customer ID in Supabase
  await supabase.from("profiles").update({
    stripe_customer_id: customer.id,
  }).eq("id", user.id);

  return NextResponse.json({ customerId: customer.id });
}
