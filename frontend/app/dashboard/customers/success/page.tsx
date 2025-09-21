"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SuccessPage() {
  const router = useRouter();
  const [customerId, setCustomerId] = useState<string | null>(null);

  useEffect(() => {
    // ✅ Mark billing for refresh
    localStorage.setItem("refreshBilling", "true");

    // ✅ Grab lastPaidCustomerId from localStorage
    const id = localStorage.getItem("lastPaidCustomerId");
    if (id) setCustomerId(id);
  }, []);

  return (
    <main className="p-6 text-center">
      <h1 className="text-2xl font-bold text-green-600">
        ✅ Payment Successful!
      </h1>
      <p className="mt-2">Your invoice has been paid successfully.</p>

      <div className="flex gap-4 justify-center mt-6">
        <button
          onClick={() => router.push("/customers")}
          className="bg-gray-600 text-white px-4 py-2 rounded shadow hover:bg-gray-700"
        >
          Back to Customers
        </button>

        {customerId && (
          <button
            onClick={() => router.push(`/customers/${customerId}`)}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
          >
            Back to Profile
          </button>
        )}
      </div>
    </main>
  );
}
