"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Pencil,
  Check,
  X,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
} from "lucide-react";
import toast from "react-hot-toast";

interface Profile {
  id: string;
  email: string;
  role: string;
  employment_type: string;
  created_at: string;
  active: boolean;
}

export default function EmployeeManagement() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<string>("");
  const [editEmployment, setEditEmployment] = useState<string>("");

  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null); // ✅ store full user
  const [showInactive, setShowInactive] = useState(false);

  // ⚠️ Danger Mode toggle (for hard delete)
  const [dangerMode, setDangerMode] = useState(false);

  const fetchProfiles = async () => {
    setLoading(true);
    let query = supabase
      .from("profiles")
      .select("id, email, role, employment_type, created_at, active")
      .order("created_at", { ascending: false });

    if (!showInactive) {
      query = query.eq("active", true);
    }

    const { data, error } = await query;
    if (error) {
      toast.error("Failed to fetch employees");
    } else {
      setProfiles(data || []);
    }
    setLoading(false);
  };

  const fetchCurrentUserRole = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setCurrentUser(user); // ✅ keep actor info
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      setCurrentRole(profile?.role || null);
    }
  };

  useEffect(() => {
    fetchProfiles();
    fetchCurrentUserRole();
  }, [showInactive]);

  const logActivity = async ({
    message,
    type,
    severity,
    target,
  }: {
    message: string;
    type: string;
    severity: "info" | "warning" | "critical";
    target?: Profile;
  }) => {
    if (!currentUser) return;

    await supabase.from("activities").insert([
      {
        actor_id: currentUser.id,
        actor_email: currentUser.email,
        actor_role: currentRole,
        target_id: target?.id || null,
        target_email: target?.email || null,
        message,
        type,
        severity,
      },
    ]);

    // 🧹 Retention: delete logs older than 90 days
    await supabase.rpc("purge_old_activities", { days: 90 });
  };

  const handleEdit = (profile: Profile) => {
    setEditingId(profile.id);
    setEditRole(profile.role);
    setEditEmployment(profile.employment_type);
  };

  const handleSave = async (id: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ role: editRole, employment_type: editEmployment })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update employee");
    } else {
      const updated = profiles.find((p) => p.id === id);
      if (updated) {
        await logActivity({
          message: `Updated ${updated.email}: Role = ${editRole}, Employment = ${editEmployment}`,
          type: "role_updated",
          severity: "info",
          target: updated,
        });
      }
      toast.success("Employee updated");
      setEditingId(null);
      fetchProfiles();
    }
  };

  const handleCancel = () => setEditingId(null);

  // ✅ Soft delete = toggle active flag
  const toggleActive = async (profile: Profile) => {
    const newStatus = !profile.active;
    const { error } = await supabase
      .from("profiles")
      .update({ active: newStatus })
      .eq("id", profile.id);

    if (error) {
      toast.error("Failed to update status");
    } else {
      await logActivity({
        message: `${newStatus ? "Reactivated" : "Deactivated"} ${profile.email}`,
        type: "user_status",
        severity: "warning",
        target: profile,
      });
      toast.success(
        `${profile.email} has been ${
          newStatus ? "re-activated" : "deactivated"
        }`
      );
      fetchProfiles();
    }
  };

  // ✅ Hard delete (admins only, Danger Mode)
  const handleDelete = async (id: string) => {
    const toDelete = profiles.find((p) => p.id === id);
    if (!toDelete) return;

    if (
      !confirm(
        `⚠️ WARNING: Permanently deleting ${toDelete.email}!\n\nThis will:\n• Remove them from the system.\n• They will lose login access.\n• Their name may still appear on job history, estimates, or past records.\n\nAre you sure you want to proceed?`
      )
    ) {
      return;
    }

    const { error } = await supabase.from("profiles").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete employee");
    } else {
      await logActivity({
        message: `Deleted ${toDelete.email} (${toDelete.role}, ${toDelete.employment_type})`,
        type: "user_deleted",
        severity: "critical",
        target: toDelete,
      });
      toast.success("Employee permanently deleted");
      fetchProfiles();
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex justify-between items-center">
        <CardTitle>👑 Employee Management</CardTitle>
        <div className="flex gap-3">
          <button
            onClick={() => setShowInactive((prev) => !prev)}
            className="text-sm text-blue-600 hover:underline"
          >
            {showInactive ? "Hide Inactive" : "Show Inactive"}
          </button>
          {currentRole === "admin" && (
            <button
              onClick={() => setDangerMode((prev) => !prev)}
              className={`text-sm flex items-center gap-1 px-2 py-1 rounded ${
                dangerMode
                  ? "bg-red-100 text-red-600 border border-red-400"
                  : "text-red-500 hover:underline"
              }`}
            >
              <ShieldAlert size={14} />
              {dangerMode ? "Exit Delete Mode" : "Enter Delete Mode"}
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Loading employees...</p>
        ) : profiles.length === 0 ? (
          <p className="text-gray-500">No employees found.</p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 px-3">Email</th>
                <th className="py-2 px-3">Role</th>
                <th className="py-2 px-3">Employment</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Created</th>
                {currentRole === "admin" && (
                  <th className="py-2 px-3">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="py-2 px-3">{p.email}</td>
                  <td className="py-2 px-3">
                    {editingId === p.id ? (
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        className="border rounded px-2 py-1"
                      >
                        <option value="user">User</option>
                        <option value="manager">Manager</option>
                        <option value="tech">Tech</option>
                        <option value="dispatcher">Dispatcher</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      p.role
                    )}
                  </td>
                  <td className="py-2 px-3 capitalize">
                    {editingId === p.id ? (
                      <select
                        value={editEmployment}
                        onChange={(e) => setEditEmployment(e.target.value)}
                        className="border rounded px-2 py-1"
                      >
                        <option value="employee">Employee (W-2)</option>
                        <option value="contractor">1099 Contractor</option>
                      </select>
                    ) : (
                      p.employment_type
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {p.active ? (
                      <span className="text-green-600 font-medium">Active</span>
                    ) : (
                      <span className="text-red-500 font-medium">Inactive</span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                  {currentRole === "admin" && (
                    <td className="py-2 px-3 flex gap-2">
                      {editingId === p.id ? (
                        <>
                          <button
                            onClick={() => handleSave(p.id)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <Check size={18} />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <X size={18} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(p)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => toggleActive(p)}
                            className="text-yellow-600 hover:text-yellow-800"
                          >
                            {p.active ? (
                              <ToggleLeft size={18} />
                            ) : (
                              <ToggleRight size={18} />
                            )}
                          </button>
                          {dangerMode && (
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}









