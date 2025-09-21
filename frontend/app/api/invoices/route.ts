import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

// ⚠️ Use service role key here since we’re reading another user’s profile
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // ✅ Lookup stripe_customer_id from Supabase
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userId)
      .single();

    if (error || !profile?.stripe_customer_id) {
      throw new Error("No Stripe customer found for this user");
    }

    // ✅ Fetch invoices from Stripe
    const invoices = await stripe.invoices.list({
      customer: profile.stripe_customer_id,
      limit: 10, // fetch last 10 invoices
    });

    // ✅ Format response for frontend
    const formatted = invoices.data.map((inv) => ({
      id: inv.id,
      amount_paid: inv.amount_paid
        ? `$${(inv.amount_paid / 100).toFixed(2)}`
        : "—",
      currency: inv.currency?.toUpperCase(),
      status: inv.status,
      created: new Date(inv.created * 1000).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      hosted_invoice_url: inv.hosted_invoice_url, // Stripe-hosted HTML invoice
      invoice_pdf: inv.invoice_pdf, // direct PDF download link
    }));

    return NextResponse.json({ invoices: formatted });
  } catch (err: any) {
    console.error("Invoice fetch error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

