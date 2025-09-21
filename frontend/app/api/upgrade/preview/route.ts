import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { userId, newPriceId } = await req.json();

    if (!userId || !newPriceId) {
      return NextResponse.json(
        { error: "Missing userId or newPriceId" },
        { status: 400 }
      );
    }

    // 🔎 Lookup profile
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

    // 🆕 Create Stripe customer if missing
    if (!customerId || customerId === "''::text") {
      const customer = await stripe.customers.create({
        email: profile.email || undefined,
        metadata: { supabaseUserId: userId },
      });
      customerId = customer.id;

      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", userId);
    }

    // 🔍 Lookup active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (!subscriptions.data.length) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 400 }
      );
    }

    const subscription = subscriptions.data[0];

    // 🧪 Try both styles (new SDK vs older SDK)
    let upcoming: Stripe.UpcomingInvoice | null = null;

    try {
      // ✅ Modern SDK
      upcoming = await (stripe.invoices as any).retrieveUpcoming({
        customer: customerId,
        subscription: subscription.id,
        subscription_items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
      });
    } catch (err: any) {
      console.warn("⚠ retrieveUpcoming failed in new style:", err.message);

      if (typeof (stripe.invoices as any).upcoming === "function") {
        // 🕰️ Legacy fallback
        upcoming = await (stripe.invoices as any).upcoming({
          customer: customerId,
          subscription: subscription.id,
          subscription_items: [
            {
              id: subscription.items.data[0].id,
              price: newPriceId,
            },
          ],
        });
      } else {
        throw new Error("Stripe SDK does not support invoice previews. Please upgrade `stripe` npm package.");
      }
    }

    const prorationAmount =
      upcoming?.lines?.data.reduce(
        (sum, line) => sum + (line.amount ?? 0),
        0
      ) || 0;

    return NextResponse.json({
      prorationAmount,
      currency: upcoming?.currency,
    });
  } catch (err: any) {
    console.error("❌ Upgrade Preview error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


