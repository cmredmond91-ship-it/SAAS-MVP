const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const bodyParser = require("body-parser");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

// Use raw body for Stripe webhook verification
router.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      const email =
        paymentIntent.receipt_email || paymentIntent.metadata.customerEmail;

      console.log("✅ Payment succeeded for:", email);

      // 👉 Update in-memory customers list
      const customer = require("./customers").customers?.find(
        (c) => c.email.toLowerCase() === email.toLowerCase()
      );

      if (customer) {
        customer.paid = true;
        console.log(`💰 Customer ${email} marked as paid ✅`);
      }
    }

    res.json({ received: true });
  }
);

module.exports = router;

