"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Clock, UserPlus, Edit3, Trash2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";

interface Activity {
  id: string;
  message: string;
  type: string;
  severity: "info" | "warning" | "critical";
  created_at: string;
  actor_email: string | null;
  actor_role: string | null;
  target_email: string | null;
}

function timeAgo(dateString: string): string {
  const now = new Date();
  const past = new Date(dateString);
  const diff = Math.floor((now.getTime() - past.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return past.toLocaleDateString();
}

export default function AuditLogPage() {
  const router = useRouter();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  const [filterType, setFilterType] = useState<"all" | "user" | "admin">("all");
  const [filterRole, setFilterRole] = useState<"all" | "admin" | "manager" | "user">("all");
  const [filterSeverity, setFilterSeverity] = useState<"all" | "info" | "warning" | "critical">("all");
  const [search, setSearch] = useState("");

  const pageSize = 20;

  // 🔐 Role-based access
  useEffect(() => {
    const checkAccess = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please sign in");
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile || (profile.role !== "admin" && profile.role !== "manager")) {
        toast.error("Access denied");
        router.push("/dashboard");
      }
    };
    checkAccess();
  }, [router]);

  const fetchActivities = async (pageNumber: number) => {
    setLoading(true);

    let query = supabase
      .from("activities")
      .select("*")
      .order("created_at", { ascending: false })
      .range(pageNumber * pageSize, pageNumber * pageSize + pageSize - 1);

    // Filter by type
    if (filterType === "user") {
      query = query.neq("type", "admin_action");
    } else if (filterType === "admin") {
      query = query.eq("type", "admin_action");
    }

    // Filter by actor role
    if (filterRole !== "all") {
      query = query.eq("actor_role", filterRole);
    }

    // Filter by severity
    if (filterSeverity !== "all") {
      query = query.eq("severity", filterSeverity);
    }

    // Search filter
    if (search.trim() !== "") {
      query = query.or(
        `message.ilike.%${search.trim()}%,actor_email.ilike.%${search.trim()}%,target_email.ilike.%${search.trim()}%`
      );
    }

    const { data, error } = await query;
    if (error) {
      console.error(error);
    } else {
      setActivities(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchActivities(page);
  }, [page, filterType, filterRole, filterSeverity, search]);

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

  const severityBadge = (severity: string) => {
    const styles: Record<string, string> = {
      info: "bg-green-100 text-green-700",
      warning: "bg-yellow-100 text-yellow-700",
      critical: "bg-red-100 text-red-700",
    };
    return (
      <span
        className={`px-2 py-0.5 rounded text-xs font-medium ${
          styles[severity] || "bg-gray-100 text-gray-600"
        }`}
      >
        {severity}
      </span>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Card>
        <CardHeader>
          <CardTitle>🛡️ Full Audit Log</CardTitle>
        </CardHeader>
        <CardContent>
          {/* 🔍 Filters */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <Select value={filterType} onValueChange={(val) => setFilterType(val as any)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="user">User Activity</SelectItem>
                <SelectItem value="admin">Admin Actions</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterRole} onValueChange={(val) => setFilterRole(val as any)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterSeverity} onValueChange={(val) => setFilterSeverity(val as any)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Search by actor/target/message..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="md:w-1/3"
            />
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : activities.length === 0 ? (
            <p className="text-gray-500">No activities found</p>
          ) : (
            <div className="space-y-3">
              {activities.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition"
                >
                  <div className="mt-1">{getIcon(a.type)}</div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">
                      <strong>{a.actor_email || "Unknown"}</strong>{" "}
                      ({a.actor_role || "?"}) →{" "}
                      <strong>{a.target_email || "System"}</strong>
                    </p>
                    <p className="text-sm">{a.message}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-gray-400">{timeAgo(a.created_at)}</p>
                      {severityBadge(a.severity)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="flex justify-between items-center mt-6">
            <Button
              variant="outline"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              ← Previous
            </Button>
            <span className="text-sm text-gray-600">Page {page + 1}</span>
            <Button variant="outline" onClick={() => setPage((p) => p + 1)}>
              Next →
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

