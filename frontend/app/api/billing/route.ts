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

export async function GET(req: Request) {
  try {
    // Get userId from query (?userId=...)
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Lookup stripe_customer_id
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("stripe_customer_id, email")
      .eq("id", userId)
      .single();

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    let stripeCustomerId = profile?.stripe_customer_id;

    // 🛑 Handle the broken default (''::text) and NULLs
    if (!stripeCustomerId || stripeCustomerId === "''::text") {
      console.log(`⚡ Creating new Stripe customer for user ${userId}...`);

      const customer = await stripe.customers.create({
        email: profile?.email || undefined,
        metadata: { supabaseUserId: userId },
      });

      stripeCustomerId = customer.id;

      // Update Supabase with new Stripe customer ID
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", userId);

      console.log(`✅ Created Stripe customer ${customer.id} for user ${userId}`);
    }

    // ✅ Fetch subscriptions
    const subs = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      expand: ["data.items.data.price"],
      limit: 10,
    });

    const formattedSubs = await Promise.all(
      subs.data.map(async (sub) => {
        const item = sub.items.data[0];
        const price = item?.price as Stripe.Price;

        let productName = "N/A";
        if (price?.product) {
          try {
            const product = await stripe.products.retrieve(price.product as string);
            productName = product.name;
          } catch (err) {
            console.warn("⚠️ Could not fetch product:", err);
          }
        }

        return {
          id: sub.id,
          product: productName,
          amount:
            price?.unit_amount && price.currency
              ? `$${(price.unit_amount / 100).toFixed(2)}/${price.recurring?.interval}`
              : "N/A",
          renewalDate: sub.current_period_end
            ? new Date(sub.current_period_end * 1000).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "N/A",
          discount: sub.discount
            ? `${sub.discount.coupon?.percent_off || 0}% off`
            : "—",
          status: sub.status,
        };
      })
    );

    // ✅ Fetch invoices
    const invoices = await stripe.invoices.list({
      customer: stripeCustomerId,
      limit: 10,
    });

    const formattedInvoices = invoices.data.map((inv) => ({
      id: inv.id,
      amount: (inv.amount_paid / 100).toFixed(2),
      currency: inv.currency.toUpperCase(),
      status: inv.status,
      created: new Date(inv.created * 1000).toLocaleDateString("en-US"),
      hosted_invoice_url: inv.hosted_invoice_url,
      invoice_pdf: inv.invoice_pdf,
    }));

    return NextResponse.json({
      subscriptions: formattedSubs,
      invoices: formattedInvoices,
      stripeCustomerId,
    });
  } catch (err: any) {
    console.error("Billing fetch error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}





