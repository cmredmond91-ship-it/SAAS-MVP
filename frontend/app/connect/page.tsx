"use client";

import React from "react";

export default function ConnectPage() {
  return (
    <main className="p-10 text-center">
      <h1 className="text-2xl font-bold mb-4">Connect Stripe</h1>

      <a
        href="/api/stripe/connect"
        className="bg-blue-600 text-white px-6 py-3 rounded"
      >
        Connect Now
      </a>
    </main>
  );
}
