"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function UpgradePage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [currentPlan, setCurrentPlan] = useState<string>("free");

  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push("/login"); // just in case
        return;
      }
      setUser(data.session.user);

      // fetch current plan from DB (Supabase "profiles" or "subscriptions" table)
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", data.session.user.id)
        .single();

      if (profile?.plan) setCurrentPlan(profile.plan);
      setLoading(false);
    };

    getUser();
  }, [router]);

  const handleUpgrade = async (plan: string) => {
    if (!user) return;

    setLoading(true);

    // 1. Call backend to create Stripe checkout session
    const res = await fetch("/api/create-stripe-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        email: user.email,
        plan,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Failed to start upgrade");
      setLoading(false);
      return;
    }

    // 2. Redirect to Stripe Checkout
    if (data.url) {
      window.location.href = data.url;
    } else {
      toast.error("Stripe checkout URL missing");
      setLoading(false);
    }
  };

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <main className="p-6 max-w-lg mx-auto bg-white rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-4">Upgrade Plan</h1>
      <p className="mb-6 text-gray-600">
        Current plan: <strong>{currentPlan}</strong>
      </p>

      <div className="space-y-4">
        <button
          onClick={() => handleUpgrade("pro")}
          className="w-full px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          disabled={loading}
        >
          Upgrade to Pro
        </button>
        <button
          onClick={() => handleUpgrade("enterprise")}
          className="w-full px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700"
          disabled={loading}
        >
          Upgrade to Enterprise
        </button>
      </div>
    </main>
  );
}


