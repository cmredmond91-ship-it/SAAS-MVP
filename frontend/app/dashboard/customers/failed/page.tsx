"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FailedPage() {
  const router = useRouter();

  useEffect(() => {
    // Clear any billing refresh flags just in case
    localStorage.removeItem("refreshBilling");
  }, []);

  return (
    <main className="p-6 text-center">
      <h1 className="text-2xl font-bold text-red-600">
        ❌ Payment Failed
      </h1>
      <p className="mt-2">
        Something went wrong with your payment. Please try again or contact
        support if the issue continues.
      </p>

      <div className="flex gap-4 justify-center mt-6">
        <button
          onClick={() => router.push("/customers")}
          className="bg-gray-600 text-white px-4 py-2 rounded shadow hover:bg-gray-700"
        >
          Back to Customers
        </button>

        {typeof window !== "undefined" && localStorage.getItem("lastPaidCustomerId") && (
          <button
            onClick={() =>
              router.push(
                `/customers/${localStorage.getItem("lastPaidCustomerId")}`
              )
            }
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
          >
            Back to Profile
          </button>
        )}
      </div>
    </main>
  );
}
