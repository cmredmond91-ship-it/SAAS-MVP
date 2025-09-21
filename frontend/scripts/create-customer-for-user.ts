import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" }); // 👈 force load this file

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

console.log("🔑 STRIPE_SECRET_KEY present?", !!process.env.STRIPE_SECRET_KEY);
console.log("🔑 SUPABASE_SERVICE_ROLE_KEY present?", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

// Init Supabase (use service role key, not anon)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const userId = "fc4700f8-9cb8-47d3-adfc-bb4d8449b520"; // 👈 your real Supabase user ID
  const email = "youruser@email.com"; // 👈 update to the user’s email

  console.log("👉 Creating Stripe customer for user:", userId);

  try {
    // 1. Create customer in Stripe
    const customer = await stripe.customers.create({
      email,
      metadata: { supabaseUserId: userId },
    });

    console.log("✅ Created Stripe customer:", customer.id);

    // 2. Save back into Supabase
    const { error } = await supabase
      .from("profiles")
      .update({ stripe_customer_id: customer.id, email })
      .eq("id", userId);

    if (error) throw error;

    console.log("✅ Updated Supabase with Stripe ID:", customer.id);
  } catch (err: any) {
    console.error("❌ Error:", err.message);
  }
}

main();
