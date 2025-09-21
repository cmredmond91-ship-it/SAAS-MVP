"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Clock, UserPlus, Edit3, Trash2, ShieldAlert } from "lucide-react";

interface Activity {
  id: string;
  message: string;
  type: string;
  created_at: string;
}

// Format "time ago"
function timeAgo(dateString: string): string {
  const now = new Date();
  const past = new Date(dateString);
  const diff = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return past.toLocaleDateString();
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentRole, setCurrentRole] = useState<string | null>(null);

  // ⏳ Time filter state
  const [timeFilter, setTimeFilter] = useState<"24h" | "7d" | "all">("7d");

  useEffect(() => {
    const fetchActivities = async () => {
      let query = supabase
        .from("activities")
        .select("*")
        .order("created_at", { ascending: false });

      // ⏳ Apply time filter
      if (timeFilter === "24h") {
        const since = new Date();
        since.setDate(since.getDate() - 1);
        query = query.gte("created_at", since.toISOString());
      } else if (timeFilter === "7d") {
        const since = new Date();
        since.setDate(since.getDate() - 7);
        query = query.gte("created_at", since.toISOString());
      }

      const { data } = await query.limit(50);
      setActivities(data || []);
    };

    fetchActivities();

    // Realtime subscription (always listens for new)
    const channel = supabase
      .channel("activities")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activities" },
        (payload) => {
          setActivities((prev) => [
            { ...(payload.new as Activity) },
            ...prev,
          ]);
        }
      )
      .subscribe();

    // Fetch current role
    const fetchRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        setCurrentRole(profile?.role || null);
      }
    };
    fetchRole();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [timeFilter]); // 🔑 re-run when filter changes

  // Choose icon by type
  const getIcon = (type: string) => {
    switch (type) {
      case "user_added":
        return <UserPlus className="text-green-500" size={18} />;
      case "role_updated":
        return <Edit3 className="text-blue-500" size={18} />;
      case "user_deleted":
        return <Trash2 className="text-red-500" size={18} />;
      case "user_status":
        return <Edit3 className="text-yellow-500" size={18} />;
      case "admin_action":
        return <ShieldAlert className="text-purple-500" size={18} />;
      default:
        return <Clock className="text-gray-400" size={18} />;
    }
  };

  const userActivities = activities.filter((a) => a.type !== "admin_action");
  const adminActivities = activities.filter((a) => a.type === "admin_action");

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <div className="flex gap-3 items-center mb-2">
        <span className="text-sm text-gray-600">Filter:</span>
        <button
          onClick={() => setTimeFilter("24h")}
          className={`text-sm px-3 py-1 rounded ${
            timeFilter === "24h"
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          Last 24h
        </button>
        <button
          onClick={() => setTimeFilter("7d")}
          className={`text-sm px-3 py-1 rounded ${
            timeFilter === "7d"
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          Last 7 days
        </button>
        <button
          onClick={() => setTimeFilter("all")}
          className={`text-sm px-3 py-1 rounded ${
            timeFilter === "all"
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          All
        </button>
      </div>

      {/* 📰 User Activity */}
      <Card>
        <CardHeader>
          <CardTitle>📰 User Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {userActivities.length === 0 ? (
            <p className="text-gray-500">No user activity yet</p>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
              {userActivities.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition"
                >
                  <div className="mt-1">{getIcon(a.type)}</div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{a.message}</p>
                    <p className="text-xs text-gray-400">{timeAgo(a.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 🛡️ Admin Actions (admins only) */}
      {currentRole === "admin" && (
        <Card>
          <CardHeader>
            <CardTitle>🛡️ Admin Actions</CardTitle>
          </CardHeader>
          <CardContent>
            {adminActivities.length === 0 ? (
              <p className="text-gray-500">No admin actions yet</p>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
                {adminActivities.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-start gap-3 p-3 border rounded-lg bg-purple-50 hover:bg-purple-100 transition"
                  >
                    <div className="mt-1">{getIcon(a.type)}</div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">{a.message}</p>
                      <p className="text-xs text-gray-400">{timeAgo(a.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}



