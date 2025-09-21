"use client";
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function OnboardPage() {
  const [loading, setLoading] = useState(false);

  const connectStripe = async () => {
    setLoading(true);
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const res = await fetch("http://localhost:5000/stripe/create-account-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email }),
    });

    const data = await res.json();
    window.location.href = data.url;
  };

  return (
    <div className="p-10 text-center">
      <h1 className="text-2xl font-bold mb-4">Connect Stripe</h1>
      <button
        onClick={connectStripe}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-2 rounded"
      >
        {loading ? "Redirecting..." : "Connect with Stripe"}
      </button>
    </div>
  );
}
