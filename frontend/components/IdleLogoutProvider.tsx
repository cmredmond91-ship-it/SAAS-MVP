"use client";

import { useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function IdleLogoutProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    let idleTimeout: NodeJS.Timeout;
    let absoluteTimeout: NodeJS.Timeout;

    const logout = async () => {
      await supabase.auth.signOut();
      router.push("/login");
    };

    const resetIdleTimer = () => {
      clearTimeout(idleTimeout);
      // 30 minutes = 30 * 60 * 1000
      idleTimeout = setTimeout(logout, 30 * 60 * 1000);
    };

    const startAbsoluteTimer = () => {
      clearTimeout(absoluteTimeout);
      // 12 hours = 12 * 60 * 60 * 1000
      absoluteTimeout = setTimeout(logout, 12 * 60 * 60 * 1000);
    };

    // Listen for Supabase auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        router.push("/login");
      }
    });

    // Reset idle timer on user activity
    window.addEventListener("mousemove", resetIdleTimer);
    window.addEventListener("keydown", resetIdleTimer);
    window.addEventListener("click", resetIdleTimer);

    // Kick off timers
    resetIdleTimer();
    startAbsoluteTimer();

    return () => {
      clearTimeout(idleTimeout);
      clearTimeout(absoluteTimeout);
      listener.subscription.unsubscribe();
      window.removeEventListener("mousemove", resetIdleTimer);
      window.removeEventListener("keydown", resetIdleTimer);
      window.removeEventListener("click", resetIdleTimer);
    };
  }, [router]);

  return <>{children}</>;
}

