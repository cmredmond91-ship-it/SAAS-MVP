"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { supabase } from "../../lib/supabaseClient";

// Load Stripe.js with your publishable key
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string
);

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // ✅ Get Supabase user email
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession();
      const email = data.session?.user?.email || null;
      console.log("📧 Checkout email from Supabase:", email);
      setUserEmail(email);
    };
    getUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !userEmail) {
      console.error("❌ Missing stripe, elements, or userEmail");
      return;
    }

    setLoading(true);

    try {
      // ✅ Call backend to create PaymentIntent
      const res = await fetch(
        "http://localhost:5000/stripe/create-payment-intent",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: 1000, // $10
            currency: "usd",
            email: userEmail, // 👈 ensure email is passed
          }),
        }
      );

      const { clientSecret } = await res.json();
      console.log("🔑 Received clientSecret:", clientSecret);

      // ✅ Confirm card payment with Stripe
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });

      if (result.error) {
        setMessage(`❌ Payment failed: ${result.error.message}`);
      } else if (result.paymentIntent?.status === "succeeded") {
        setMessage("✅ Payment successful!");
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      setMessage("❌ Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 max-w-md mx-auto border rounded shadow space-y-4"
    >
      <h1 className="text-2xl font-bold">Checkout</h1>
      <p className="text-gray-600">Pay with your card below:</p>

      <CardElement className="p-3 border rounded" />

      <button
        type="submit"
        disabled={!stripe || loading}
        className={`w-full px-4 py-2 rounded text-white ${
          loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {loading ? "Processing..." : "Pay $10"}
      </button>

      {message && <p className="mt-4">{message}</p>}
    </form>
  );
}

export default function CheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}

