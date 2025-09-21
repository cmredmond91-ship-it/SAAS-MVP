const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const fs = require("fs");
const bodyParser = require("body-parser");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

// Path for customers.json
const filePath = "./data/customers.json";

// Helpers to load/save customers
function loadCustomers() {
  if (!fs.existsSync("./data")) fs.mkdirSync("./data");
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify([], null, 2));
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function saveCustomers(customers) {
  fs.writeFileSync(filePath, JSON.stringify(customers, null, 2));
}

// ✅ Create PaymentIntent
router.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount, currency, email } = req.body;

    console.log("📥 Incoming create-payment-intent request:");
    console.log("   amount:", amount);
    console.log("   currency:", currency);
    console.log("   email:", email);

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      receipt_email: email,
      automatic_payment_methods: { enabled: true },
    });

    console.log("✅ Created PaymentIntent:", paymentIntent.id);

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("❌ Stripe Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Stripe webhook route
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
      const email = paymentIntent.receipt_email || paymentIntent.metadata?.email;

      console.log("✅ PaymentIntent succeeded for:", email);

      if (email) {
        let customers = loadCustomers();

        let customer = customers.find((c) => c.email === email);
        if (customer) {
          customer.paid = true;
          console.log(`✅ Marked ${email} as Paid`);
        } else {
          const newCustomer = {
            id: customers.length > 0 ? Math.max(...customers.map((c) => c.id)) + 1 : 1,
            name: "",
            email,
            paid: true,
            notes: "",
            history: [],
          };
          customers.push(newCustomer);
          console.log(`🆕 Created new customer: ${email} (Paid)`);
        }

        try {
          saveCustomers(customers);
        } catch (err) {
          console.error("❌ Failed to update/create customer:", err);
        }
      }
    }

    res.json({ received: true });
  }
);

module.exports = router;



