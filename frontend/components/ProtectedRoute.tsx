"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { toast } from "react-hot-toast";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();

      const allowedEmails =
        process.env.NEXT_PUBLIC_ALLOWED_EMAILS?.split(",").map((e) => e.trim().toLowerCase()) || [];

      const userEmail = data.session?.user?.email?.toLowerCase();

      if (!data.session || !userEmail || !allowedEmails.includes(userEmail)) {
        toast.error("Unauthorized access");
        router.push("/login");
        return;
      }

      setLoading(false);
    };

    checkSession();
  }, [router]);

  if (loading) {
    return <p className="p-6">Loading...</p>;
  }

  return <>{children}</>;
}

