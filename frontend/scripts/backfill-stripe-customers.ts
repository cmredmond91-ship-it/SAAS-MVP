import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" }); // ✅ ensures your .env.local is loaded

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

console.log("🔑 STRIPE_SECRET_KEY loaded?", !!process.env.STRIPE_SECRET_KEY);
console.log("🔑 SUPABASE_SERVICE_ROLE_KEY loaded?", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function backfillStripeCustomers() {
  // 1. Find profiles without stripe_customer_id
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id")
    .is("stripe_customer_id", null);

  if (error) {
    console.error("❌ Supabase fetch error:", error.message);
    return;
  }

  console.log(`Found ${profiles?.length || 0} profiles to backfill`);

  for (const profile of profiles || []) {
    try {
      // 2. Get email from auth.users
      const { data: userData, error: userError } =
        await supabase.auth.admin.getUserById(profile.id);

      if (userError || !userData?.user) {
        console.error(`⚠️ Skipping ${profile.id}, no auth.user found`);
        continue;
      }

      const email = userData.user.email;

      // 3. Create Stripe customer
      const customer = await stripe.customers.create({
        email: email || undefined,
        metadata: { supabaseUserId: profile.id },
      });

      // 4. Save Stripe customer ID into profiles
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ stripe_customer_id: customer.id })
        .eq("id", profile.id);

      if (updateError) throw updateError;

      console.log(`✅ Backfilled user ${profile.id} → ${customer.id}`);
    } catch (err: any) {
      console.error(`❌ Failed for user ${profile.id}:`, err.message);
    }
  }

  console.log("🎉 Backfill complete");
}

backfillStripeCustomers();

