"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSearchParams } from "next/navigation";
import SubscribeButton from "@/components/SubscribeButton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import toast from "react-hot-toast";

interface Subscription {
  id: string;
  product: string;
  amount: string; // e.g. "$249/month"
  renewalDate: string;
  discount?: string; // e.g. "20%" or "$50"
  status: string;
  trial_end?: string;
  current_period_end?: string;
}

interface Invoice {
  id: string;
  amount: string;
  currency: string;
  status: string;
  created: string;
  invoice_pdf?: string;
}

export default function BillingPage() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [proration, setProration] = useState<{ display: string; newPriceId: string } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<{ brand: string; last4: string } | null>(null);

  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) throw new Error("Not logged in");

        setUserId(user.id);

        const res = await fetch(`/api/billing?userId=${user.id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load");

        setSubs(data.subscriptions || []);
        setInvoices(data.invoices || []);
        setPaymentMethod(data.paymentMethod || null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBilling();
  }, []);

  const handlePreviewUpgrade = async (newPriceId: string) => {
    if (!userId) return;

    try {
      const res = await fetch("/api/upgrade/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newPriceId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setProration({
        display: `$${(data.prorationAmount / 100).toFixed(2)} ${data.currency.toUpperCase()}`,
        newPriceId,
      });
    } catch (err: any) {
      toast.error(err.message || "Could not preview upgrade cost");
    }
  };

  const handleConfirmUpgrade = async () => {
    if (!userId || !proration) return;

    try {
      const res = await fetch("/api/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newPriceId: proration.newPriceId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("✅ Upgrade successful!");
      window.location.href = "/dashboard/billing?success=true";
    } catch (err: any) {
      toast.error(err.message || "Upgrade failed");
    }
  };

  // 🔽 Utility: compute discounted price
  const getDiscountedPrice = (amount: string, discount?: string) => {
    if (!discount) return null;

    const match = amount.match(/\$([\d.]+)/);
    if (!match) return null;

    let price = parseFloat(match[1]);

    if (discount.includes("%")) {
      const pct = parseFloat(discount.replace("%", ""));
      price = price - (price * pct) / 100;
    } else if (discount.includes("$")) {
      const flat = parseFloat(discount.replace("$", ""));
      price = price - flat;
    }

    return `$${price.toFixed(2)}/month`;
  };

  // figure out current plan rank
  const planRanks: Record<string, number> = { Basic: 1, Standard: 2, Premium: 3 };
  const activeSub = subs.find((s) => s.status === "active");
  const currentRank = activeSub ? planRanks[activeSub.product] : 0;

  if (loading) {
    return (
      <main className="p-6 max-w-4xl mx-auto space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-md bg-gray-200 animate-pulse" />
        ))}
      </main>
    );
  }

  // Get discount once (applies across all plans for this user)
  const globalDiscount = activeSub?.discount;

  return (
    <main className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Billing</h1>

      {success && <div className="rounded bg-green-100 text-green-700 p-3">🎉 Subscription activated successfully!</div>}
      {canceled && <div className="rounded bg-yellow-100 text-yellow-700 p-3">❌ Checkout canceled. No changes were made.</div>}
      {error && <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">❌ {error}</div>}

      {/* Subscription Plans */}
      <div className="space-y-4">
        {[
          {
            name: "Basic",
            priceId: "price_1S8oABFYsCZRpaBqJmrehstu",
            price: "$139/month",
            features: ["SEO Tools", "Basic Reports", "Email Support"],
            rank: 1,
          },
          {
            name: "Standard",
            priceId: "price_1S8oAzFYsCZRpaBqUIDyhgvS",
            price: "$249/month",
            features: ["Everything in Basic", "Advanced Analytics", "Priority Support"],
            rank: 2,
          },
          {
            name: "Premium",
            priceId: "price_1S8oBEFYsCZRpaBqtRZvtClU",
            price: "$399/month",
            features: ["Everything in Standard", "Custom Dashboards", "Dedicated Manager"],
            rank: 3,
          },
        ].map((plan) => {
          const isActive = activeSub?.product === plan.name;
          const discounted = globalDiscount ? getDiscountedPrice(plan.price, globalDiscount) : null;

          return (
            <Card key={plan.name} className="w-full">
              <CardHeader>
                <CardTitle>
                  {plan.name} – {plan.price}
                  {discounted && (
                    <span className="ml-2 text-blue-600 text-sm">(With discount: {discounted})</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="list-disc ml-5 text-sm text-gray-700">
                  {plan.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>

                {isActive ? (
                  <p className="text-green-600 font-medium">✅ You’re currently on this plan</p>
                ) : plan.rank <= currentRank ? (
                  // 🔒 Lower/equal tier → show card, but no button
                  null
                ) : !proration ? (
                  <button
                    onClick={() => handlePreviewUpgrade(plan.priceId)}
                    className="rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
                  >
                    Upgrade to {plan.name}
                  </button>
                ) : proration.newPriceId === plan.priceId ? (
                  <div className="space-y-2">
                    <p className="text-sm">
                      You’ll be charged <strong>{proration.display}</strong> today.
                    </p>
                    <button
                      onClick={handleConfirmUpgrade}
                      className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                    >
                      Confirm Upgrade
                    </button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Call to downgrade */}
      {subs.length > 0 && <p className="text-sm text-gray-600">📞 To downgrade or cancel, please call our support team.</p>}

      {/* Payment Method */}
      {paymentMethod && (
        <div className="rounded border bg-white p-4 shadow">
          <p className="text-sm text-gray-700">
            Card on file: {paymentMethod.brand} ending in {paymentMethod.last4}
          </p>
          <a href="/api/customer-portal" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
            Update payment method →
          </a>
        </div>
      )}

      {/* Invoices */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Invoices</h2>
        {invoices.length === 0 ? (
          <p>No invoices found</p>
        ) : (
          <table className="w-full border-collapse border rounded shadow bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2">Invoice ID</th>
                <th className="border px-4 py-2">Amount</th>
                <th className="border px-4 py-2">Status</th>
                <th className="border px-4 py-2">Created</th>
                <th className="border px-4 py-2">PDF</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="text-center">
                  <td className="border px-4 py-2">{inv.id}</td>
                  <td className="border px-4 py-2">
                    {inv.amount} {inv.currency}
                  </td>
                  <td className={`border px-4 py-2 font-semibold ${inv.status === "paid" ? "text-green-600" : "text-red-600"}`}>
                    {inv.status}
                  </td>
                  <td className="border px-4 py-2">{inv.created}</td>
                  <td className="border px-4 py-2">
                    {inv.invoice_pdf ? (
                      <a href={inv.invoice_pdf} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Download
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}



