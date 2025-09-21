"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "react-hot-toast";

export default function SubscribeButton({
  priceId,
  label,
}: {
  priceId: string;
  label: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    try {
      setLoading(true);

      // 🔑 Get current user
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        toast.error("You must be logged in to subscribe");
        return;
      }

      // 🔁 Call backend
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          priceId, // 👈 dynamic
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url; // ✅ Redirect to Stripe Checkout
      } else {
        toast.error(data.error || "Failed to start checkout");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSubscribe}
      disabled={loading}
      className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? "Redirecting..." : label}
    </button>
  );
}




