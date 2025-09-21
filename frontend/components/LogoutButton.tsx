"use client";

import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { toast } from "react-hot-toast";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("❌ Logout failed");
      return;
    }
    toast.success("👋 Logged out");
    router.push("/login");
  };

  return (
    <button
      onClick={handleLogout}
      className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
    >
      Logout
    </button>
  );
}


