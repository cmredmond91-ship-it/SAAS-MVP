"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import toast, { Toaster } from "react-hot-toast";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Lock, Unlock } from "lucide-react";

import ProfileCard from "./components/ProfileCard";
import MetricsWidget from "./components/MetricsWidget";
import ActivityFeed from "./components/activityfeed";
import EmployeeManagement from "./components/EmployeeManagement";
import WidgetSettings from "./components/WidgetSettings";
import ResetLayoutModal from "./components/ResetLayoutModal";

// ✅ ResponsiveGridLayout with runtime guard
const ResponsiveGridLayout = dynamic(
  async () => {
    const mod = await import("react-grid-layout");
    console.log("react-grid-layout exports:", mod);

    const WidthProvider =
      (mod as any).WidthProvider || (mod as any).default?.WidthProvider;
    const Responsive =
      (mod as any).Responsive || (mod as any).default?.Responsive;

    if (!WidthProvider || !Responsive) {
      throw new Error(
        "❌ react-grid-layout: Could not find WidthProvider or Responsive export. Check console log above."
      );
    }

    return WidthProvider(Responsive);
  },
  { ssr: false }
);

// ✅ Desktop layouts
const adminDesktop = [
  { i: "profile", x: 0, y: 0, w: 1, h: 2 },
  { i: "metrics", x: 1, y: 0, w: 2, h: 2 },
  { i: "activity", x: 0, y: 2, w: 1, h: 3 },
  { i: "employees", x: 1, y: 2, w: 2, h: 3 },
];
const managerDesktop = [
  { i: "profile", x: 0, y: 0, w: 1, h: 2 },
  { i: "metrics", x: 1, y: 0, w: 2, h: 2 },
  { i: "activity", x: 0, y: 2, w: 3, h: 3 },
];
const techDesktop = [
  { i: "profile", x: 0, y: 0, w: 1, h: 2 },
  { i: "activity", x: 1, y: 0, w: 2, h: 3 },
];
const dispatcherDesktop = [
  { i: "profile", x: 0, y: 0, w: 1, h: 2 },
  { i: "employees", x: 1, y: 0, w: 2, h: 3 },
  { i: "activity", x: 0, y: 2, w: 3, h: 3 },
];
const userDesktop = [{ i: "profile", x: 0, y: 0, w: 3, h: 2 }];

// ✅ Mobile stacked layout
const mobileStack = (widgets: string[]) =>
  widgets.map((w, idx) => ({
    i: w,
    x: 0,
    y: idx * 2,
    w: 1,
    h: w === "activity" ? 3 : 2,
    static: true, // 🚫 cannot drag/resize on mobile
  }));

// ✅ Widgets map per role
const roleDefaults: Record<
  string,
  { lg: any[]; md: any[]; sm: any[]; xs: any[]; widgets: any }
> = {
  admin: {
    lg: adminDesktop,
    md: adminDesktop,
    sm: mobileStack(["profile", "metrics", "activity", "employees"]),
    xs: mobileStack(["profile", "metrics", "activity", "employees"]),
    widgets: { profile: true, metrics: true, activity: true, employees: true },
  },
  manager: {
    lg: managerDesktop,
    md: managerDesktop,
    sm: mobileStack(["profile", "metrics", "activity"]),
    xs: mobileStack(["profile", "metrics", "activity"]),
    widgets: { profile: true, metrics: true, activity: true, employees: false },
  },
  tech: {
    lg: techDesktop,
    md: techDesktop,
    sm: mobileStack(["profile", "activity"]),
    xs: mobileStack(["profile", "activity"]),
    widgets: { profile: true, metrics: false, activity: true, employees: false },
  },
  dispatcher: {
    lg: dispatcherDesktop,
    md: dispatcherDesktop,
    sm: mobileStack(["profile", "employees", "activity"]),
    xs: mobileStack(["profile", "employees", "activity"]),
    widgets: { profile: true, metrics: false, activity: true, employees: true },
  },
  user: {
    lg: userDesktop,
    md: userDesktop,
    sm: mobileStack(["profile"]),
    xs: mobileStack(["profile"]),
    widgets: { profile: true, metrics: false, activity: false, employees: false },
  },
};

