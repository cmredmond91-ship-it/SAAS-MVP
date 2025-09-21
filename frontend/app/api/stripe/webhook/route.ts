import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠ service role required
);

// Disable body parsing (Stripe needs raw body)
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  try {
    const event = stripe.webhooks.constructEvent(
      rawBody,
      sig as string,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );

    switch (event.type) {
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // ✅ Update Supabase profile with subscription info
        await supabase
          .from("profiles")
          .update({
            subscription_status: subscription.status, // "active", "trialing", etc.
            subscription_id: subscription.id,
          })
          .eq("stripe_customer_id", customerId);

        console.log("✅ Subscription created:", subscription.id);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await supabase
          .from("profiles")
          .update({
            subscription_status: subscription.status,
          })
          .eq("stripe_customer_id", customerId);

        console.log("🔄 Subscription updated:", subscription.id);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await supabase
          .from("profiles")
          .update({
            subscription_status: "canceled",
            subscription_id: null,
          })
          .eq("stripe_customer_id", customerId);

        console.log("❌ Subscription canceled:", subscription.id);
        break;
      }

      case "invoice.payment_failed": {
        console.warn("❌ Payment failed");
        break;
      }

      default:
        console.log(`Unhandled event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("❌ Webhook Error:", err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }
}

