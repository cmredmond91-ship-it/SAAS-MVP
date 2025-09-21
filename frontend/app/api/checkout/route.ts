import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // service role key needed
);

export async function POST(req: Request) {
  try {
    const { userId, priceId } = await req.json();

    if (!userId || !priceId) {
      return NextResponse.json(
        { error: "Missing userId or priceId" },
        { status: 400 }
      );
    }

    // 1️⃣ Lookup profile
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("stripe_customer_id, email")
      .eq("id", userId)
      .single();

    if (error) throw error;
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    let customerId = profile.stripe_customer_id;

    // 2️⃣ Create Stripe customer if missing
    if (!customerId || customerId === "''::text") {
      const customer = await stripe.customers.create({
        email: profile.email || undefined,
        metadata: { supabaseUserId: userId },
      });

      customerId = customer.id;

      // Save back to Supabase
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", userId);
    }

    // 🌍 Ensure we have a valid base URL
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    // 3️⃣ Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/dashboard/billing?success=true`,
      cancel_url: `${siteUrl}/dashboard/billing?canceled=true`,
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL");
    }

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("❌ Checkout error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


