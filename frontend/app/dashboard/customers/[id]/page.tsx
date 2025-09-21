"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { supabase } from "../../../../lib/supabaseClient";

export default function CustomerProfilePage() {
  const { id } = useParams();
  const router = useRouter();

  const [customer, setCustomer] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);

  // Billing summary
  const [billing, setBilling] = useState<any>(null);

  // Notes state
  const [notes, setNotes] = useState("");

  // Fetch customer info
  const fetchCustomer = async () => {
    try {
      const res = await fetch(`http://localhost:5000/customers/${id}`);
      if (!res.ok) throw new Error("Failed to fetch customer");
      const data = await res.json();
      setCustomer(data);
      setNotes(data.notes || "");
    } catch (err) {
      console.error("❌ Fetch customer error:", err);
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch billing from backend
  const fetchBilling = async () => {
    try {
      const res = await fetch(`http://localhost:5000/stripe/customer/${id}`);
      if (!res.ok) throw new Error("Failed to fetch billing");
      const data = await res.json();
      setBilling(data);
    } catch (err) {
      console.error("❌ Fetch billing error:", err);
    }
  };

  useEffect(() => {
    fetchCustomer();
    fetchBilling();

    // ✅ Refresh billing after success
    if (localStorage.getItem("refreshBilling") === "true") {
      fetchBilling().then(() => {
        toast.success("✅ Billing updated after payment");
        localStorage.removeItem("refreshBilling");
      });
    }
  }, [id]);

  // Save notes
  const saveNotes = async () => {
    try {
      await fetch(`http://localhost:5000/customers/${id}/notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      toast.success("📝 Notes saved");
      fetchCustomer();
    } catch (err) {
      console.error("❌ Save notes error:", err);
      toast.error("Failed to save notes");
    }
  };

  // ✅ Skeleton Loader
  if (loading) {
    return (
      <main className="p-6 max-w-5xl mx-auto animate-pulse">
        <div className="h-6 w-40 bg-gray-200 rounded mb-4"></div>
        <div className="h-8 w-64 bg-gray-300 rounded mb-6"></div>
        <div className="flex gap-4 mb-6">
          <div className="h-8 w-20 bg-gray-200 rounded"></div>
          <div className="h-8 w-20 bg-gray-200 rounded"></div>
          <div className="h-8 w-20 bg-gray-200 rounded"></div>
        </div>
        <div className="h-40 w-full bg-gray-100 rounded"></div>
      </main>
    );
  }

  // ✅ Styled Not Found State
  if (!customer) {
    return (
      <main className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Customer Not Found</h1>
        <p className="text-gray-600 mb-6">
          The customer with ID <span className="font-mono">{id}</span> could not be found.
        </p>
        <button
          onClick={() => router.push("/customers")}
          className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700"
        >
          ← Back to Customers
        </button>
      </main>
    );
  }

  // Billing helpers
  const totalRevenue = billing?.invoices?.reduce(
    (sum: number, inv: any) => sum + inv.amount_paid,
    0
  );
  const lastPaymentDate =
    billing?.invoices?.[0] &&
    new Date(billing.invoices[0].created * 1000).toLocaleDateString();

  return (
    <main className="p-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500">
        <span
          className="hover:underline cursor-pointer"
          onClick={() => router.push("/")}
        >
          Dashboard
        </span>{" "}
        /{" "}
        <span
          className="hover:underline cursor-pointer"
          onClick={() => router.push("/customers")}
        >
          Customers
        </span>{" "}
        / <span className="text-gray-700">{customer.name || customer.email}</span>
      </nav>

      <h1 className="text-3xl font-bold mb-4">
        {customer.name || "Unnamed"} ({customer.email})
      </h1>

      {/* Tabs */}
      <div className="flex gap-4 border-b mb-4">
        {["profile", "notes", "history", "billing"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 px-2 ${
              activeTab === tab
                ? "border-b-2 border-blue-600 font-semibold"
                : "text-gray-500"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="border rounded p-4 shadow bg-white">
          <p>
            <strong>Email:</strong> {customer.email}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            {customer.paid ? (
              <span className="text-green-600 font-medium">Paid</span>
            ) : (
              <span className="text-red-600 font-medium">Unpaid</span>
            )}
          </p>
        </div>
      )}

      {/* Notes Tab */}
      {activeTab === "notes" && (
        <div className="border rounded p-4 shadow bg-white space-y-4">
          <h2 className="text-xl font-bold">Notes</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border rounded p-2"
            rows={5}
          />
          <button
            onClick={saveNotes}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
          >
            Save Notes
          </button>
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div className="border rounded p-4 shadow bg-white">
          <h2 className="text-xl font-bold mb-2">History</h2>
          {customer.history && customer.history.length > 0 ? (
            <ul className="space-y-2">
              {customer.history
                .slice()
                .reverse()
                .map((h: any, i: number) => (
                  <li key={i} className="p-2 border rounded bg-gray-50">
                    <p className="text-sm text-gray-500">
                      {new Date(h.timestamp).toLocaleString()}
                    </p>
                    <ul className="text-sm">
                      {Object.entries(h.changes).map(([field, change]: any, idx) => (
                        <li key={idx}>
                          <strong>{field}:</strong> {change.old ?? "-"} →{" "}
                          {change.new ?? "-"}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-gray-600">No changes recorded yet.</p>
          )}
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === "billing" && (
        <div className="border rounded p-4 shadow bg-white space-y-6">
          <h2 className="text-xl font-bold">Billing</h2>

          {/* Summary */}
          <div className="space-y-1">
            <p className="text-lg font-semibold text-gray-700">
              Total Revenue:{" "}
              <span className="text-green-600">
                ${(totalRevenue / 100).toFixed(2)} USD
              </span>
            </p>
            <p className="text-gray-700">
              Last Payment:{" "}
              {lastPaymentDate ? (
                <span className="font-medium">{lastPaymentDate}</span>
              ) : (
                "No payments yet"
              )}
            </p>
            <p className="text-gray-700 flex items-center gap-3">
              Next Invoice:{" "}
              {billing?.upcoming ? (
                <>
                  <span className="font-medium">
                    ${(billing.upcoming.amount_due / 100).toFixed(2)} USD — Due{" "}
                    {new Date(
                      billing.upcoming.next_payment_attempt * 1000
                    ).toLocaleDateString()}
                  </span>
                  <button
                    onClick={async () => {
                      try {
                        localStorage.setItem("lastPaidCustomerId", customer.id);
                        const res = await fetch(
                          "http://localhost:5000/stripe/pay-invoice",
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              customerId: billing.upcoming.customer,
                              invoiceId: billing.upcoming.id,
                            }),
                          }
                        );
                        const data = await res.json();
                        if (data.url) {
                          window.location.href = data.url;
                        } else {
                          toast.error("Failed to start payment");
                        }
                      } catch (err) {
                        console.error("❌ Pay Now Error:", err);
                        toast.error("Error creating checkout session");
                      }
                    }}
                    className="bg-blue-600 text-white px-3 py-1 rounded shadow hover:bg-blue-700"
                  >
                    Pay Now
                  </button>
                </>
              ) : (
                "No upcoming invoice"
              )}
            </p>
          </div>

          {/* Invoices */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Invoices</h3>
            {billing?.invoices?.length > 0 ? (
              <ul className="space-y-2">
                {billing.invoices.map((inv: any) => (
                  <li
                    key={inv.id}
                    className="p-2 border rounded bg-gray-50 flex justify-between"
                  >
                    <div>
                      <p className="text-sm text-gray-700">
                        Amount: ${(inv.amount_paid / 100).toFixed(2)} USD
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(inv.created * 1000).toLocaleDateString()}
                      </p>
                    </div>
                    <a
                      href={inv.hosted_invoice_url}
                      target="_blank"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View Invoice
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">No invoices found.</p>
            )}
          </div>

          {/* Charges */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Charges</h3>
            {billing?.charges?.length > 0 ? (
              <ul className="space-y-2">
                {billing.charges.map((ch: any) => (
                  <li
                    key={ch.id}
                    className="p-2 border rounded bg-gray-50 flex justify-between"
                  >
                    <div>
                      <p className="text-sm text-gray-700">
                        Amount: ${(ch.amount / 100).toFixed(2)} USD
                      </p>
                      <p className="text-sm text-gray-500">Status: {ch.status}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(ch.created * 1000).toLocaleDateString()}
                      </p>
                    </div>
                    {ch.receipt_url && (
                      <a
                        href={ch.receipt_url}
                        target="_blank"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View Receipt
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">No charges found.</p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}