type ResetScope = "all" | "desktop" | "mobile";

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [layouts, setLayouts] = useState<any>(roleDefaults.user);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetScope, setResetScope] = useState<ResetScope>("all");
  const [visibleWidgets, setVisibleWidgets] = useState(
    roleDefaults.user.widgets
  );
  const [locked, setLocked] = useState(false); // 🔒 NEW

  const toggleWidget = (w: string) => {
    setVisibleWidgets((prev) => ({
      ...prev,
      [w]: !prev[w],
    }));
  };

  // 🔐 Check auth + load role
  useEffect(() => {
    const init = async () => {
      const { data: authData, error } = await supabase.auth.getSession();
      if (error || !authData?.session) {
        toast.error("Please sign in to access dashboard");
        router.push("/login");
        return;
      }
      setSession(authData.session);

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.session.user.id)
        .single();

      const role = profile?.role || "user";
      const roleSeed = roleDefaults[role] || roleDefaults.user;

      const { data } = await supabase
        .from("layouts")
        .select("layouts, widgets")
        .eq("user_id", authData.session.user.id)
        .single();

      if (data) {
        const { lg, md, sm, xs } = data.layouts || {};
        setLayouts({
          lg: lg || roleSeed.lg,
          md: md || roleSeed.md,
          sm: sm || roleSeed.sm,
          xs: xs || roleSeed.xs,
        });
        setVisibleWidgets(data.widgets || roleSeed.widgets);
      } else {
        await supabase.from("layouts").insert({
          user_id: authData.session.user.id,
          layouts: {
            lg: roleSeed.lg,
            md: roleSeed.md,
            sm: roleSeed.sm,
            xs: roleSeed.xs,
          },
          widgets: roleSeed.widgets,
        });
        setLayouts(roleSeed);
        setVisibleWidgets(roleSeed.widgets);
      }
    };
    init();
  }, [router]);

  // 💾 Save layout
  const handleLayoutChange = async (_currentLayout: any, allLayouts: any) => {
    setLayouts(allLayouts);
    if (!session?.user) return;
    await supabase.from("layouts").upsert({
      user_id: session.user.id,
      layouts: allLayouts,
      widgets: visibleWidgets,
    });
  };

  // ♻️ Handle Reset Layout
  const handleReset = async () => {
    if (!session?.user) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();
    const role = profile?.role || "user";
    const roleSeed = roleDefaults[role] || roleDefaults.user;

    let resetLayouts = { ...layouts };
    if (resetScope === "all") {
      resetLayouts = roleSeed;
    } else if (resetScope === "desktop") {
      resetLayouts = { ...layouts, lg: roleSeed.lg, md: roleSeed.md };
    } else if (resetScope === "mobile") {
      resetLayouts = { ...layouts, sm: roleSeed.sm, xs: roleSeed.xs };
    }

    setLayouts(resetLayouts);
    setVisibleWidgets(roleSeed.widgets);

    await supabase.from("layouts").upsert({
      user_id: session.user.id,
      layouts: resetLayouts,
      widgets: roleSeed.widgets,
    });

    toast.success(
      resetScope === "all"
        ? "Layout reset for all breakpoints"
        : `Layout reset for ${resetScope} only`
    );
    setResetOpen(false);
  };

  if (!session) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Toaster position="top-right" />
      <div className="flex justify-between items-center mb-6 gap-3">
        <WidgetSettings visible={visibleWidgets} onToggle={toggleWidget} />

        <div className="flex gap-2">
          {/* 🔒 Lock Toggle */}
          <Button
            variant={locked ? "outline" : "secondary"}
            onClick={() => setLocked((p) => !p)}
          >
            {locked ? <Lock size={16} /> : <Unlock size={16} />}
            {locked ? " Locked" : " Unlocked"}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="destructive">Reset Layout</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() => {
                  setResetScope("all");
                  setResetOpen(true);
                }}
              >
                Reset All
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setResetScope("desktop");
                  setResetOpen(true);
                }}
              >
                Reset Desktop (lg/md)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setResetScope("mobile");
                  setResetOpen(true);
                }}
              >
                Reset Mobile (sm/xs)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
        cols={{ lg: 3, md: 2, sm: 1, xs: 1 }}
        rowHeight={80}
        margin={[20, 20]}
        containerPadding={[20, 20]}
        onLayoutChange={handleLayoutChange}
        // 🚀 Only draggable/resizable if unlocked and on desktop
        isResizable={!locked && (typeof window !== "undefined" ? window.innerWidth >= 768 : true)}
        isDraggable={!locked && (typeof window !== "undefined" ? window.innerWidth >= 768 : true)}
      >
        {visibleWidgets.profile && (
          <motion.div key="profile" className="bg-white rounded-xl shadow-md p-4 h-full">
            <ProfileCard />
          </motion.div>
        )}
        {visibleWidgets.metrics && (
          <motion.div key="metrics" className="bg-white rounded-xl shadow-md p-4 h-full">
            <MetricsWidget />
          </motion.div>
        )}
        {visibleWidgets.activity && (
          <motion.div key="activity" className="bg-white rounded-xl shadow-md p-4 h-full">
            <ActivityFeed />
          </motion.div>
        )}
        {visibleWidgets.employees && (
          <motion.div key="employees" className="bg-white rounded-xl shadow-md p-4 h-full">
            <EmployeeManagement />
          </motion.div>
        )}
      </ResponsiveGridLayout>

      {/* 🔄 Reset Modal */}
      <ResetLayoutModal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={handleReset}
      />
    </div>
  );
}



