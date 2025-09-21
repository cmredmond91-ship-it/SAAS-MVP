"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Logged in → send to dashboard
        router.replace("/dashboard");
      } else {
        // Not logged in → send to login
        router.replace("/login");
      }
    };

    checkUser();
  }, [router]);

  return (
    <main className="flex items-center justify-center h-screen">
      <p className="text-lg text-gray-600">Redirecting...</p>
    </main>
  );
}

